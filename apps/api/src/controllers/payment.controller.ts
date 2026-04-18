import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import cloudinary from '../config/cloudinary';
import { sendEmail, subscriptionReceipt, bankTransferPending } from '../services/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/** Fetch user name + email for sending receipts */
async function getUserInfo(userId: number): Promise<{ email: string; name: string } | null> {
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      role: true,
      profile: { select: { firstName: true } },
      partner: { select: { contactPerson: true, businessName: true } },
    },
  });
  if (!user) return null;
  const name =
    user.profile?.firstName ||
    user.partner?.contactPerson ||
    user.partner?.businessName ||
    user.email.split('@')[0];
  return { email: user.email, name };
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function dashboardUrl(role: string) {
  return role === 'PARTNER'
    ? `${CLIENT_URL}/partners/dashboard/upgrade`
    : `${CLIENT_URL}/dashboard/upgrade`;
}

// POST /api/payments/stripe/create-checkout-session
export async function createCheckoutSession(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { planId, durationMonths } = req.body;

    if (!planId || !durationMonths) {
      return res.status(400).json({ error: 'planId and durationMonths required' });
    }

    const plan = await (prisma as any).subscriptionPlan.findUnique({
      where: { id: Number(planId) },
      include: { prices: true },
    });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const price = plan.prices.find((p: any) => p.durationMonths === Number(durationMonths));
    if (!price) return res.status(404).json({ error: 'Price not found for this duration' });

    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });

    const isMatchmaker = user?.role === 'PARTNER';
    const successBase = isMatchmaker
      ? `${CLIENT_URL}/partners/dashboard/upgrade`
      : `${CLIENT_URL}/dashboard/upgrade`;

    const amountCents = Math.round(price.priceAmount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user?.email,
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `The Wedding Partners — ${plan.label} Plan`,
            description: `${durationMonths} month${Number(durationMonths) > 1 ? 's' : ''} subscription`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${successBase}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${successBase}?payment=cancelled`,
      metadata: {
        userId:        String(userId),
        planId:        String(planId),
        durationMonths: String(durationMonths),
        priceAmount:   String(price.priceAmount),
        userRole:      user?.role || 'USER',
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[createCheckoutSession]', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

// POST /api/payments/stripe/webhook  (raw body — registered before JSON middleware)
export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    console.error('[stripeWebhook] signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    if (session.payment_status === 'paid' && session.metadata) {
      const { userId, planId, durationMonths, priceAmount, userRole } = session.metadata;
      try {
        // Check idempotency
        const alreadyDone = await (prisma as any).userSubscription.findFirst({
          where: { userId: Number(userId), paymentRef: session.id, status: 'ACTIVE' },
        });
        if (alreadyDone) { res.json({ received: true }); return; }

        await (prisma as any).userSubscription.updateMany({
          where: { userId: Number(userId), status: 'ACTIVE' },
          data:  { status: 'CANCELLED' },
        });
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + Number(durationMonths));

        const plan = await (prisma as any).subscriptionPlan.findUnique({ where: { id: Number(planId) } });

        await (prisma as any).userSubscription.create({
          data: {
            userId: Number(userId), planId: Number(planId),
            durationMonths: Number(durationMonths), priceAmount: Number(priceAmount),
            currency: 'GBP', status: 'ACTIVE',
            startedAt: now, expiresAt, paymentRef: session.id,
          },
        });

        // Send receipt email
        const userInfo = await getUserInfo(Number(userId));
        if (userInfo && plan) {
          const { subject, html } = subscriptionReceipt({
            name: userInfo.name, planName: plan.label, planColor: plan.color,
            durationMonths: Number(durationMonths), amount: Number(priceAmount),
            currency: 'GBP', startDate: formatDate(now), expiryDate: formatDate(expiresAt),
            paymentRef: session.id,
            dashboardUrl: dashboardUrl(userRole || 'USER'),
          });
          await sendEmail({ to: userInfo.email, subject, html });
        }

        console.log(`[stripeWebhook] Subscription activated for user ${userId}`);
      } catch (err) {
        console.error('[stripeWebhook] DB error:', err);
      }
    }
  }

  res.json({ received: true });
}

// POST /api/payments/stripe/verify-session
export async function verifyStripeSession(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const session = await stripe.checkout.sessions.retrieve(sessionId) as any;
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Idempotency — webhook may have already activated it
    const existing = await (prisma as any).userSubscription.findFirst({
      where: { userId, paymentRef: session.id, status: 'ACTIVE' },
      include: { plan: true },
    });
    if (existing) {
      return res.json({ message: 'Subscription already active', data: existing });
    }

    const { planId, durationMonths, priceAmount, userRole } = session.metadata;

    await (prisma as any).userSubscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data:  { status: 'CANCELLED' },
    });

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + Number(durationMonths));

    const subscription = await (prisma as any).userSubscription.create({
      data: {
        userId, planId: Number(planId),
        durationMonths: Number(durationMonths), priceAmount: Number(priceAmount),
        currency: 'GBP', status: 'ACTIVE',
        startedAt: now, expiresAt, paymentRef: session.id,
      },
      include: { plan: true },
    });

    // Send receipt email
    const userInfo = await getUserInfo(userId);
    if (userInfo && subscription.plan) {
      const { subject, html } = subscriptionReceipt({
        name: userInfo.name, planName: subscription.plan.label, planColor: subscription.plan.color,
        durationMonths: Number(durationMonths), amount: Number(priceAmount),
        currency: 'GBP', startDate: formatDate(now), expiryDate: formatDate(expiresAt),
        paymentRef: session.id,
        dashboardUrl: dashboardUrl(userRole || 'USER'),
      });
      await sendEmail({ to: userInfo.email, subject, html });
    }

    console.log(`[verifyStripeSession] Subscription activated for user ${userId}`);
    res.json({ message: 'Subscription activated', data: subscription });
  } catch (err) {
    console.error('[verifyStripeSession]', err);
    res.status(500).json({ error: 'Failed to verify session' });
  }
}

// POST /api/payments/bank-transfer  (multipart/form-data with optional receipt image)
export async function createBankTransfer(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { planId, durationMonths, senderName, senderBank, transferRef } = req.body;

    if (!planId || !durationMonths || !senderName || !transferRef) {
      return res.status(400).json({ error: 'planId, durationMonths, senderName and transferRef are required' });
    }

    const plan = await (prisma as any).subscriptionPlan.findUnique({
      where: { id: Number(planId) },
      include: { prices: true },
    });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const price = plan.prices.find((p: any) => p.durationMonths === Number(durationMonths));
    if (!price) return res.status(404).json({ error: 'Price not found for this duration' });

    // Upload receipt image if provided
    let receiptImageUrl: string | null = null;
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file) {
      try {
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'twp/payment-receipts',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        });
        receiptImageUrl = result.secure_url;
      } catch (uploadErr) {
        console.error('[createBankTransfer] receipt upload failed:', uploadErr);
      }
    }

    await (prisma as any).userSubscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data:  { status: 'CANCELLED' },
    });

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + Number(durationMonths));

    const subscription = await (prisma as any).userSubscription.create({
      data: {
        userId, planId: Number(planId),
        durationMonths: Number(durationMonths), priceAmount: price.priceAmount,
        currency: 'GBP', status: 'PENDING',
        startedAt: now, expiresAt,
        paymentRef: `BANK:${transferRef}:${senderName}:${senderBank || ''}`,
        receiptImageUrl,
      },
      include: { plan: true },
    });

    // Send pending confirmation email
    const userInfo = await getUserInfo(userId);
    if (userInfo) {
      const userRecord = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
      const { subject, html } = bankTransferPending({
        name: userInfo.name, planName: plan.label, planColor: plan.color,
        durationMonths: Number(durationMonths), amount: price.priceAmount,
        currency: 'GBP', transferRef,
        dashboardUrl: dashboardUrl(userRecord?.role || 'USER'),
      });
      await sendEmail({ to: userInfo.email, subject, html });
    }

    res.status(201).json({
      message: 'Bank transfer recorded. Your subscription will be activated within 24 hours after payment verification.',
      data: subscription,
    });
  } catch (err) {
    console.error('[createBankTransfer]', err);
    res.status(500).json({ error: 'Failed to record bank transfer' });
  }
}
