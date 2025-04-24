import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    // 创建一个supabase客户端用于服务器路由处理
    const supabase = createRouteHandlerClient({ cookies });
    
    // 使用code交换session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 重定向到首页或者之前的页面
  return NextResponse.redirect(new URL('/', request.url));
} 