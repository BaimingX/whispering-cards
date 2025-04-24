import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 获取用户
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 获取用户拥有的所有卡牌实例
    const cardInstances = await prisma.cardInstance.findMany({
      where: {
        userId: user.id
      },
      include: {
        card: {
          include: {
            oldGod: true // 包含古神信息
          }
        }
      }
    });
    
    return NextResponse.json(cardInstances);
  } catch (error) {
    console.error('获取用户卡牌失败:', error);
    return NextResponse.json({ error: '获取用户卡牌失败' }, { status: 500 });
  }
} 