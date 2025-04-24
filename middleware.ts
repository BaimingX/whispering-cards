import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // 创建Supabase中间件客户端
  const supabase = createMiddlewareClient({ req, res });
  
  // 刷新会话
  await supabase.auth.getSession();
  
  return res;
}

// 让除静态资源外的所有路由都走中间件
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 