import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

// 验证分享ID
const verifyShare = (shareId: string): boolean => {
  // 这里可以加入更复杂的验证逻辑
  // 例如将shareId解码并验证签名
  return !!shareId && shareId.length > 10;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shareId } = body;
    
    // 验证分享ID
    if (!shareId || !verifyShare(shareId)) {
      return NextResponse.json(
        { error: 'INVALID_SHARE', message: '无效的分享' }, 
        { status: 400 }
      );
    }
    
    // 获取用户
    const user = await getUser(req);
    const today = new Date().toISOString().slice(0, 10);
    
    // 更新抽卡记录，允许再次抽卡
    await prisma.cardDraw.upsert({
      where: { 
        userId_date: { 
          userId: user.id, 
          date: today 
        } 
      },
      create: { 
        userId: user.id, 
        date: today, 
        canDrawAgain: true 
      },
      update: { 
        canDrawAgain: true 
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Share callback error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '处理分享失败' }, 
      { status: 500 }
    );
  }
} 