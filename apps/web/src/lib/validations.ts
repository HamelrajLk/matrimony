import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'One uppercase letter required')
  .regex(/[0-9]/, 'One number required')
  .regex(/[^A-Za-z0-9]/, 'One special character required');

export const individualSignupSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: z.string().optional(),
    country: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE'], { error: 'Please select your gender' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const partnerServiceValues = [
  'MATCHMAKER', 'PHOTOGRAPHER', 'VENUE', 'TRANSPORT',
  'MAKEUP_ARTIST', 'FLORIST', 'CATERING', 'DJ_MUSIC',
  'CAKE_DESIGNER', 'VIDEOGRAPHER', 'OTHER',
] as const;

export const partnerSignupSchema = z
  .object({
    businessName: z.string().min(2, 'Business name is required'),
    contactPerson: z.string().min(2, 'Contact person name is required'),
    businessEmail: z.string().email('Invalid email address'),
    phone: z.string().min(7, 'Phone number is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
    services: z.array(z.enum(partnerServiceValues)).min(1, 'Select at least one service'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type IndividualSignupForm = z.infer<typeof individualSignupSchema>;
export type PartnerSignupForm = z.infer<typeof partnerSignupSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type PartnerService = (typeof partnerServiceValues)[number];
