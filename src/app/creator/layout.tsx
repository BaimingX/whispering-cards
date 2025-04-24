import Link from 'next/link';
import { ReactNode } from 'react';

export const metadata = {
  title: '创作者空间 - 呓语之牌',
  description: '设计你自己的卡牌和剧本，创造独特的呓语世界',
};

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* 侧边导航栏 */}
      <aside className="w-64 bg-gray-900/80 border-r border-purple-900/30 p-6 hidden md:block">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-purple-300 mb-2">创作者空间</h2>
          <p className="text-sm text-gray-400">构建你的呓语宇宙</p>
        </div>
        
        <nav className="space-y-1">
          <NavItem href="/creator" exact>
            仪表盘
          </NavItem>
          <NavItem href="/creator/cards">
            卡牌设计
          </NavItem>
          <NavItem href="/creator/gods">
            古神设定
          </NavItem>
          <NavItem href="/creator/scenarios">
            剧本编写
          </NavItem>
          <div className="pt-4 mt-4 border-t border-purple-900/30">
            <NavItem href="/creator/settings">
              设置
            </NavItem>
          </div>
        </nav>
      </aside>

      {/* 移动端导航 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-purple-900/30 p-2 z-10">
        <div className="flex justify-around">
          <MobileNavItem href="/creator" icon="home" />
          <MobileNavItem href="/creator/cards" icon="cards" />
          <MobileNavItem href="/creator/gods" icon="gods" />
          <MobileNavItem href="/creator/scenarios" icon="scenarios" />
        </div>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 bg-gray-800/40 p-6 md:p-8 overflow-auto pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}

function NavItem({ 
  href, 
  children, 
  exact = false 
}: { 
  href: string; 
  children: ReactNode; 
  exact?: boolean;
}) {
  // 当前路径逻辑会在客户端实现
  const isActive = false;
  
  return (
    <Link 
      href={href}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-purple-900/30 text-purple-200' 
          : 'text-gray-300 hover:bg-purple-900/20 hover:text-purple-200'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavItem({ href, icon }: { href: string; icon: string }) {
  // 图标映射
  const icons = {
    home: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    cards: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    gods: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    scenarios: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  };

  return (
    <Link href={href} className="flex flex-col items-center p-2 text-gray-400 hover:text-purple-300">
      {icons[icon as keyof typeof icons]}
      <span className="text-xs mt-1">
        {icon === 'home' ? '主页' : 
         icon === 'cards' ? '卡牌' : 
         icon === 'gods' ? '古神' : 
         icon === 'scenarios' ? '剧本' : ''}
      </span>
    </Link>
  );
} 