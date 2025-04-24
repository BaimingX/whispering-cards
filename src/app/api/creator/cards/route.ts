import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

// 处理卡牌创建请求
export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 解析请求体
    const data = await req.json();
    
    // 验证必填字段
    if (!data.name || !data.description || !data.instruction) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }
    
    // 创建卡牌
    const card = await prisma.card.create({
      data: {
        name: data.name,
        description: data.description,
        instruction: data.instruction,
        scope: data.scope,
        rarity: data.rarity,
        carry_out: data.carryOut,
        max_durability: data.maxDurability ? parseInt(data.maxDurability) : null,
        art_url: data.artUrl,
        final_card_url: data.finalCardUrl,
        creator: {
          connect: {
            id: user.id
          }
        }
      }
    });
    
    // 添加卡牌属性
    if (data.attributes && data.attributes.length > 0) {
      for (const attr of data.attributes) {
        await prisma.cardAttribute.create({
          data: {
            card_id: card.id,
            key: attr.key,
            value: attr.value
          }
        });
      }
    }
    
    // 处理卡牌效果 - 使用新的CardEffectLink模型直接存储效果和参数
    if (data.effectData && data.effectData.effectType && data.effectData.effectImplementationId) {
      // 直接创建卡牌效果链接，params包含所有参数
      await prisma.cardEffectLink.create({
        data: {
          card_id: card.id,
          implementation_id: data.effectData.effectImplementationId,
          params: {
            value: data.effectData.effectValue || 0,
            description: data.effectData.effectDescription || ''
          },
          target: 'SELF' // 默认为自身
        }
      });
    }
    
    return NextResponse.json({
      message: '卡牌创建成功',
      card: card
    });
  } catch (error) {
    console.error('创建卡牌失败:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '创建卡牌失败，服务器错误' 
    }, { status: 500 });
  }
}

// 获取创建者的所有卡牌
export async function GET(req: NextRequest) {
  try {
    // 验证用户身份
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 查询所有卡牌（按创建时间倒序）
    const cards = await prisma.card.findMany({
      where: {
        creator: {
          id: user.id
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // 查询每张卡牌的属性和效果
    const cardsWithDetails = await Promise.all(
      cards.map(async (card) => {
        const attributes = await prisma.cardAttribute.findMany({
          where: { card_id: card.id }
        });
        
        // 查询卡牌效果 - 使用新的CardEffectLink
        const effectLinks = await prisma.cardEffectLink.findMany({
          where: { card_id: card.id },
          include: { implementation: true }
        });
        
        return {
          ...card,
          attributes,
          effects: effectLinks.map((link) => ({
            type: link.implementation.type,
            implementation: link.implementation,
            params: link.params,
            target: link.target
          }))
        };
      })
    );
    
    return NextResponse.json(cardsWithDetails);
  } catch (error) {
    console.error('获取卡牌列表失败:', error);
    return NextResponse.json({ error: '获取卡牌列表失败' }, { status: 500 });
  }
} 