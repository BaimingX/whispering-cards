import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// 处理图片上传请求
export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 检查请求是否包含文件
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: '未提供有效文件' }, { status: 400 });
    }
    
    // 检查文件类型是否为图片
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '文件类型必须是图片' }, { status: 400 });
    }
    
    // 限制文件大小（4MB）
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: '图片大小不能超过4MB' }, { status: 400 });
    }
    
    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `card-images/${fileName}`;
    
    // 将文件读取为ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    
    // 上传到Supabase存储
    const { data, error } = await supabase.storage
      .from('whispering-cards')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600'
      });
    
    if (error) {
      console.error('Supabase存储上传错误:', error);
      return NextResponse.json({ error: '图片上传失败' }, { status: 500 });
    }
    
    // 获取公共URL
    const { data: urlData } = supabase.storage
      .from('whispering-cards')
      .getPublicUrl(filePath);
    
    return NextResponse.json({ 
      url: urlData.publicUrl,
      path: filePath,
      message: '上传成功'
    });
  } catch (error) {
    console.error('上传图片处理失败:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '上传失败，服务器错误' 
    }, { status: 500 });
  }
} 