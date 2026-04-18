import {
  individualSignupSchema,
  partnerSignupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations';

// ─── individualSignupSchema ───────────────────────────────────────────────────
describe('individualSignupSchema', () => {
  const valid = {
    name: 'Amal Perera',
    email: 'amal@example.com',
    password: 'Secure@123',
    confirmPassword: 'Secure@123',
    phone: '+94771234567',
    gender: 'MALE' as const,
  };

  it('accepts valid individual signup data', () => {
    expect(individualSignupSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects when passwords do not match', () => {
    const result = individualSignupSchema.safeParse({
      ...valid,
      confirmPassword: 'Different@1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.confirmPassword).toBeDefined();
    }
  });

  it('rejects short name', () => {
    expect(individualSignupSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(individualSignupSchema.safeParse({ ...valid, email: 'notvalid' }).success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    expect(
      individualSignupSchema.safeParse({
        ...valid,
        password: 'secure@123',
        confirmPassword: 'secure@123',
      }).success,
    ).toBe(false);
  });

  it('rejects password without number', () => {
    expect(
      individualSignupSchema.safeParse({
        ...valid,
        password: 'Secure@abc',
        confirmPassword: 'Secure@abc',
      }).success,
    ).toBe(false);
  });

  it('rejects password without special character', () => {
    expect(
      individualSignupSchema.safeParse({
        ...valid,
        password: 'Secure1234',
        confirmPassword: 'Secure1234',
      }).success,
    ).toBe(false);
  });

  it('rejects password shorter than 8 chars', () => {
    expect(
      individualSignupSchema.safeParse({
        ...valid,
        password: 'S@1',
        confirmPassword: 'S@1',
      }).success,
    ).toBe(false);
  });

  it('phone is optional', () => {
    const { phone: _, ...withoutPhone } = valid;
    expect(individualSignupSchema.safeParse(withoutPhone).success).toBe(true);
  });
});

// ─── partnerSignupSchema ──────────────────────────────────────────────────────
describe('partnerSignupSchema', () => {
  const valid = {
    businessName: 'Dream Photos',
    contactPerson: 'Nimali Silva',
    businessEmail: 'nimali@dreamphotos.lk',
    phone: '+94771234567',
    password: 'Secure@123',
    confirmPassword: 'Secure@123',
    services: ['PHOTOGRAPHER'],
  };

  it('accepts valid partner signup data', () => {
    expect(partnerSignupSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects when passwords do not match', () => {
    const result = partnerSignupSchema.safeParse({
      ...valid,
      confirmPassword: 'Other@123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.confirmPassword).toBeDefined();
    }
  });

  it('rejects empty businessName', () => {
    expect(partnerSignupSchema.safeParse({ ...valid, businessName: '' }).success).toBe(false);
  });

  it('rejects empty contactPerson', () => {
    expect(partnerSignupSchema.safeParse({ ...valid, contactPerson: '' }).success).toBe(false);
  });

  it('rejects invalid businessEmail', () => {
    expect(partnerSignupSchema.safeParse({ ...valid, businessEmail: 'notanemail' }).success).toBe(false);
  });

  it('rejects phone shorter than 7 characters', () => {
    expect(partnerSignupSchema.safeParse({ ...valid, phone: '12345' }).success).toBe(false);
  });

  it('rejects empty services array', () => {
    expect(partnerSignupSchema.safeParse({ ...valid, services: [] }).success).toBe(false);
  });

  it('rejects invalid service type', () => {
    expect(partnerSignupSchema.safeParse({ ...valid, services: ['INVALID'] }).success).toBe(false);
  });

  it('accepts multiple valid services', () => {
    expect(
      partnerSignupSchema.safeParse({
        ...valid,
        services: ['PHOTOGRAPHER', 'VIDEOGRAPHER', 'VENUE'],
      }).success,
    ).toBe(true);
  });

  it('accepts all valid service enum values', () => {
    const all = [
      'MATCHMAKER', 'PHOTOGRAPHER', 'VENUE', 'TRANSPORT',
      'MAKEUP_ARTIST', 'FLORIST', 'CATERING', 'DJ_MUSIC',
      'CAKE_DESIGNER', 'VIDEOGRAPHER', 'OTHER',
    ];
    expect(partnerSignupSchema.safeParse({ ...valid, services: all }).success).toBe(true);
  });
});

// ─── loginSchema ──────────────────────────────────────────────────────────────
describe('loginSchema', () => {
  it('accepts valid login data', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'anypass' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'bad', password: 'pass' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false);
  });
});

// ─── forgotPasswordSchema ─────────────────────────────────────────────────────
describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false);
  });
});

// ─── resetPasswordSchema ──────────────────────────────────────────────────────
describe('resetPasswordSchema', () => {
  it('accepts matching strong passwords', () => {
    expect(
      resetPasswordSchema.safeParse({ password: 'NewPass@1', confirmPassword: 'NewPass@1' }).success,
    ).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'NewPass@1',
      confirmPassword: 'Other@123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.confirmPassword).toBeDefined();
    }
  });

  it('rejects weak password', () => {
    expect(
      resetPasswordSchema.safeParse({ password: 'weak', confirmPassword: 'weak' }).success,
    ).toBe(false);
  });
});
