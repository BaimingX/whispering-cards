import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Rarity, Card } from '@/core/types';
import { getUser } from '@/lib/auth';

// 根据稀有度获取卡牌权重
function getWeightByRarity(rarity: Rarity): number {
  switch (rarity) {
    case Rarity.COMMON:
      return 60;
    case Rarity.RARE:
      return 30;
    case Rarity.LEGENDARY:
      return 8;
    default:
      return 0;
  }
}

// 加权随机选择卡牌
async function getRandomCard(): Promise<Card> {
  const cards = await prisma.card.findMany();
  
  if (cards.length === 0) {
    throw new Error('没有可用的卡牌');
  }
  
  // 计算权重总和
  let totalWeight = 0;
  const weightedCards = cards.map((card: Card) => {
    const weight = getWeightByRarity(card.rarity as Rarity);
    totalWeight += weight;
    return { card, weight };
  });
  
  // 随机选择一张卡牌
  let random = Math.random() * totalWeight;
  for (const { card, weight } of weightedCards) {
    random -= weight;
    if (random <= 0) {
      return card;
    }
  }
  
  // 如果随机选择失败，返回第一张卡牌
  return cards[0];
}

// 检查用户今天是否已经抽过卡
async function hasUserDrawnToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
  
  const count = await prisma.cardDraw.count({
    where: {
      userId: userId,
      date: today
    }
  });
  
  return count > 0;
}

// 获取用户今天抽到的卡牌
async function getUserTodayCard(userId: string) {
  // 获取用户最近创建的卡牌实例
  const cardInstance = await prisma.cardInstance.findFirst({
    where: {
      userId: userId
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      card: true
    }
  });
  
  return { cardInstance };
}

export async function GET(req: NextRequest) {
  try {
    // 获取用户信息
    const user = await getUser(req);
    
    if (!user) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }
    
    const userId = user.id;
    
    // 检查用户今天是否已经抽过卡
    const hasDrawn = await hasUserDrawnToday(userId);
    
    if (hasDrawn) {
      // 如果已经抽过卡，返回今天抽到的卡牌
      const todayDraw = await getUserTodayCard(userId);
      return NextResponse.json({ 
        message: '今天已经抽过卡了',
        cardInstance: todayDraw?.cardInstance 
      });
    } else {
      // 如果没有抽过卡，随机抽一张
      const card = await getRandomCard();
      
      try {
        // 创建卡牌实例
        const cardInstance = await prisma.cardInstance.create({
          data: {
            userId: userId,
            cardId: card.id,
            quality: 'COMMON'
          },
          include: {
            card: true
          }
        });
        
        // 记录抽卡历史
        await prisma.cardDraw.create({
          data: {
            userId: userId,
            date: new Date().toISOString().split('T')[0],
            canDrawAgain: false
          }
        });
        
        console.log(`用户 ${userId} 抽到了卡牌 ${card.name}`);
        
        return NextResponse.json({ 
          message: '抽卡成功',
          cardInstance: cardInstance 
        });
      } catch (innerError) {
        console.error('创建卡牌实例失败:', innerError);
        return NextResponse.json({ message: '抽卡失败，数据库操作错误' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('抽卡失败:', error);
    return NextResponse.json({ message: '抽卡失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 获取用户信息
    const user = await getUser(req);
    
    if (!user) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    // 解析请求体
    const { shareId } = await req.json();
    
    if (!shareId) {
      return NextResponse.json({ error: '缺少分享ID' }, { status: 400 });
    }
    
    // 实现分享功能的逻辑
    // ...
    
    return NextResponse.json({ message: '分享成功' });
  } catch (error) {
    console.error('分享失败:', error);
    return NextResponse.json({ message: '分享失败' }, { status: 500 });
  }
} 