import React, { useEffect, useState } from 'react';
import { RollResult } from '@/core/types';

type RollMeterProps = {
  roll?: RollResult;
  animate?: boolean;
  showLabels?: boolean;
};

export default function RollMeter({ 
  roll, 
  animate = true, 
  showLabels = true 
}: RollMeterProps) {
  const [currentValue, setCurrentValue] = useState(0);
  
  useEffect(() => {
    if (!roll || !animate) {
      setCurrentValue(roll?.final || 0);
      return;
    }
    
    // 先显示基础点数
    setCurrentValue(roll.base);
    
    // 然后逐渐加上加成
    if (roll.bonus > 0) {
      let current = roll.base;
      const increment = 1;
      const interval = 150; // 每个点数增加的时间间隔
      
      const timer = setInterval(() => {
        current += increment;
        setCurrentValue(current);
        
        if (current >= roll.final) {
          setCurrentValue(roll.final);
          clearInterval(timer);
        }
      }, interval);
      
      return () => clearInterval(timer);
    }
  }, [roll, animate]);
  
  // 获取结果类型样式
  const getTypeColor = () => {
    if (!roll) return 'text-white';
    
    switch (roll.type) {
      case '厄运':
        return 'text-red-500';
      case '不祥':
        return 'text-orange-500';
      case '中性':
        return 'text-blue-400';
      case '吉兆':
        return 'text-green-400';
      case '恩赐':
        return 'text-purple-400';
      default:
        return 'text-white';
    }
  };
  
  // 获取当前值的进度百分比
  const getPercentage = () => {
    const max = 30; // 最大值
    const percent = (currentValue / max) * 100;
    return `${Math.min(percent, 100)}%`;
  };
  
  // 获取标签位置样式
  const getLabelPosition = (value: number) => {
    const max = 30; // 最大值
    const percent = (value / max) * 100;
    return `${Math.min(percent, 100)}%`;
  };
  
  return (
    <div className="w-full max-w-md mx-auto my-6 px-4">
      {/* 当前结果 */}
      <div className="flex justify-between items-baseline mb-2">
        <div className="text-lg font-medium text-gray-300">掷骰结果</div>
        <div className="flex items-baseline">
          <span className="text-xl font-bold mr-2">{currentValue}</span>
          {roll && (
            <span className={`text-sm font-medium ${getTypeColor()}`}>
              ({roll.type})
            </span>
          )}
        </div>
      </div>
      
      {/* 进度条 */}
      <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300 ease-out"
          style={{ width: getPercentage() }}
        >
        </div>
      </div>
      
      {/* 标签 */}
      {showLabels && (
        <div className="relative h-8 mt-1">
          {[
            { value: 5, label: '厄运', color: 'text-red-500' },
            { value: 10, label: '不祥', color: 'text-orange-500' },
            { value: 15, label: '中性', color: 'text-blue-400' },
            { value: 20, label: '吉兆', color: 'text-green-400' },
            { value: 25, label: '恩赐', color: 'text-purple-400' },
          ].map((mark, index) => (
            <div
              key={index}
              className="absolute transform -translate-x-1/2"
              style={{ left: getLabelPosition(mark.value) }}
            >
              <div className="h-2 border-l border-gray-500"></div>
              <div className={`text-xs ${mark.color}`}>
                {mark.label}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 基础与加成明细 */}
      {roll && (
        <div className="flex justify-between mt-4 text-sm text-gray-400">
          <div>基础: {roll.base}</div>
          <div>献祭加成: +{roll.bonus}</div>
          <div>最终: {roll.final}</div>
        </div>
      )}
    </div>
  );
} 