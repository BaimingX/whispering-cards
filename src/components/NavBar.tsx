"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from 'next-auth/react';
import AuthStatus from './AuthStatus';

export default function NavBar() {
  const pathname = usePathname();
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
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
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    getUser();
  }, [supabase]);
  
  // 判断是否已登录 - 从Supabase或NextAuth
  const isLoggedIn = supabaseUser || session;
  
  const navItems = [
    { name: "首页", path: "/" },
    { name: "每日抽卡", path: "/daily" },
    { name: "神谕", path: "/oracle" },
    { name: "场景", path: "/scenario" },
    { 
      name: "创作者", 
      path: "/creator", 
      requireAuth: true 
    }
  ];

  return (
    <div className="flex space-x-4 items-center">
      <nav className="flex space-x-4 py-2">
        {navItems.map((item) => {
          if (item.requireAuth && !isLoggedIn) {
            return null;
          }
          
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`px-3 py-1 rounded-md transition-colors ${
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
      <AuthStatus />
    </div>
  );
}
 