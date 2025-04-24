import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// 扩展全局命名空间解决TypeScript错误
declare global {
  // eslint-disable-next-line no-var
  var prismaDb: PrismaClient | undefined;
}

// 防止开发环境中创建多个实例
const prismaGlobal = global as unknown as { prismaDb: PrismaClient | undefined };

// 初始化Prisma客户端
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!prismaGlobal.prismaDb) {
    prismaGlobal.prismaDb = new PrismaClient();
  }
  prisma = prismaGlobal.prismaDb;
}

// 初始化 Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export { prisma, supabase };
export default prisma; 