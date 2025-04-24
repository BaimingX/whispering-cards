import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 定义EffectType枚举，与schema.prisma中保持一致
enum EffectType {
  PASSIVE = "PASSIVE",
  CONSUME = "CONSUME",
  RETURN = "RETURN",
  KEY = "KEY"
}

export async function GET() {
  try {
    // 直接从EffectImplementation获取数据，不再使用CardEffect
    const effectImplementations = await prisma.effectImplementation.findMany({
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
      },
      where: {
        is_active: true
      },
      orderBy: {
        type: 'asc'
      }
    });

    // 格式化数据以符合前端期望的格式
    const formattedEffects = effectImplementations.map(effect => ({
      id: effect.id,
      type: effect.type,
      name: effect.name,
      description: effect.description || ''
    }));

    return NextResponse.json(formattedEffects);
  } catch (error) {
    console.error('获取效果实现数据失败:', error);
    return NextResponse.json(
      { error: '获取卡牌效果数据失败' },
      { status: 500 }
    );
  }
} 