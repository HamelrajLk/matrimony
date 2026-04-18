/**
 * Integration tests for /api/auth routes.
 * Prisma is mocked so no real database is required.
 */
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app';

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

jest.mock('../services/email.service', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from '../lib/prisma';
const db = prisma as any;

beforeAll(() => {
  process.env.JWT_SECRET = 'integration-test-secret';
  process.env.CLIENT_URL = 'http://localhost:3000';
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/register
// ════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
  it('registers a new individual user (201)', async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({ id: 1, email: 'new@example.com', role: 'USER' });

    const res = await request(app).post('/api/auth/register').send({
      role: 'USER',
      name: 'New User',
      email: 'new@example.com',
      password: 'Secure@123',
      gender: 'MALE',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.role).toBe('USER');
  });

  it('registers a new partner (201)', async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({ id: 2, email: 'partner@biz.com', role: 'PARTNER' });
    db.partner.create.mockResolvedValue({ id: 10, userId: 2 });
    db.partnerTypeAssignment.createMany.mockResolvedValue({ count: 1 });

    const res = await request(app).post('/api/auth/register').send({
      role: 'PARTNER',
      businessName: 'Wedding Studio',
      contactPerson: 'Owner Name',
      businessEmail: 'partner@biz.com',
      phone: '+94771234567',
      password: 'Secure@123',
      services: ['PHOTOGRAPHER'],
    });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('PARTNER');
  });

  it('returns 409 when email already registered', async () => {
    db.user.findUnique.mockResolvedValue({ id: 1, email: 'existing@example.com' });

    const res = await request(app).post('/api/auth/register').send({
      role: 'USER',
      name: 'Duplicate',
      email: 'existing@example.com',
      password: 'Secure@123',
      gender: 'MALE',
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('returns 400 for validation errors', async () => {
    const res = await request(app).post('/api/auth/register').send({
      role: 'USER',
      name: '',
      email: 'bad-email',
      password: 'weak',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
  let hash: string;

  beforeAll(async () => {
    hash = await bcrypt.hash('Secure@123', 10);
  });

  it('returns token for valid credentials (200)', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      password: hash,
      role: 'USER',
      status: 'ACTIVE',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'Secure@123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.role).toBe('USER');
  });

  it('returns 401 for wrong password', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      password: hash,
      role: 'USER',
      status: 'ACTIVE',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'WrongPass@1',
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 for nonexistent user', async () => {
    db.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@example.com',
      password: 'Secure@123',
    });

    expect(res.status).toBe(401);
  });

  it('returns 403 for deactivated account', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 2,
      email: 'inactive@example.com',
      password: hash,
      role: 'USER',
      status: 'INACTIVE',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'inactive@example.com',
      password: 'Secure@123',
    });

    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'notvalid',
      password: 'Secure@123',
    });

    expect(res.status).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// GET /api/auth/me
// ════════════════════════════════════════════════════════════════════════════
describe('GET /api/auth/me', () => {
  let validToken: string;

  beforeAll(() => {
    const jwt = require('jsonwebtoken');
    validToken = jwt.sign({ userId: 1, role: 'USER' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  it('returns user profile for authenticated request', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      phone: null,
      role: 'USER',
      status: 'ACTIVE',
      subscriptionPlan: 'FREE',
      createdAt: new Date(),
      partnerProfile: null,
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('user@example.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/logout
// ════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/logout', () => {
  it('returns 200 with valid token', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: 1, role: 'USER' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// ════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/forgot-password', () => {
  it('returns 200 regardless of whether email exists (anti-enumeration)', async () => {
    db.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'anyone@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if that email exists/i);
  });

  it('sends reset email and stores token when user exists', async () => {
    db.user.findUnique.mockResolvedValue({ id: 1, email: 'user@example.com' });
    db.user.update.mockResolvedValue({});

    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'user@example.com',
    });

    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalled();
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'not-an-email',
    });
    expect(res.status).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// ════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/reset-password', () => {
  it('resets password with valid token (200)', async () => {
    db.user.findFirst.mockResolvedValue({
      id: 1,
      passwordResetToken: 'validtoken123',
      passwordResetExpires: new Date(Date.now() + 3600000),
    });
    db.user.update.mockResolvedValue({});

    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'validtoken123',
      password: 'NewSecure@1',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset successfully/i);
  });

  it('returns 400 for expired/invalid token', async () => {
    db.user.findFirst.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'expiredtoken',
      password: 'NewSecure@1',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });

  it('returns 400 for weak new password', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'tok',
      password: 'weak',
    });
    expect(res.status).toBe(400);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// GET /health
// ════════════════════════════════════════════════════════════════════════════
describe('GET /health', () => {
  it('returns { status: ok }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
