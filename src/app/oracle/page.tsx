'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { OracleResponse, old_god, CardInstance } from '@/core/types';
import { prisma } from '@/lib/db';

// 提取使用useSearchParams的部分到单独组件
function OracleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [godId, setGodId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [gods, setGods] = useState<old_god[]>([]);
  const [selectedGod, setSelectedGod] = useState<old_god | null>(null);
  const [userCards, setUserCards] = useState<CardInstance[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [response, setResponse] = useState<OracleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 获取用户卡牌和古神列表
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取所有古神
        const godsRes = await fetch('/api/gods');
        if (godsRes.ok) {
          const godsData = await godsRes.json();
          setGods(godsData);
          
          // 检查URL中是否有godId
          const urlGodId = searchParams.get('godId');
          if (urlGodId) {
            setGodId(urlGodId);
            const god = godsData.find((g: old_god) => g.id === urlGodId);
            if (god) setSelectedGod(god);
          }
        }
        
        // 获取用户卡牌
        const cardsRes = await fetch('/api/user/cards');
        if (cardsRes.ok) {
          const cardsData = await cardsRes.json();
          setUserCards(cardsData);
        }
      } catch (err) {
        setError('获取数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [searchParams]);
  
  // 卡牌选择处理
  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };
  
  // 提交占卜
  const submitOracle = async () => {
    if (!godId) {
      setError('请选择一位古神');
      return;
    }
    
    if (!topic.trim()) {
      setError('请输入占卜问题');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: topic.trim(),
          offeredCardIds: selectedCards,
          old_god_id: godId
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResponse(data);
        // 移除已献祭的卡牌
        if (selectedCards.length > 0) {
          setUserCards(prev => prev.filter(card => !selectedCards.includes(card.id)));
          setSelectedCards([]);
        }
      } else {
        setError(data.error || '占卜失败');
      }
    } catch (err) {
      setError('网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };
  
  // 重置占卜
  const resetOracle = () => {
    setResponse(null);
    setTopic('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">古神占卜</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 p-4 rounded-lg mb-6 text-center">
          <p>{error}</p>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center my-8">
          <div className="w-16 h-16 border-4 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {!loading && !response && (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="mb-6">
            <label className="block text-purple-300 mb-2">选择古神</label>
            <select 
              className="w-full bg-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500"
              value={godId || ''}
              onChange={(e) => {
                setGodId(e.target.value);
                const god = gods.find(g => g.id === e.target.value);
                setSelectedGod(god || null);
              }}
            >
              <option value="">-- 选择一位古神 --</option>
              {gods.map((god) => (
                <option key={god.id} value={god.id}>
                  {god.name} ({god.alias})
                </option>
              ))}
            </select>
          </div>
          
          {selectedGod && (
            <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
              <h3 className="text-xl font-bold mb-2">{selectedGod.name}</h3>
              <p className="text-gray-300 text-sm mb-2">别名: {selectedGod.alias}</p>
              <p className="text-gray-400">特性: {selectedGod.personality}</p>
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-purple-300 mb-2">你的问题</label>
            <textarea
              className="w-full bg-gray-700 text-white rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-purple-500"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="询问古神关于你命运的问题..."
            />
          </div>
          
          {userCards.length > 0 && (
            <div className="mb-6">
              <label className="block text-purple-300 mb-2">选择献祭卡牌 (可增强回应)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userCards.map((card) => (
                  <div 
                    key={card.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                      selectedCards.includes(card.id) 
                        ? 'bg-purple-900/30 border-purple-500' 
                        : 'bg-gray-700 border-gray-600 hover:border-gray-400'
                    }`}
                    onClick={() => toggleCardSelection(card.id)}
                  >
                    <h4 className="font-bold text-sm">{card.card?.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">加成: +{card.card?.mod}</p>
                    {card.card?.old_god_id === godId && (
                      <div className="mt-1 bg-purple-800/40 text-xs px-1 py-0.5 rounded text-center">
                        契合之卡
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button
            className="w-full py-3 bg-purple-800 hover:bg-purple-700 rounded-lg transition"
            onClick={submitOracle}
            disabled={loading || !godId || !topic.trim()}
          >
            {loading ? '与古神沟通中...' : '进行占卜'}
          </button>
        </div>
      )}
      
      {response && (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="border-b border-gray-700 pb-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-2xl font-bold text-purple-300">占卜结果</h2>
              <div className="bg-gray-700 px-3 py-1 rounded-full">
                掷骰: {response.roll}/20
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-2">问题: {topic}</p>
            {selectedGod && (
              <p className="text-sm">来自 <span className="text-purple-400">{selectedGod.name}</span> 的回应</p>
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-bold text-yellow-300 mb-2">神秘预兆</h3>
            <p className="text-gray-300 italic">{response.content.omen}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-bold text-green-300 mb-2">神谕建议</h3>
            <p className="text-gray-300">{response.content.advice}</p>
          </div>
          
          <div className="flex justify-between">
            <button
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              onClick={resetOracle}
            >
              新的占卜
            </button>
            
            <button
              className="px-6 py-2 bg-purple-800 hover:bg-purple-700 rounded-lg transition"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `来自${selectedGod?.name || '古神'}的占卜`,
                    text: `${response.content.omen}\n\n${response.content.advice}`,
                    url: window.location.href
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(`${topic}\n\n${response.content.omen}\n\n${response.content.advice}`);
                  alert('已复制到剪贴板');
                }
              }}
            >
              分享结果
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 加载中组件
function OracleLoadingFallback() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">古神占卜</h1>
      <div className="flex justify-center my-8">
        <div className="w-16 h-16 border-4 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

export default function OraclePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <Suspense fallback={<OracleLoadingFallback />}>
        <OracleContent />
      </Suspense>
    </div>
  );
} 