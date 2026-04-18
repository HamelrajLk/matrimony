import { Router } from 'express';
import express from 'express';
import multer from 'multer';
import { createCheckoutSession, stripeWebhook, verifyStripeSession, createBankTransfer } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Stripe webhook — raw body MUST come before JSON middleware
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Stripe checkout session
router.post('/stripe/create-checkout-session', authenticate, createCheckoutSession);

// Verify Stripe session on success redirect (activates subscription when webhook hasn't fired yet)
router.post('/stripe/verify-session', authenticate, verifyStripeSession);

// Bank transfer submission (optional receipt image upload)
router.post('/bank-transfer', authenticate, receiptUpload.single('receipt'), createBankTransfer);

export default router;
