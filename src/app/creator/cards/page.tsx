'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CardsPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/creator/cards', {
          credentials: 'include'  // 确保发送cookies
        });
        
        if (!response.ok) {
          throw new Error('获取卡牌失败');
        }
        
        const data = await response.json();
        setCards(data);
      } catch (err) {
        console.error('获取卡牌错误:', err);
        setError(err instanceof Error ? err.message : '加载卡牌失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCards();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-200">卡牌设计</h1>
          <p className="text-gray-400 mt-2">创建和管理你的呓语之牌</p>
        </div>
        <Link 
          href="/creator/cards/new" 
          className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-md shadow-md transition-colors"
        >
          创建新卡牌
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : cards.length > 0 ? (
        <div className="flex flex-wrap gap-8 justify-center">
          {cards.map(card => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-800/70 rounded-lg p-12 border border-purple-900/20 text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-600 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" 
            />
          </svg>
          <h3 className="text-xl font-medium text-purple-200 mb-2">还没有卡牌</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            创建你的第一张卡牌，设定其属性、效果和艺术风格。你的卡牌可以在剧本中使用或分享给其他玩家。
          </p>
          <Link 
            href="/creator/cards/new" 
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-md shadow-md transition-colors"
          >
            创建第一张卡牌
          </Link>
        </div>
      )}
    </div>
  );
}

function CardItem({ card }: { card: CardData }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/creator/cards/${card.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('删除卡牌失败');
      }
      
      // 刷新页面或使用客户端状态管理更新列表
      window.location.reload();
    } catch (err) {
      console.error('删除卡牌错误:', err);
      alert('删除卡牌失败，请重试');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const toggleDeleteConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(!showDeleteConfirm);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="relative group">
      <Link href={`/creator/cards/${card.id}`} className="block">
        <div className="w-[295px] h-[420px] relative overflow-hidden rounded-lg shadow-lg border border-purple-900/30 hover:border-purple-500/50 transition-all">
          {card.final_card_url ? (
            <Image 
              src={card.final_card_url} 
              alt={card.name}
              className="w-full h-full object-contain"
              width={295}
              height={420}
              unoptimized
            />
          ) : card.art_url ? (
            <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-800 flex items-center justify-center">
              <Image 
                src={card.art_url} 
                alt={card.name}
                className="w-4/5 h-4/5 object-contain"
                width={240}
                height={340}
                unoptimized
              />
              <div className="absolute bottom-4 left-0 right-0 text-center text-lg font-bold text-white bg-black/50 py-2">
                {card.name}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-medium text-purple-200 mb-2">{card.name}</h3>
              <p className="text-gray-400 text-sm px-4 text-center line-clamp-2">{card.description}</p>
            </div>
          )}
          
          <div className="absolute top-2 right-2 z-10">
            <RarityBadge rarity={card.rarity} />
          </div>
          
          <div className="absolute top-2 left-2 z-10">
            <ScopeBadge scope={card.scope} />
          </div>
        </div>
      </Link>
      
      {/* 删除按钮 */}
      <button
        onClick={toggleDeleteConfirm}
        className="absolute top-2 right-2 bg-black/70 text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
        title="删除卡牌"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      
      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center z-30">
          <div className="bg-gray-800 p-4 rounded-lg max-w-[250px] text-center">
            <p className="text-white mb-4">确定要删除卡牌 "{card.name}" 吗？</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                disabled={isDeleting}
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </button>
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RarityBadge({ rarity }: { rarity: string }) {
  const colors = {
    COMMON: 'bg-gray-600 text-gray-200',
    RARE: 'bg-blue-600 text-blue-100',
    MYTHIC: 'bg-purple-600 text-purple-100',
    LEGENDARY: 'bg-yellow-600 text-yellow-100',
  };
  
  const labels = {
    COMMON: '普通',
    RARE: '稀有',
    MYTHIC: '神话',
    LEGENDARY: '传奇',
  };

  return (
    <span className={`${colors[rarity as keyof typeof colors]} text-xs px-2 py-1 rounded-md font-medium`}>
      {labels[rarity as keyof typeof labels]}
    </span>
  );
}

function ScopeBadge({ scope }: { scope: string }) {
  const style = scope === 'GLOBAL' 
    ? 'bg-green-900/30 text-green-300 border-green-700/30' 
    : 'bg-blue-900/30 text-blue-300 border-blue-700/30';
  
  const label = scope === 'GLOBAL' ? '全局' : '剧本';
  
  return (
    <span className={`${style} text-xs px-2 py-0.5 rounded border text-center`}>
      {label}
    </span>
  );
}

// 类型定义
interface CardData {
  id: string;
  name: string;
  description: string;
  rarity: string;
  scope: string;
  art_url: string | null;
  final_card_url: string | null;
  created_at: string;
  updated_at: string;
  attributes: Array<{key: string, value: number}>;
  effects?: Array<any>;
} 