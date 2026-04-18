import {
  individualRegisterSchema,
  partnerRegisterSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validations';

// ─── individualRegisterSchema ─────────────────────────────────────────────────
describe('individualRegisterSchema', () => {
  const valid = {
    role: 'USER' as const,
    name: 'Amal Perera',
    email: 'amal@example.com',
    password: 'Secure@123',
    phone: '+94771234567',
    gender: 'MALE' as const,
  };

  it('accepts a valid individual registration', () => {
    expect(individualRegisterSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = individualRegisterSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name shorter than 2 characters', () => {
    const result = individualRegisterSchema.safeParse({ ...valid, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = individualRegisterSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = individualRegisterSchema.safeParse({ ...valid, password: 'Ab@1' });
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const result = individualRegisterSchema.safeParse({ ...valid, password: 'secure@123' });
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = individualRegisterSchema.safeParse({ ...valid, password: 'Secure@abc' });
    expect(result.success).toBe(false);
  });

  it('rejects password without special character', () => {
    const result = individualRegisterSchema.safeParse({ ...valid, password: 'Secure1234' });
    expect(result.success).toBe(false);
  });

  it('phone is optional', () => {
    const { phone: _, ...noPhone } = valid;
    expect(individualRegisterSchema.safeParse(noPhone).success).toBe(true);
  });
});

// ─── partnerRegisterSchema ────────────────────────────────────────────────────
describe('partnerRegisterSchema', () => {
  const valid = {
    role: 'PARTNER' as const,
    businessName: 'Dream Photos',
    contactPerson: 'Nimali Silva',
    businessEmail: 'nimali@dreamphotos.lk',
    phone: '+94771234567',
    password: 'Secure@123',
    services: ['PHOTOGRAPHER'],
  };

  it('accepts a valid partner registration', () => {
    expect(partnerRegisterSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts multiple services', () => {
    const result = partnerRegisterSchema.safeParse({
      ...valid,
      services: ['PHOTOGRAPHER', 'VIDEOGRAPHER'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty businessName', () => {
    const result = partnerRegisterSchema.safeParse({ ...valid, businessName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty contactPerson', () => {
    const result = partnerRegisterSchema.safeParse({ ...valid, contactPerson: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid businessEmail', () => {
    const result = partnerRegisterSchema.safeParse({ ...valid, businessEmail: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects phone shorter than 7 chars', () => {
    const result = partnerRegisterSchema.safeParse({ ...valid, phone: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects empty services array', () => {
    const result = partnerRegisterSchema.safeParse({ ...valid, services: [] });
    expect(result.success).toBe(false);
  });

  it('rejects invalid service type', () => {
    const result = partnerRegisterSchema.safeParse({ ...valid, services: ['INVALID_SERVICE'] });
    expect(result.success).toBe(false);
  });

  it('accepts all valid service types', () => {
    const allServices = [
      'MATCHMAKER', 'PHOTOGRAPHER', 'VENUE', 'TRANSPORT',
      'MAKEUP_ARTIST', 'FLORIST', 'CATERING', 'DJ_MUSIC',
      'CAKE_DESIGNER', 'VIDEOGRAPHER', 'OTHER',
    ];
    const result = partnerRegisterSchema.safeParse({ ...valid, services: allServices });
    expect(result.success).toBe(true);
  });
});

// ─── registerSchema (discriminatedUnion) ─────────────────────────────────────
describe('registerSchema (discriminatedUnion)', () => {
  it('routes USER role to individualRegisterSchema', () => {
    const result = registerSchema.safeParse({
      role: 'USER',
      name: 'Test User',
      email: 'test@example.com',
      password: 'Secure@123',
      gender: 'MALE',
    });
    expect(result.success).toBe(true);
  });

  it('routes PARTNER role to partnerRegisterSchema', () => {
    const result = registerSchema.safeParse({
      role: 'PARTNER',
      businessName: 'Studio',
      contactPerson: 'Owner',
      businessEmail: 'owner@studio.com',
      phone: '+94701234567',
      password: 'Secure@123',
      services: ['VENUE'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown role', () => {
    const result = registerSchema.safeParse({ role: 'ADMIN' });
    expect(result.success).toBe(false);
  });
});

// ─── loginSchema ──────────────────────────────────────────────────────────────
describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'anyPass1' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'notEmail', password: 'pass' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

// ─── forgotPasswordSchema ─────────────────────────────────────────────────────
describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'reset@example.com' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false);
  });
});

// ─── resetPasswordSchema ──────────────────────────────────────────────────────
describe('resetPasswordSchema', () => {
  it('accepts valid token and strong password', () => {
    expect(
      resetPasswordSchema.safeParse({ token: 'abc123', password: 'NewPass@1' }).success,
    ).toBe(true);
  });

  it('rejects empty token', () => {
    expect(resetPasswordSchema.safeParse({ token: '', password: 'NewPass@1' }).success).toBe(false);
  });

  it('rejects weak password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: 'weak' }).success).toBe(false);
  });
});
