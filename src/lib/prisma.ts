import { PrismaClient } from '@prisma/client';

// 在开发环境中，防止热重载创建多个Prisma客户端实例
// 在生产环境中，为每个请求创建一个新的Prisma客户端
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;