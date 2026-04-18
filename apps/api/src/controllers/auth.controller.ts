import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendOtpSchema,
} from '../utils/validations';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationOtp,
} from '../services/email.service';
import { AuthRequest } from '../middleware/auth.middleware';
import type { JWTPayload } from '../types/auth.types';

const signToken = (userId: number, role: string): string =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const data = parsed.data;

    const emailToCheck = data.role === 'PARTNER' ? data.businessEmail : data.email;

    const existing = await prisma.user.findUnique({ where: { email: emailToCheck } });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    if (data.role === 'USER') {
      const otp = generateOtp();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const user = await (prisma.user.create as any)({
        data: {
          email: data.email,
          password: passwordHash,
          phone: data.phone,
          role: 'USER',
          status: 'PENDING',
          emailVerifyOtp: otp,
          emailVerifyOtpExpires: otpExpires,
          ownProfile: {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              gender: data.gender,
              dateOfBirth: new Date('2000-01-01'),
              maritalStatus: 'UNMARRIED',
              status: 'INCOMPLETE',
            },
          },
        },
        include: { ownProfile: { select: { id: true } } },
      });

      const token = signToken(user.id, user.role);
      sendVerificationOtp(user.email, otp).catch(() => {});

      return res.status(201).json({
        user: { id: user.id, email: user.email, role: user.role },
        token,
        role: user.role,
        profileId: user.ownProfile?.id ?? null,
        emailVerified: false,
      });
    }

    // PARTNER signup
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await (prisma.user.create as any)({
      data: {
        email: data.businessEmail,
        password: passwordHash,
        phone: data.phone,
        role: 'PARTNER',
        status: 'PENDING',
        emailVerifyOtp: otp,
        emailVerifyOtpExpires: otpExpires,
      },
    });

    const partner = await prisma.partner.create({
      data: {
        userId: user.id,
        businessName: data.businessName,
        businessEmail: data.businessEmail,
        contactPerson: data.contactPerson,
        status: 'ACTIVE',
      },
    });

    await prisma.partnerTypeAssignment.createMany({
      data: data.services.map((type) => ({ partnerId: partner.id, type: type as any })),
      skipDuplicates: true,
    });

    const token = signToken(user.id, user.role);
    sendVerificationOtp(user.email, otp).catch(() => {});

    return res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
      token,
      role: user.role,
      emailVerified: false,
    });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const { email, otp } = parsed.data;

    const user = await (prisma.user as any).findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (user.emailVerifiedAt) {
      return res.json({ message: 'Email already verified', alreadyVerified: true });
    }

    if (!user.emailVerifyOtp || !user.emailVerifyOtpExpires) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > new Date(user.emailVerifyOtpExpires)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.emailVerifyOtp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    await (prisma.user as any).update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
        emailVerifyOtp: null,
        emailVerifyOtpExpires: null,
      },
    });

    sendWelcomeEmail(user.email, user.email.split('@')[0], user.role).catch(() => {});

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('[verifyEmail]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function resendOtp(req: Request, res: Response) {
  try {
    const parsed = resendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const { email } = parsed.data;
    const user = await (prisma.user as any).findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (user.emailVerifiedAt) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await (prisma.user as any).update({
      where: { id: user.id },
      data: { emailVerifyOtp: otp, emailVerifyOtpExpires: otpExpires },
    });

    sendVerificationOtp(user.email, otp).catch(() => {});

    return res.json({ message: 'A new OTP has been sent to your email' });
  } catch (err) {
    console.error('[resendOtp]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({ message: 'Admin login is not available here.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user.id, user.role);

    return res.json({
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
      token,
      role: user.role,
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user?.userId) },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        subscriptionPlan: true,
        createdAt: true,
        partnerProfile: {
          select: {
            id: true,
            businessName: true,
            contactPerson: true,
            businessEmail: true,
            status: true,
            types: { select: { type: true } },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function logout(_req: Request, res: Response) {
  return res.json({ message: 'Logged out successfully' });
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: rawToken, passwordResetExpires: expires },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
    const name = user.email.split('@')[0];
    sendPasswordResetEmail(user.email, name, resetLink).catch(() => {});

    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[forgotPassword]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten().fieldErrors });
    }

    const { token, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return res.json({ message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    console.error('[resetPassword]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
