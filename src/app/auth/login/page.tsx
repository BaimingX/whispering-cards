'use client';

import { useState, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 提取使用useSearchParams的部分到单独组件
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/creator/cards';

  const supabase = createClientComponentClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // 登录成功，重定向到之前尝试访问的页面
      router.push(redirect);
      router.refresh();
    } catch (error: any) {
      console.error('登录错误:', error);
      setError(error.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-purple-400">登录</h1>
        <p className="mt-2 text-gray-400">访问创作者功能需要登录</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-900/30 p-4 text-red-200">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="mt-8 space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            邮箱
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            密码
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-purple-600 py-2 px-4 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-400"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-400">
          没有账号？
          <Link href="/auth/signup" className="ml-1 font-medium text-purple-400 hover:text-purple-300">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}

// 加载中显示的内容
function LoginFormFallback() {
  return (
    <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-purple-400">登录</h1>
        <p className="mt-2 text-gray-400">加载中...</p>
      </div>
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
} 