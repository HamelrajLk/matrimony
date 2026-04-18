import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const individualRegisterSchema = z.object({
  role: z.literal('USER'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  phone: z.string().optional(),
  country: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE'], { error: 'Gender is required' }),
});

const partnerTypeValues = [
  'MATCHMAKER', 'PHOTOGRAPHER', 'VENUE', 'TRANSPORT',
  'MAKEUP_ARTIST', 'FLORIST', 'CATERING', 'DJ_MUSIC',
  'CAKE_DESIGNER', 'VIDEOGRAPHER', 'OTHER',
] as const;

export const partnerRegisterSchema = z.object({
  role: z.literal('PARTNER'),
  businessName: z.string().min(2, 'Business name is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  businessEmail: z.string().email('Invalid business email'),
  phone: z.string().min(7, 'Phone number is required'),
  password: passwordSchema,
  services: z
    .array(z.enum(partnerTypeValues))
    .min(1, 'Select at least one service'),
});

export const registerSchema = z.discriminatedUnion('role', [
  individualRegisterSchema,
  partnerRegisterSchema,
]);

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resendOtpSchema = z.object({
  email: z.string().email('Invalid email'),
});
