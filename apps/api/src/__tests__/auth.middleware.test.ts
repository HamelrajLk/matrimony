import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const JWT_SECRET = 'test-secret';

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('authenticate middleware', () => {
  it('attaches decoded user to req and calls next() for valid token', () => {
    const token = jwt.sign({ userId: 1, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
    const req: Partial<AuthRequest> = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = mockRes();
    const next: NextFunction = jest.fn();

    authenticate(req as AuthRequest, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });

  it('returns 401 when no token is provided', () => {
    const req: Partial<AuthRequest> = { headers: {} };
    const res = mockRes();
    const next: NextFunction = jest.fn();

    authenticate(req as AuthRequest, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    const json = (res.json as jest.Mock).mock.calls[0][0];
    expect(json.message).toMatch(/no token/i);
  });

  it('returns 401 for an expired token', () => {
    const token = jwt.sign({ userId: 1, role: 'USER' }, JWT_SECRET, { expiresIn: '-1s' });
    const req: Partial<AuthRequest> = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = mockRes();
    const next: NextFunction = jest.fn();

    authenticate(req as AuthRequest, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for a tampered token', () => {
    const token = jwt.sign({ userId: 1, role: 'USER' }, 'wrong-secret', { expiresIn: '1h' });
    const req: Partial<AuthRequest> = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res = mockRes();
    const next: NextFunction = jest.fn();

    authenticate(req as AuthRequest, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    const json = (res.json as jest.Mock).mock.calls[0][0];
    expect(json.message).toMatch(/invalid token/i);
  });

  it('returns 401 for malformed authorization header', () => {
    const req: Partial<AuthRequest> = {
      headers: { authorization: 'NotBearer something' },
    };
    const res = mockRes();
    const next: NextFunction = jest.fn();

    authenticate(req as AuthRequest, res, next);

    // Token is "something" which is not a valid JWT
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
