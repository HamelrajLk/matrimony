import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// GET /api/subscriptions/plans?audience=INDIVIDUAL
export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const audience = (req.query.audience as string) || 'INDIVIDUAL';

    const plans = await (prisma as any).subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        prices: { orderBy: { durationMonths: 'asc' } },
        features: {
          include: {
            feature: true,
          },
          where: {
            feature: {
              isActive: true,
              OR: [
                { audience: audience },
                { audience: 'ALL' },
              ],
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({ message: 'Plans fetched', data: plans });
  } catch (error) {
    console.error('getSubscriptionPlans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

// GET /api/subscriptions/me
export const getMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const subscription = await (prisma as any).userSubscription.findFirst({
      where: { userId, status: 'ACTIVE', expiresAt: { gt: new Date() } },
      include: { plan: true },
      orderBy: { expiresAt: 'desc' },
    });

    res.json({ message: 'Subscription fetched', data: subscription });
  } catch (error) {
    console.error('getMySubscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

// POST /api/subscriptions/subscribe
export const subscribe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { planId, durationMonths, paymentRef } = req.body;

    if (!planId || !durationMonths) {
      return res.status(400).json({ error: 'planId and durationMonths required' });
    }

    const plan = await (prisma as any).subscriptionPlan.findUnique({ where: { id: Number(planId) } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    // For FREE plan, no payment needed
    let priceAmount = 0;
    if (plan.value !== 'FREE') {
      const price = await (prisma as any).subscriptionPlanPrice.findUnique({
        where: { planId_durationMonths: { planId: Number(planId), durationMonths: Number(durationMonths) } },
      });
      if (!price) return res.status(404).json({ error: 'Price not found for this duration' });
      priceAmount = price.priceAmount;
    }

    // Deactivate existing active subscriptions
    await (prisma as any).userSubscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + Number(durationMonths));

    const subscription = await (prisma as any).userSubscription.create({
      data: {
        userId,
        planId: Number(planId),
        durationMonths: Number(durationMonths),
        priceAmount,
        currency: 'LKR',
        status: plan.value === 'FREE' ? 'ACTIVE' : 'PENDING',
        startedAt: now,
        expiresAt,
        paymentRef: paymentRef || null,
      },
      include: { plan: true },
    });

    res.status(201).json({ message: 'Subscription created', data: subscription });
  } catch (error) {
    console.error('subscribe error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};
