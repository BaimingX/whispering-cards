'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 在服务器组件 / Route Handlers 中创建 Supabase 客户端
// 参考官方 "Next.js Server-Side Auth" 示例，并实现 getAll / setAll
export async function createClient() {
  // ① cookies() 在 Next.js 15+ 返回 Promise，需要 await
  const cookieStore = await cookies();

  // ② 返回 Supabase Server-Side 客户端
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Supabase@v2 要求实现 getAll / setAll
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions);
          });
        },
      },
    },
  );
} 