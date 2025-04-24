'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/core/types';

export default function DailyDrawPage() {
  const [card, setCard] = useState<Card | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const router = useRouter();

  // 抽卡函数
  const drawCard = async () => {
    setIsDrawing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/draw');
      const data = await response.json();
      
      if (response.ok) {
        // 处理API返回的cardInstance数据
        if (data.cardInstance && data.cardInstance.card) {
          setCard(data.cardInstance.card);
        } else if (data.message === '今天已经抽过卡了') {
          setError(data.message);
        } else {
          setError('获取卡牌信息失败');
        }
        setTimeout(() => setIsFlipped(true), 500); // 延迟翻牌，有动画效果
      } else {
        setError(data.message || '抽卡失败');
      }
    } catch (err) {
      setError('网络错误，请稍后再试');
    } finally {
      setIsDrawing(false);
    }
  };
  
  // 页面加载时自动抽卡
  useEffect(() => {
    drawCard();
  }, []);
  
  // 跳转到占卜页面，带上卡牌信息
  const goToOracle = () => {
    if (card && card.old_god_id) {
      router.push(`/oracle?godId=${card.old_god_id}`);
    } else {
      router.push('/oracle');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">每日抽卡</h1>
        
        {error ? (
          <div className="bg-red-900/50 border border-red-700 p-4 rounded-lg mb-6 text-center">
            <p>{error}</p>
            {error === '今天已经抽过卡了' && (
              <button 
                onClick={() => router.push('/oracle')}
                className="mt-4 px-6 py-2 bg-purple-800 hover:bg-purple-700 rounded-lg transition"
              >
                前往占卜
              </button>
            )}
          </div>
        ) : isDrawing ? (
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg animate-pulse flex justify-center">
            <div className="w-16 h-16 border-4 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : card ? (
          <div className="mb-8">
            <div className={`card-container ${isFlipped ? 'flipped' : ''}`}>
              <div className="card-inner">
                <div className="card-back bg-gray-800 rounded-lg p-6 shadow-xl flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg">点击查看</p>
                  </div>
                </div>
                <div className="card-front bg-gray-800 rounded-lg p-6 shadow-xl">
                  {card.old_god && (
                    <div className="mb-2 flex items-center">
                      <div className="bg-purple-900 text-xs px-2 py-1 rounded-full">
                        {card.old_god.name}
                      </div>
                      {card.old_god.alias && (
                        <div className="ml-2 text-xs opacity-70">
                          {card.old_god.alias}
                        </div>
                      )}
                    </div>
                  )}
                  <h2 className="text-2xl font-bold mb-2">{card.name}</h2>
                  <div className="bg-gray-700 px-2 py-1 rounded text-xs inline-block mb-3">
                    {card.rarity}
                  </div>
                  <p className="text-gray-300 mb-4">{card.lore}</p>
                  <div className="text-sm text-purple-300">加成值: +{card.mod}</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        
        {card && (
          <div className="flex flex-col space-y-3 mt-8">
            <button
              onClick={goToOracle}
              className="px-6 py-3 bg-purple-800 hover:bg-purple-700 rounded-lg transition"
              disabled={isDrawing}
            >
              前往占卜 {card.old_god ? `(${card.old_god.name})` : ''}
            </button>
            
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              {isFlipped ? '隐藏卡牌' : '显示卡牌'}
            </button>
          </div>
        )}
      </div>
      
      {/* 卡牌翻转样式 */}
      <style jsx>{`
        .card-container {
          perspective: 1000px;
          height: 350px;
          width: 100%;
        }
        
        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
        
        .flipped .card-inner {
          transform: rotateY(180deg);
        }
        
        .card-front, .card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
        }
        
        .card-front {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
} 