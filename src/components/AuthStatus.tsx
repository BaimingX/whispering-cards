"use client";

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import AuthModal from './AuthModal';

export default function AuthStatus() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { data: session } = useSession();

  // 加载Supabase用户会话
  useEffect(() => {
    const getUser = async () => {
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      setSupabaseUser(supabaseSession?.user || null);
      setLoading(false);

      // 设置auth状态监听
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSupabaseUser(session?.user || null);
          router.refresh();
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    getUser();
  }, [supabase, router]);

  // 登出 - 同时处理Supabase和NextAuth
  const handleSignOut = async () => {
    if (supabaseUser) {
      await supabase.auth.signOut();
    }
    
    if (session) {
      await nextAuthSignOut({ callbackUrl: '/' });
    } else {
      router.refresh();
    }
  };

  // 打开登录模态框
  const openModal = () => {
    setIsModalOpen(true);
  };

  // 关闭登录模态框
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // 判断是否已登录 - 从Supabase或NextAuth
  const isLoggedIn = supabaseUser || session;
  const user = supabaseUser || session?.user;

  if (loading && !session) {
    return <div className="text-sm">加载中...</div>;
  }

  if (!isLoggedIn) {
    return (
      <>
        <button 
          onClick={openModal} 
          className="px-3 py-1 rounded-md transition-colors hover:bg-muted"
        >
          登录
        </button>
        <AuthModal isOpen={isModalOpen} onClose={closeModal} />
      </>
    );
  }

  // 获取显示名称 - 优先使用显示名，然后是邮箱
  const displayName = 
    user?.user_metadata?.full_name || // Supabase格式
    user?.name ||                     // NextAuth格式
    user?.email ||                    // 两者共有
    '用户';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">
        {displayName}
      </span>
      <button 
        onClick={handleSignOut} 
        className="text-sm hover:text-purple-300 transition-colors"
      >
        退出
      </button>
    </div>
  );
} 