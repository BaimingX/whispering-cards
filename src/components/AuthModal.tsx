'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { IoMdClose } from 'react-icons/io';
import { signIn } from 'next-auth/react';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // 当点击ESC键时关闭模态框
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // 防止模态框开启时页面滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 切换登录/注册模式时重置表单
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  // 邮箱密码登录
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.refresh();
      onClose();
    } catch (error: any) {
      console.error('登录错误:', error);
      setError(error.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 邮箱注册
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证密码
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // 注册成功
      setError(null);
      setMode('login');
      alert('注册邮件已发送，请查收并点击链接完成注册');
    } catch (error: any) {
      console.error('注册错误:', error);
      setError(error.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Google登录 - 使用NextAuth
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
      // 注意: signIn会重定向，所以下面的代码不会执行
    } catch (error: any) {
      console.error('Google登录错误:', error);
      setError(error.message || 'Google登录失败，请重试');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-800 rounded-lg shadow-2xl p-8 border border-purple-900/30 animate-fadeIn">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <IoMdClose size={24} />
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-300 mb-2">呓语之牌</h1>
          <p className="text-gray-400">
            {mode === 'login' ? '登录以解锁神秘力量' : '注册成为创作者'}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-900/30 p-4 text-red-200 mb-6">
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* 邮箱表单 */}
          <form onSubmit={mode === 'login' ? handleEmailLogin : handleEmailRegister}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  邮箱
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border-gray-700 bg-gray-700/50 px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  密码
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border-gray-700 bg-gray-700/50 px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="••••••••"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                    确认密码
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-md border-gray-700 bg-gray-700/50 px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 transition-colors"
              >
                {loading
                  ? '处理中...'
                  : mode === 'login'
                  ? '登录'
                  : '注册'}
              </button>
            </div>
          </form>

          {/* 分隔线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">或继续使用</span>
            </div>
          </div>

          {/* Google登录 */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-md transition duration-200"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <FcGoogle size={20} />
                使用Google账号登录
              </>
            )}
          </button>

          {/* 切换登录/注册 */}
          <div className="text-center text-sm">
            <p className="text-gray-400">
              {mode === 'login' ? '没有账号？' : '已有账号？'}
              <button
                onClick={toggleMode}
                className="ml-1 font-medium text-purple-400 hover:text-purple-300"
              >
                {mode === 'login' ? '注册' : '登录'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 