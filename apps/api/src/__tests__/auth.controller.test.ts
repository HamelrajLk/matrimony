import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { register, login, me, logout, forgotPassword, resetPassword } from '../controllers/auth.controller';

// ── Prisma mock ──────────────────────────────────────────────────────────────
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    partner: {
      create: jest.fn(),
    },
    partnerTypeAssignment: {
      createMany: jest.fn(),
    },
  },
}));

// ── Email service mock ───────────────────────────────────────────────────────
jest.mock('../services/email.service', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from '../lib/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// ── Helpers ──────────────────────────────────────────────────────────────────
function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(body: object = {}, headers: object = {}, user?: object): Request {
  return { body, headers, user } as unknown as Request;
}

const JWT_SECRET = 'test-secret';

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.CLIENT_URL = 'http://localhost:3000';
});

// ════════════════════════════════════════════════════════════════════════════
// REGISTER
// ════════════════════════════════════════════════════════════════════════════
describe('register', () => {
  describe('USER registration', () => {
    const userPayload = {
      role: 'USER',
      name: 'Amal Perera',
      email: 'amal@example.com',
      password: 'Secure@123',
      phone: '+94771234567',
      gender: 'MALE',
    };

    it('creates a new user and returns 201 with token', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'amal@example.com',
        role: 'USER',
      });

      const req = mockReq(userPayload);
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall).toHaveProperty('token');
      expect(jsonCall.role).toBe('USER');
    });

    it('returns 409 when email already exists', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, email: 'amal@example.com' });

      const req = mockReq(userPayload);
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      const json = (res.json as jest.Mock).mock.calls[0][0];
      expect(json.message).toMatch(/already exists/i);
    });

    it('returns 400 for invalid payload (missing name)', async () => {
      const req = mockReq({ ...userPayload, name: '' });
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for weak password', async () => {
      const req = mockReq({ ...userPayload, password: 'weak' });
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('PARTNER registration', () => {
    const partnerPayload = {
      role: 'PARTNER',
      businessName: 'Dream Photos',
      contactPerson: 'Nimali Silva',
      businessEmail: 'nimali@dreamphotos.lk',
      phone: '+94771234567',
      password: 'Secure@123',
      services: ['PHOTOGRAPHER'],
    };

    it('creates partner, user, and assignments and returns 201', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 2,
        email: 'nimali@dreamphotos.lk',
        role: 'PARTNER',
      });
      (mockPrisma.partner.create as jest.Mock).mockResolvedValue({ id: 10, userId: 2 });
      (mockPrisma.partnerTypeAssignment.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const req = mockReq(partnerPayload);
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockPrisma.partner.create).toHaveBeenCalled();
      expect(mockPrisma.partnerTypeAssignment.createMany).toHaveBeenCalled();
    });

    it('returns 400 when services is empty', async () => {
      const req = mockReq({ ...partnerPayload, services: [] });
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for missing contactPerson', async () => {
      const req = mockReq({ ...partnerPayload, contactPerson: '' });
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  it('returns 500 on unexpected database error', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = mockReq({
      role: 'USER',
      name: 'Test',
      email: 'test@example.com',
      password: 'Secure@123',
      gender: 'MALE',
    });
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════════════════
describe('login', () => {
  const password = 'Secure@123';
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(password, 10);
  });

  it('returns token for valid credentials', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      password: passwordHash,
      role: 'USER',
      status: 'ACTIVE',
    });

    const req = mockReq({ email: 'user@example.com', password });
    const res = mockRes();

    await login(req, res);

    expect(res.json).toHaveBeenCalled();
    const json = (res.json as jest.Mock).mock.calls[0][0];
    expect(json).toHaveProperty('token');
    expect(json.role).toBe('USER');
  });

  it('returns 401 for wrong password', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      password: passwordHash,
      role: 'USER',
      status: 'ACTIVE',
    });

    const req = mockReq({ email: 'user@example.com', password: 'WrongPass@1' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when user not found', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = mockReq({ email: 'unknown@example.com', password: 'Pass@1234' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 for inactive user', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 2,
      email: 'inactive@example.com',
      password: passwordHash,
      role: 'USER',
      status: 'INACTIVE',
    });

    const req = mockReq({ email: 'inactive@example.com', password });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const json = (res.json as jest.Mock).mock.calls[0][0];
    expect(json.message).toMatch(/deactivated/i);
  });

  it('returns 403 for ADMIN role', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 3,
      email: 'admin@example.com',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const req = mockReq({ email: 'admin@example.com', password });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 400 for invalid email format', async () => {
    const req = mockReq({ email: 'notanemail', password: 'Pass@1234' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for missing password', async () => {
    const req = mockReq({ email: 'user@example.com', password: '' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on database error', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB'));

    const req = mockReq({ email: 'user@example.com', password });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ME
// ════════════════════════════════════════════════════════════════════════════
describe('me', () => {
  it('returns user profile for authenticated request', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      phone: '+94771234567',
      role: 'USER',
      status: 'ACTIVE',
      subscriptionPlan: 'FREE',
      createdAt: new Date(),
      partnerProfile: null,
    });

    const req = mockReq({}, {}, { id: '1', email: 'user@example.com', userType: 'USER' });
    const res = mockRes();

    await (me as Function)(req, res);

    expect(res.json).toHaveBeenCalled();
    const json = (res.json as jest.Mock).mock.calls[0][0];
    expect(json.user.email).toBe('user@example.com');
  });

  it('returns 404 when user not found', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = mockReq({}, {}, { id: '999', email: 'ghost@example.com', userType: 'USER' });
    const res = mockRes();

    await (me as Function)(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// LOGOUT
// ════════════════════════════════════════════════════════════════════════════
describe('logout', () => {
  it('returns 200 with success message', async () => {
    const req = mockReq();
    const res = mockRes();

    await logout(req, res);

    expect(res.json).toHaveBeenCalled();
    const json = (res.json as jest.Mock).mock.calls[0][0];
    expect(json.message).toMatch(/logged out/i);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ════════════════════════════════════════════════════════════════════════════
describe('forgotPassword', () => {
  it('returns 200 even when email does not exist (anti-enumeration)', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = mockReq({ email: 'unknown@example.com' });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.json).toHaveBeenCalled();
    const json = (res.json as jest.Mock).mock.calls[0][0];
    expect(json.message).toMatch(/if that email exists/i);
  });

  it('stores reset token and returns 200 when user exists', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'user@example.com',
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

    const req = mockReq({ email: 'user@example.com' });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(mockPrisma.user.update).toHaveBeenCalled();
    const updateCall = (mockPrisma.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data).toHaveProperty('passwordResetToken');
    expect(updateCall.data).toHaveProperty('passwordResetExpires');

    expect(res.json).toHaveBeenCalled();
  });

  it('returns 400 for invalid email format', async () => {
    const req = mockReq({ email: 'bad-email' });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// ════════════════════════════════════════════════════════════════════════════
describe('resetPassword', () => {
  it('resets password successfully with valid token', async () => {
    (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      passwordResetToken: 'validtoken',
      passwordResetExpires: new Date(Date.now() + 3600000),
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

    const req = mockReq({ token: 'validtoken', password: 'NewSecure@1' });
    const res = mockRes();

    await resetPassword(req, res);

    expect(mockPrisma.user.update).toHaveBeenCalled();
    const updateCall = (mockPrisma.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.passwordResetToken).toBeNull();
    expect(updateCall.data.passwordResetExpires).toBeNull();

    expect(res.json).toHaveBeenCalled();
    const json = (res.json as jest.Mock).mock.calls[0][0];
    expect(json.message).toMatch(/reset successfully/i);
  });

  it('returns 400 for expired or invalid token', async () => {
    (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    const req = mockReq({ token: 'expiredtoken', password: 'NewSecure@1' });
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const json = (res.json as jest.Mock).mock.calls[0][0];
    expect(json.message).toMatch(/invalid or has expired/i);
  });

  it('returns 400 for weak password', async () => {
    const req = mockReq({ token: 'tok', password: 'weak' });
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
