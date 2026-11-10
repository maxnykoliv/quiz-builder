import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';

beforeEach(async () => {
  await prisma.quiz.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
