'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ScenarioStep } from '@/core/types';

interface ScenarioDetail {
  id: string;
  name: string;
  description: string;
  steps: ScenarioStep[];
  rewardCardId?: string;
}

export default function ScenarioDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 当前步骤
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rewardCard, setRewardCard] = useState<any>(null);
  
  // 获取剧本详情
  useEffect(() => {
    const fetchScenario = async () => {
      try {
        // 实际项目中应该是API调用
        // const response = await fetch(`/api/scenarios/${params.id}`);
        // const data = await response.json();
        
        // 模拟后端数据
        const mockScenario = {
          id: params.id,
          name: '深夜图书馆',
          description: '你在一座古老的图书馆中发现了一本禁忌的书籍...',
          steps: [
            {
              question: "你发现一本黑色封皮的古书，书页在微风中自动翻动。你会...",
              choices: ["立即合上书本", "继续观察", "大声朗读书中文字"],
              successOn: 1
            },
            {
              question: "书中出现了一个奇怪的符号，它似乎在发光。你决定...",
              choices: ["用手指触碰符号", "拍照记录下来", "撕下这一页"],
              successOn: 0
            },
            {
              question: "你感到一股力量涌入体内，周围的空气开始扭曲。此时你会...",
              choices: ["闭上眼睛等待平静", "念出书中记载的咒语", "尝试离开图书馆"],
              successOn: 2
            }
          ],
          rewardCardId: 'reward-123'
        };
        
        setScenario(mockScenario);
        setIsLoading(false);
      } catch (err) {
        setError('无法加载剧本详情，请稍后再试');
        console.error('获取剧本详情错误:', err);
        setIsLoading(false);
      }
    };

    fetchScenario();
  }, [params.id]);
  
  // 处理选择
  const handleChoice = async (choiceIndex: number) => {
    if (!scenario) return;
    
    const step = scenario.steps[currentStep];
    const isCorrect = choiceIndex === step.successOn;
    
    // 如果是最后一步，结束剧本
    if (currentStep === scenario.steps.length - 1) {
      setIsComplete(true);
      setSuccess(isCorrect);
      
      // 如果成功，获取奖励卡牌
      if (isCorrect && scenario.rewardCardId) {
        try {
          // 实际项目中应该是API调用
          // const response = await fetch(`/api/cards/${scenario.rewardCardId}`);
          // const card = await response.json();
          
          // 模拟后端数据
          const mockReward = {
            id: scenario.rewardCardId,
            name: '禁忌典籍',
            lore: '记载着被世人遗忘的知识，阅读它可能会使人疯狂，但也能获得惊人的洞察力。',
            mod: 4,
            rarity: 'RARE'
          };
          
          setRewardCard(mockReward);
        } catch (err) {
          console.error('获取奖励卡牌错误:', err);
        }
      }
    } else {
      // 如果答错，直接结束剧本
      if (!isCorrect) {
        setIsComplete(true);
        setSuccess(false);
      } else {
        // 进入下一步
        setCurrentStep(currentStep + 1);
      }
    }
  };
  
  // 返回剧本列表
  const goBack = () => {
    router.push('/scenario');
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center h-screen">
        <div className="loader"></div>
      </div>
    );
  }
  
  if (error || !scenario) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-900/50 text-red-200 p-4 rounded-md">
          {error || '剧本不存在'}
        </div>
        <div className="mt-4">
          <Link href="/scenario" className="text-gray-400 hover:text-white transition-colors">
            返回剧本列表
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-amber-300 mb-2">{scenario.name}</h1>
        <p className="text-gray-400">{scenario.description}</p>
      </header>
      
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
        {!isComplete ? (
          <div>
            <div className="text-sm text-gray-500 mb-2">步骤 {currentStep + 1} / {scenario.steps.length}</div>
            
            <h2 className="text-xl text-white mb-6">{scenario.steps[currentStep].question}</h2>
            
            <div className="space-y-3">
              {scenario.steps[currentStep].choices.map((choice, index) => (
                <button
                  key={index}
                  className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                  onClick={() => handleChoice(index)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className={`text-2xl font-bold mb-4 ${success ? 'text-green-400' : 'text-red-400'}`}>
              {success ? '你成功了！' : '你失败了...'}
            </h2>
            
            <p className="text-gray-300 mb-6">
              {success 
                ? '你成功走完了剧本，获得了珍贵的洞察和奖励。' 
                : '不幸的是，你的选择导致了不好的结局。可以再次尝试。'}
            </p>
            
            {success && rewardCard && (
              <div className="mb-8 p-4 bg-purple-900/30 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-300 mb-2">
                  获得奖励卡牌
                </h3>
                <div className="inline-block border border-purple-500 rounded-lg p-4 bg-gray-900">
                  <h4 className="text-xl font-bold text-purple-300">{rewardCard.name}</h4>
                  <p className="text-sm text-gray-400 mt-2">{rewardCard.lore}</p>
                  <div className="mt-3 text-green-400">
                    祭品加成: +{rewardCard.mod}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                className="btn-primary"
                onClick={goBack}
              >
                返回剧本列表
              </button>
              
              {!success && (
                <button
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => {
                    setCurrentStep(0);
                    setIsComplete(false);
                    setSuccess(false);
                  }}
                >
                  重新尝试
                </button>
              )}
            </div>
          </div>
        )}
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