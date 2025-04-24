import { NextRequest, NextResponse } from 'next/server';
import { prisma, supabase as supabaseAdmin } from '@/lib/db';
import { getUser } from '@/lib/auth';

// 工具：提取 Supabase 存储路径
function parseStoragePath(url: string | null) {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
  return m ? { bucket: m[1], path: m[2] } : null;
}

// 获取卡牌详情
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(_req);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const card = await prisma.card.findFirst({
      where: { id: params.id, creator_id: user.id },
      include: { attributes: true },
    });

    if (!card) {
      return NextResponse.json({ error: '卡牌不存在或无权访问' }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (e) {
    console.error('获取卡牌详情失败:', e);
    return NextResponse.json({ error: '获取卡牌详情失败' }, { status: 500 });
  }
}

// 删除卡牌
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser(_req);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    // 先找卡牌 & 权限
    const card = await prisma.card.findFirst({
      where: { id: params.id, creator_id: user.id },
      select: { id: true, art_url: true, final_card_url: true },
    });

    if (!card) {
      return NextResponse.json({ error: '卡牌不存在或无权删除' }, { status: 404 });
    }

    // 1. 删除属性
    await prisma.cardAttribute.deleteMany({ where: { card_id: params.id } });

    // TODO：如有其他关联表，同样 deleteMany

    // 2. 删除卡牌
    await prisma.card.delete({ where: { id: params.id } });

    // 3. 清理存储图片（忽略失败）
    const artPath = parseStoragePath(card.art_url);
    const finalPath = parseStoragePath(card.final_card_url);
    try {
      if (artPath) await supabaseAdmin.storage.from(artPath.bucket).remove([artPath.path]);
      if (finalPath) await supabaseAdmin.storage.from(finalPath.bucket).remove([finalPath.path]);
    } catch (err) {
      console.error('删除 Supabase 存储图片失败:', err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('删除卡牌失败:', err);
    return NextResponse.json({ error: '删除卡牌失败' }, { status: 500 });
  }
} 