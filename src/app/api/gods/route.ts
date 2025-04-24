import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    // 获取所有古神数据
    const { data: old_gods, error } = await supabase
      .from('old_gods')
      .select('*');
    
    if (error) throw error;
    
    return NextResponse.json(old_gods);
  } catch (error) {
    console.error('获取古神列表失败:', error);
    return NextResponse.json({ error: '获取古神列表失败' }, { status: 500 });
  }
} 