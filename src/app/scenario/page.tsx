'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scenario } from '@/core/types';

export default function ScenarioPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取所有剧本
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        // 这里应该是一个API调用，但目前我们只是硬编码一些数据
        // const response = await fetch('/api/scenarios');
        // const data = await response.json();
        
        // 模拟API返回的数据
        const mockData = [
          {
            id: '1',
            name: '深夜图书馆',
            description: '你在一座古老的图书馆中发现了一本禁忌的书籍...',
            steps: [], // 实际使用时这里会有数据
            createdAt: new Date()
          },
          {
            id: '2',
            name: '失落的神庙',
            description: '探索被遗忘的神庙，寻找传说中的古代神器...',
            steps: [],
            createdAt: new Date()
          },
          {
            id: '3',
            name: '镜中梦魇',
            description: '当你凝视镜子时，镜中的倒影似乎有了自己的意识...',
            steps: [],
            createdAt: new Date()
          }
        ];
        
        setScenarios(mockData);
        setIsLoading(false);
      } catch (err) {
        setError('无法加载剧本列表，请稍后再试');
        console.error('获取剧本错误:', err);
        setIsLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-amber-300 mb-2">剧本</h1>
        <p className="text-gray-400">体验短小精悍的恐怖故事，做出选择，面对后果</p>
      </header>

      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="loader"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 text-red-200 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <Link 
                key={scenario.id}
                href={`/scenario/${scenario.id}`}
                className="card hover:shadow-2xl transition-all duration-300"
              >
                <div className="p-6">
                  <h2 className="text-xl font-bold text-amber-300 mb-3">
                    {scenario.name}
                  </h2>
                  <p className="text-gray-400 mb-4 text-sm">
                    {scenario.description}
                  </p>
                  <div className="mt-auto">
                    <span className="inline-block bg-amber-900/30 text-amber-300 text-xs px-3 py-1 rounded-full">
                      开始体验
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            返回首页
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        .loader {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 3px solid #f59e0b;
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