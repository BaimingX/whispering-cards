import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 定义EffectType枚举，与schema.prisma中保持一致
enum EffectType {
  PASSIVE = "PASSIVE",
  CONSUME = "CONSUME",
  RETURN = "RETURN",
  KEY = "KEY"
}

export async function GET(request: Request) {
  try {
    // 从URL获取type参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    let implementations;
    
    if (type) {
      // 如果提供了type，则按type过滤
      implementations = await prisma.effectImplementation.findMany({
        where: {
          type: type as EffectType,
          is_active: true
        },
        select: {
          id: true,
          type: true,
          code: true,
          name: true,
          description: true,
          param_schema: true
        },
        orderBy: {
          name: 'asc'
        }
      });
    } else {
      // 否则返回所有活跃的实现
      implementations = await prisma.effectImplementation.findMany({
        where: {
          is_active: true
        },
        select: {
          id: true,
          type: true,
          code: true,
          name: true,
          description: true,
          param_schema: true
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' }
        ]
      });
    }

    return NextResponse.json(implementations);
  } catch (error) {
    console.error('获取效果实现数据失败:', error);
    return NextResponse.json(
      { error: '获取效果实现数据失败' },
      { status: 500 }
    );
  }
} 