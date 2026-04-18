import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '../generated/prisma/client';

const prisma = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prisma);
});

export { prisma };
