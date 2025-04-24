import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // 获取所有古神数据
    const old_gods = await prisma.oldGod.findMany();
    
    return NextResponse.json(old_gods);
  } catch (error) {
    console.error('获取古神列表失败:', error);
    return NextResponse.json({ error: '获取古神列表失败' }, { status: 500 });
  }
} 