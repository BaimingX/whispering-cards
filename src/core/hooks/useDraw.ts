import { useState } from 'react';
import { Card } from '../types';

export const useDraw = () => {
  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 抽卡函数
  const draw = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/draw');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || '抽卡失败');
      }
      
      setCard(data.card);
    } catch (err) {
      setError(err instanceof Error ? err.message : '抽取卡牌失败，请稍后再试');
      console.error('抽卡错误:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 分享后抽卡
  const shareAndDraw = async (shareId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 先调用分享回调
      const shareRes = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareId }),
      });
      
      if (!shareRes.ok) {
        const error = await shareRes.json();
        throw new Error(error.message || '分享验证失败');
      }
      
      // 再次抽卡
      await draw();
    } catch (err) {
      setError(err instanceof Error ? err.message : '分享后抽卡失败');
      console.error('分享抽卡错误:', err);
      setIsLoading(false);
    }
  };
  
  return {
    card,
    isLoading,
    error,
    draw,
    shareAndDraw,
  };
}; 