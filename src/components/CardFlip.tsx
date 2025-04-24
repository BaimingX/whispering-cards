import React, { useState, useEffect } from 'react';
import { Card } from '@/core/types';

type CardFlipProps = {
  card?: Card;
  isLoading?: boolean;
  onFlip?: () => void;
};

export default function CardFlip({ card, isLoading = false, onFlip }: CardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // 重置翻转状态当卡片变化时
  useEffect(() => {
    setIsFlipped(false);
    setIsRevealed(false);
  }, [card]);

  const handleClick = () => {
    if (isLoading) return;
    
    setIsFlipped(true);
    
    // 添加延迟以匹配动画
    setTimeout(() => {
      setIsRevealed(true);
      if (onFlip) onFlip();
    }, 600); // 与CSS动画持续时间匹配
  };

  const getRarityColor = () => {
    if (!card) return 'border-gray-700';
    
    switch (card.rarity) {
      case 'COMMON':
        return 'border-gray-400';
      case 'RARE':
        return 'border-blue-400';
      case 'LEGENDARY':
        return 'border-purple-400';
      default:
        return 'border-gray-700';
    }
  };

  return (
    <div className="flex justify-center items-center my-8">
      <div 
        className={`card-container w-64 h-96 cursor-pointer perspective-1000 ${isFlipped ? 'is-flipped' : ''}`}
        onClick={handleClick}
      >
        <div className="card-flipper relative w-full h-full transition-transform duration-600 transform-style-3d">
          {/* 卡片正面 */}
          <div className={`card-front absolute w-full h-full backface-hidden bg-gray-800 flex justify-center items-center rounded-lg shadow-xl ${getRarityColor()} border-2`}>
            <div className="text-center p-6">
              <h3 className="text-xl font-bold text-purple-300">呓语之牌</h3>
              <p className="mt-4 text-gray-400">点击翻转</p>
              {isLoading && (
                <div className="mt-6">
                  <div className="loader"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* 卡片背面 */}
          <div className={`card-back absolute w-full h-full backface-hidden bg-gray-800 rounded-lg shadow-xl ${getRarityColor()} border-2 transform rotate-y-180`}>
            {card && isRevealed ? (
              <div className="p-4 text-center h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-purple-300 mb-4">{card.name}</h3>
                  <p className="text-gray-300 text-sm mb-4">{card.lore}</p>
                </div>
                <div className="mt-auto">
                  <div className="bg-gray-700 rounded p-2 inline-block">
                    <span className="text-sm text-gray-400">祭品加成: </span>
                    <span className="text-lg font-bold text-green-400">+{card.mod}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-full">
                <div className="loader"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 卡片翻转的CSS */}
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        
        .backface-hidden {
          backface-visibility: hidden;
        }
        
        .is-flipped .card-flipper {
          transform: rotateY(180deg);
        }
        
        .card-back {
          transform: rotateY(180deg);
        }
        
        .duration-600 {
          transition-duration: 600ms;
        }
        
        .loader {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 3px solid #9f7aea;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}