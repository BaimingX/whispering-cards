'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 动态导入CardImageEditor组件，避免服务端渲染问题
const CardImageEditor = dynamic(() => import('@/components/CardImageEditor'), {
  ssr: false,
  loading: () => (
    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
      <div className="space-y-1 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-500"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-sm text-gray-400">加载上传组件中...</p>
      </div>
    </div>
  ),
});

// 卡牌属性枚举
enum AttributeKey {
  PHYSICAL = "PHYSICAL",       // 物理
  MEDICAL = "MEDICAL",         // 医疗、药剂
  ENERGY = "ENERGY",           // 魔法、能量、咒术
  SURVIVAL = "SURVIVAL",       // 野外生存、环境适应
  INSIGHT = "INSIGHT",         // 洞察、侦查
  SOCIAL = "SOCIAL",           // 社交操纵、魅力
  WISDOM = "WISDOM",           // 学识、逻辑、解谜
  AGILITY = "AGILITY",         // 敏捷、反应速度
  SPIRIT = "SPIRIT",           // 精神抗性、信念
  CONSTITUTION = "CONSTITUTION", // 体质、耐力、抗击打
  VOID = "VOID"                // 异界感知、疯癫
}

const attributeDescriptions = {
  [AttributeKey.PHYSICAL]: "物理",
  [AttributeKey.MEDICAL]: "医疗",
  [AttributeKey.ENERGY]: "能量",
  [AttributeKey.SURVIVAL]: "生存",
  [AttributeKey.INSIGHT]: "洞察",
  [AttributeKey.SOCIAL]: "社交",
  [AttributeKey.WISDOM]: "智慧",
  [AttributeKey.AGILITY]: "敏捷",
  [AttributeKey.SPIRIT]: "精神",
  [AttributeKey.CONSTITUTION]: "体质",
  [AttributeKey.VOID]: "虚空"
};

// 中文显示名称
const attributeDisplayNames = {
  [AttributeKey.PHYSICAL]: "物理",
  [AttributeKey.MEDICAL]: "医疗",
  [AttributeKey.ENERGY]: "能量",
  [AttributeKey.SURVIVAL]: "生存",
  [AttributeKey.INSIGHT]: "洞察",
  [AttributeKey.SOCIAL]: "社交",
  [AttributeKey.WISDOM]: "智慧",
  [AttributeKey.AGILITY]: "敏捷",
  [AttributeKey.SPIRIT]: "精神",
  [AttributeKey.CONSTITUTION]: "体质",
  [AttributeKey.VOID]: "虚空"
};

// 添加效果类型枚举，从Prisma数据库模型中使用
enum EffectType {
  PASSIVE = "PASSIVE",     // 背包中即生效
  CONSUME = "CONSUME",     // 使用/触发后耐久-1
  RETURN = "RETURN",       // 到节点后失效或自动消失
  KEY = "KEY"              // 作为剧情解锁钥匙存在
}

// 效果类型中文名称
const effectTypeNames = {
  [EffectType.PASSIVE]: "持有",
  [EffectType.CONSUME]: "消耗",
  [EffectType.RETURN]: "回归",
  [EffectType.KEY]: "钥匙",
};

// 初始表单数据
const initialFormData = {
  // 基本信息
  name: '',
  rarity: 'COMMON',
  description: '',
  instruction: '',
  scope: 'GLOBAL',
  carryOut: false,
  maxDurability: '',
  image: null as File | null,
  imagePosition: { x: 0, y: 0 },
  imageScale: 1,
  selectedFrameId: 'default',
  
  // 卡牌属性
  attributes: {
    [AttributeKey.PHYSICAL]: 0,
    [AttributeKey.MEDICAL]: 0,
    [AttributeKey.ENERGY]: 0,
    [AttributeKey.SURVIVAL]: 0,
    [AttributeKey.INSIGHT]: 0,
    [AttributeKey.SOCIAL]: 0,
    [AttributeKey.WISDOM]: 0,
    [AttributeKey.AGILITY]: 0,
    [AttributeKey.SPIRIT]: 0,
    [AttributeKey.CONSTITUTION]: 0,
    [AttributeKey.VOID]: 0
  },
  
  // 卡牌效果
  effectType: '',
  effectImplementation: '',
  effectValue: 0, // 效果数值
  effectDescription: '', // 自定义效果描述
  cardEffect: '', // 不再需要，使用effectType来分类
};

export default function NewCardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormData);
  const [currentTab, setCurrentTab] = useState('basic');
  const [effectImplementations, setEffectImplementations] = useState<Record<string, Array<{id: string, name: string, description: string}>>>({});
  const [isLoadingEffects, setIsLoadingEffects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [finalCardImage, setFinalCardImage] = useState<File | null>(null); // 新增状态存储完整卡片图像
  const [autoExporting, setAutoExporting] = useState(false);

  // 检查用户登录状态，如果未登录则重定向到首页
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // 当组件加载时，从localStorage中获取已保存的表单数据
  useEffect(() => {
    const savedFormData = localStorage.getItem('cardFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
      } catch (error) {
        console.error('解析本地存储的表单数据失败:', error);
      }
    }
  }, []);

  // 当表单数据变更时，保存到localStorage
  useEffect(() => {
    // 确保formData不为空且已经初始化
    if (Object.keys(formData).length > 0) {
      // 创建一个不包含image的副本，image对象不能序列化
      const formDataForStorage = {
        ...formData,
        image: null // 不保存图片对象
      };
      localStorage.setItem('cardFormData', JSON.stringify(formDataForStorage));
    }
  }, [formData]);

  // 加载效果实现方式数据
  useEffect(() => {
    const loadEffectImplementations = async () => {
      setIsLoadingEffects(true);
      try {
        // 从API获取效果实现方式数据
        const response = await fetch('/api/effect-implementations');
        
        if (!response.ok) {
          throw new Error('获取效果实现方式数据失败');
        }
        
        const data = await response.json();
        
        // 将数据按照EffectType分组
        const groupedData: Record<string, Array<{id: string, name: string, description: string}>> = {};
        
        data.forEach((impl: any) => {
          if (!groupedData[impl.type]) {
            groupedData[impl.type] = [];
          }
          
          groupedData[impl.type].push({
            id: impl.id,
            name: impl.name,
            description: impl.description || ''
          });
        });
        
        setEffectImplementations(groupedData);
      } catch (error) {
        console.error('加载效果数据出错:', error);
      } finally {
        setIsLoadingEffects(false);
      }
    };
    
    loadEffectImplementations();
  }, []);

  // 表单数据变更处理函数
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkboxInput = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkboxInput.checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 属性变更处理函数
  const handleAttributeChange = (attribute: AttributeKey, value: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attribute]: value
      }
    }));
  };

  // 图片变更处理函数
  const handleImageChange = (file: File | null, position?: { x: number, y: number, scale?: number, frameId?: string }) => {
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePosition: position ? { x: position.x, y: position.y } : { x: 0, y: 0 },
        imageScale: position?.scale || 1,
        selectedFrameId: position?.frameId || 'default'
      }));
    } else if (position) {
      // 只更新位置和缩放信息
      setFormData(prev => ({
        ...prev,
        imagePosition: { x: position.x, y: position.y },
        imageScale: position.scale || prev.imageScale,
        selectedFrameId: position.frameId || prev.selectedFrameId
      }));
    } else {
      // 清除图片
      setFormData(prev => ({
        ...prev,
        image: null,
        imagePosition: { x: 0, y: 0 },
        imageScale: 1,
        selectedFrameId: 'default'
      }));
      setFinalCardImage(null); // 同时清除完整卡片图像
    }
  };

  // 处理完整卡片图像变更
  const handleFinalCardImageChange = (file: File | null) => {
    setFinalCardImage(file);
  };

  // 表单提交处理函数
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    // 根据当前标签页进行不同的操作
    if (currentTab === 'basic') {
      setCurrentTab('attributes');
    } else if (currentTab === 'attributes') {
      setCurrentTab('effects');
    } else if (currentTab === 'effects') {
      // 确保在进入预览标签前已更新了最终的卡牌图像
      if (formData.image && !autoExporting) {
        // 使用CardImageEditor中的exportCardAsImage功能来生成最终图像
        const cardImageComponent = document.querySelector('[data-card-image-editor]');
        if (cardImageComponent) {
          // 自动触发导出功能以确保属性和效果显示在预览中
          const exportBtn = cardImageComponent.querySelector('button[data-export-card]');
          if (exportBtn) {
            (exportBtn as HTMLButtonElement).click();
          }
        }
      }
      setCurrentTab('preview');
    } else if (currentTab === 'preview') {
      // 最终提交表单
      submitCardToServer();
    }
  };
  
  // 提交卡牌到服务器
  const submitCardToServer = async () => {
    // 验证必填字段
    if (!formData.name) {
      setSubmitError('请填写卡牌名称');
      setCurrentTab('basic');
      return;
    }
    
    if (!formData.description) {
      setSubmitError('请填写卡牌描述');
      setCurrentTab('basic');
      return;
    }
    
    if (!formData.instruction) {
      setSubmitError('请填写使用说明');
      setCurrentTab('basic');
      return;
    }
    
    // 开始提交
    setIsSubmitting(true);
    
    try {
      // 准备上传图片（如果有的话）
      let artUrl = null;
      let finalCardUrl = null;

      // 检查是否有最终卡片图像需要上传
      if (finalCardImage) {
        // 创建FormData对象上传最终卡片图像
        const finalCardFormData = new FormData();
        finalCardFormData.append('file', finalCardImage);
        
        // 上传到Supabase存储
        const finalCardResponse = await fetch('/api/upload', {
          method: 'POST',
          body: finalCardFormData
        });
        
        if (!finalCardResponse.ok) {
          throw new Error('卡片图片上传失败');
        }
        
        const finalCardData = await finalCardResponse.json();
        finalCardUrl = finalCardData.url;
      }
      
      // 如果有原始背景图，也上传它（备用）
      if (formData.image) {
        // 创建FormData对象上传图片
        const imageFormData = new FormData();
        imageFormData.append('file', formData.image);
        
        // 上传到Supabase存储
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData
        });
        
        if (!response.ok) {
          throw new Error('背景图片上传失败');
        }
        
        const imageData = await response.json();
        artUrl = imageData.url;
      }
      
      // 准备卡牌数据
      const cardData = {
        name: formData.name,
        description: formData.description,
        instruction: formData.instruction,
        scope: formData.scope,
        rarity: formData.rarity,
        carryOut: formData.carryOut,
        maxDurability: formData.maxDurability ? parseInt(formData.maxDurability) : null,
        artUrl: artUrl, // 原始背景图URL
        finalCardUrl: finalCardUrl, // 最终渲染的卡片图像URL
        attributes: Object.entries(formData.attributes)
          .filter(([_, value]) => value > 0)
          .map(([key, value]) => ({
            key,
            value
          })),
        effectData: formData.effectType ? {
          effectType: formData.effectType,
          effectImplementationId: formData.effectImplementation,
          effectValue: formData.effectValue,
          effectDescription: formData.effectDescription
        } : null
      };
      
      // 发送到服务器
      const response = await fetch('/api/creator/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cardData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建卡牌失败');
      }
      
      // 创建成功
      const result = await response.json();
      
      // 清除本地存储的表单数据
      localStorage.removeItem('cardFormData');
      
      // 导航到卡牌列表页面
      router.push('/creator/cards');
    } catch (error) {
      console.error('提交卡牌失败:', error);
      setSubmitError(error instanceof Error ? error.message : '提交卡牌失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 处理"下一步"按钮文本
  const getNextButtonText = () => {
    if (isSubmitting && currentTab === 'preview') return '创建中...';
    if (currentTab === 'basic') return '下一步：卡牌属性';
    if (currentTab === 'attributes') return '下一步：卡牌效果';
    if (currentTab === 'effects') return '下一步：预览';
    return '完成创建';
  };

  // 如果正在加载或未登录，显示加载指示器
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  // 渲染当前标签页内容
  const renderTabContent = () => {
    switch (currentTab) {
      case 'basic':
        return renderBasicInfo();
      case 'attributes':
        return renderAttributes();
      case 'effects':
        return renderEffects();
      case 'preview':
        return renderPreview();
      default:
        return renderBasicInfo();
    }
  };

  // 基本信息标签页内容
  const renderBasicInfo = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              卡牌名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-gray-700/70 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="例：虚空护符"
              required
            />
          </div>
          
          <div>
            <label htmlFor="rarity" className="block text-sm font-medium text-gray-300 mb-1">
              稀有度 <span className="text-red-500">*</span>
            </label>
            <select
              id="rarity"
              name="rarity"
              value={formData.rarity}
              onChange={handleInputChange}
              className="w-full bg-gray-700/70 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="COMMON">普通</option>
              <option value="RARE">稀有</option>
              <option value="MYTHIC">神话</option>
              <option value="LEGENDARY">传奇</option>
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            卡牌描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full bg-gray-700/70 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="卡牌的故事背景或描述..."
            required
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="instruction" className="block text-sm font-medium text-gray-300 mb-1">
            使用说明 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="instruction"
            name="instruction"
            value={formData.instruction}
            onChange={handleInputChange}
            rows={2}
            className="w-full bg-gray-700/70 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="卡牌的使用方法或效果简述..."
            required
          ></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="scope" className="block text-sm font-medium text-gray-300 mb-1">
              卡牌作用域 <span className="text-red-500">*</span>
            </label>
            <select
              id="scope"
              name="scope"
              value={formData.scope}
              onChange={handleInputChange}
              className="w-full bg-gray-700/70 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="GLOBAL">全局通用</option>
              <option value="SCENARIO">剧本专属</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="carryOut" className="block text-sm font-medium text-gray-300 mb-1">
              能否带出剧本
            </label>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  id="carryOut"
                  name="carryOut"
                  checked={formData.carryOut}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-800"
                />
                <span className="ml-2 text-gray-300">允许玩家通关后带出</span>
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="maxDurability" className="block text-sm font-medium text-gray-300 mb-1">
            耐久度
          </label>
          <div className="flex items-center">
            <input
              type="number"
              id="maxDurability"
              name="maxDurability"
              value={formData.maxDurability}
              onChange={handleInputChange}
              min="1"
              max="99"
              className="w-24 bg-gray-700/70 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="无限"
            />
            <span className="ml-2 text-gray-400">留空表示无限耐久</span>
          </div>
        </div>
        
        <div>
          <label htmlFor="artUrl" className="block text-sm font-medium text-gray-300 mb-1">
            卡牌图片
          </label>
          {/* 移除上方预览，只保留CardImageEditor组件 */}
          <CardImageEditor
            onImageChange={handleImageChange}
            initialImage={formData.image}
            initialPosition={formData.imagePosition}
            initialScale={formData.imageScale}
            initialFrameId={formData.selectedFrameId}
            cardName={formData.name || "未命名卡牌"}
            attributes={formData.attributes}
            description={formData.description}
            effectType={formData.effectType ? (formData.effectType === EffectType.KEY ? "钥匙" : effectTypeNames[formData.effectType as EffectType]) : ''}
            effectImplementation={formData.effectImplementation && formData.effectType !== EffectType.KEY 
              ? effectImplementations[formData.effectType as EffectType]?.find(
                impl => impl.id === formData.effectImplementation
              )?.description || ''
              : ''}
            onFinalCardImageChange={handleFinalCardImageChange}
            data-card-image-editor
          />
        </div>
      </div>
    );
  };

  // 卡牌属性标签页内容
  const renderAttributes = () => {
    // 显示常规属性，不显示VOID属性
    const visibleAttributes = Object.values(AttributeKey).filter(attr => attr !== AttributeKey.VOID);
    
    return (
      <div className="space-y-8">
        <p className="text-gray-400">设置卡牌的属性值，这些属性将影响卡牌在游戏中的表现。</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleAttributes.map(attribute => (
            <AttributeSlider 
              key={attribute}
              label={attributeDisplayNames[attribute]} 
              attribute={attribute}
              value={formData.attributes[attribute]} 
              onChange={handleAttributeChange}
              description={attributeDescriptions[attribute]}
            />
          ))}
        </div>
      </div>
    );
  };

  // 卡牌效果标签页内容
  const renderEffects = () => {
    return (
      <div className="space-y-6">
        <p className="text-gray-400">为卡牌添加特殊效果和技能。</p>
        
        {isLoadingEffects ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-gray-400">加载效果数据中...</span>
          </div>
        ) : (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
            <div className="space-y-4">
              {/* 效果类型选择 */}
              <div>
                <label htmlFor="effectType" className="block text-sm font-medium text-gray-300 mb-1">
                  效果类型
                </label>
                <select
                  id="effectType"
                  name="effectType"
                  value={formData.effectType}
                  onChange={(e) => {
                    // 当选择KEY类型时，清空实现方式和数值
                    if (e.target.value === EffectType.KEY) {
                      setFormData(prev => ({
                        ...prev,
                        effectType: e.target.value,
                        effectImplementation: '',
                        effectValue: 0
                      }));
                    } else {
                      handleInputChange(e);
                    }
                  }}
                  className="w-full bg-gray-700/70 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">-- 选择效果类型 --</option>
                  {Object.entries(effectTypeNames).map(([type, name]) => (
                    <option key={type} value={type}>{name}</option>
                  ))}
                </select>
              </div>
              
              {/* 卡牌效果选择，作为一级菜单 */}
              {formData.effectType && formData.effectType !== EffectType.KEY && (
                <div>
                  <label htmlFor="effectImplementation" className="block text-sm font-medium text-gray-300 mb-1">
                    效果实现方式
                  </label>
                  <select
                    id="effectImplementation"
                    name="effectImplementation"
                    value={formData.effectImplementation}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700/70 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">-- 选择具体实现方式 --</option>
                    {formData.effectType && effectImplementations[formData.effectType]?.map((impl) => (
                      <option key={impl.id} value={impl.id}>{impl.description}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* 效果数值，只在选择了实现方式且非KEY类型后显示 */}
              {formData.effectImplementation && formData.effectType !== EffectType.KEY && (
                <div>
                  <label htmlFor="effectValue" className="block text-sm font-medium text-gray-300 mb-1">
                    效果数值
                  </label>
                  <input
                    type="number"
                    id="effectValue"
                    name="effectValue"
                    value={formData.effectValue}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    className="w-24 bg-gray-700/70 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="ml-2 text-gray-400">数值范围: 1-10</span>
                </div>
              )}
              
              {/* 自定义效果描述 */}
              {(formData.effectImplementation || formData.effectType === EffectType.KEY) && (
                <div>
                  <label htmlFor="effectDescription" className="block text-sm font-medium text-gray-300 mb-1">
                    效果描述 {formData.effectType !== EffectType.KEY && <span className="text-gray-500 text-xs">(选填)</span>}
                  </label>
                  <textarea
                    id="effectDescription"
                    name="effectDescription"
                    value={formData.effectDescription}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full bg-gray-700/70 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={formData.effectType === EffectType.KEY ? "描述这个关键物品的用途..." : "自定义效果描述文本..."}
                    required={formData.effectType === EffectType.KEY}
                  ></textarea>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 效果预览部分 */}
        {(formData.effectType || Object.values(formData.attributes).some(v => v > 0)) && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">效果预览</h3>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 max-w-md mx-auto">
              <div className="text-sm text-gray-300 text-center font-serif">
                {/* 属性预览 */}
                {Object.entries(formData.attributes)
                  .filter(([_, value]) => value > 0)
                  .map(([key, value]) => (
                    <span key={key} className="inline-block mr-3 font-bold">
                      {attributeDisplayNames[key as AttributeKey]}: {value}
                    </span>
                  ))}
                
                {/* 效果预览 */}
                {formData.effectType && (
                  <div className="mt-2 pt-2">
                    <p className="font-bold">
                      {formData.effectType === EffectType.KEY 
                        ? "钥匙" 
                        : effectTypeNames[formData.effectType as EffectType]?.split(' ')[0]}
                      {formData.effectType !== EffectType.KEY && formData.effectImplementation && 
                        ` - ${effectImplementations[formData.effectType as EffectType]?.find(
                          impl => impl.id === formData.effectImplementation
                        )?.description || ''}${formData.effectValue > 0 ? ` (${formData.effectValue})` : ''}`}
                    </p>
                    {formData.effectDescription && (
                      <p className="mt-1 italic text-gray-400">
                        "{formData.effectDescription}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 预览标签页内容
  const renderPreview = () => {
    return (
      <div className="space-y-6">
        <p className="text-gray-400">预览卡牌最终效果。</p>
        
        <div className="p-8 flex justify-center items-center">
          {finalCardImage ? (
            // 如果有完整卡片图像，直接显示
            <div className="w-[295px] h-[420px] rounded-lg overflow-hidden shadow-lg relative">
              <Image 
                src={URL.createObjectURL(finalCardImage)}
                alt={formData.name || "完整卡牌"}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            // 否则显示原来的预览组合
            <div className="w-[295px] h-[420px] bg-gray-800 rounded-lg border-2 border-gray-600 overflow-hidden shadow-lg relative">
              {formData.image && (
                <div className="w-full h-full bg-gray-700 relative overflow-hidden">
                  {/* 图片层 */}
                  <div style={{ 
                    transform: `translate(${formData.imagePosition.x}px, ${formData.imagePosition.y}px) scale(${formData.imageScale})`,
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    transformOrigin: 'center'
                  }}>
                    {/* 使用静态图片方法来避免URL.createObjectURL错误 */}
                    {typeof window !== 'undefined' && formData.image instanceof File && (
                      <Image 
                        src={URL.createObjectURL(formData.image)}
                        alt={formData.name || "卡牌图片"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  
                  {/* 框架层 */}
                  <div className="absolute inset-0 pointer-events-none z-10">
                    <Image 
                      src="/ui/card/frame.png"
                      alt="卡牌框架"
                      fill
                      className="object-contain"
                      priority
                      unoptimized
                    />
                  </div>

                  <div className="absolute left-0 right-0 top-[58.5%] z-10 flex justify-center">
                    <div className="w-[85%] py-1 text-center">
                      <h3 className="text-lg font-bold text-black truncate px-2 font-serif">
                        {formData.name || '未命名卡牌'}
                      </h3>
                    </div>
                  </div>
                  
                  {/* 添加属性和效果区域 - 红框区域 */}
                  <div className="absolute left-0 right-0 bottom-[3%] top-[67%] z-10 flex justify-center">
                    <div className="w-[88%] h-full px-4 py-2 flex flex-col">
                      {/* 属性区域 */}
                      <div className="mb-1 text-center">
                        <div className="text-xs space-y-0.5 font-serif text-black">
                          {Object.entries(formData.attributes)
                            .filter(([_, value]) => value > 0)
                            .map(([key, value]) => (
                              <span key={key} className="inline-block mr-2 font-bold">
                                {attributeDisplayNames[key as AttributeKey]}: {value}
                              </span>
                            ))}
                        </div>
                      </div>
                      
                      {/* 效果区域 */}
                      <div className="text-center">
                        {formData.effectType && (
                          <div className="text-xs mt-0.5 font-serif text-black">
                            {formData.effectType && (
                              <span className="font-bold inline">
                                {formData.effectType === EffectType.KEY 
                                  ? "钥匙" 
                                  : effectTypeNames[formData.effectType as EffectType]}:
                              </span>
                            )}
                            {formData.effectImplementation && formData.effectType !== EffectType.KEY && (
                              <span className="font-bold inline ml-2">
                                {effectImplementations[formData.effectType as EffectType]?.find(
                                  impl => impl.id === formData.effectImplementation
                                )?.description || ''}
                                {formData.effectValue > 0 ? ` (${formData.effectValue})` : ''}
                              </span>
                            )}
                            {formData.effectDescription && (
                              <span className="block mt-1 italic">"{formData.effectDescription}"</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/creator/cards" className="text-purple-400 hover:text-purple-300 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          返回卡牌列表
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-200">创建新卡牌</h1>
        <p className="text-gray-400 mt-2">设计一张全新的呓语之牌</p>
      </div>
      
      {/* 卡牌表单 */}
      <div className="bg-gray-800/70 rounded-lg border border-purple-900/30 p-6">
        <form onSubmit={handleSubmit}>
          {/* 表单标签页 */}
          <div className="border-b border-purple-900/30 mb-6">
            <nav className="-mb-px flex space-x-6">
              <FormTab id="basic" label="基本信息" active={currentTab === 'basic'} onClick={() => setCurrentTab('basic')} />
              <FormTab id="attributes" label="卡牌属性" active={currentTab === 'attributes'} onClick={() => setCurrentTab('attributes')} />
              <FormTab id="effects" label="卡牌效果" active={currentTab === 'effects'} onClick={() => setCurrentTab('effects')} />
              <FormTab id="preview" label="预览" active={currentTab === 'preview'} onClick={() => setCurrentTab('preview')} />
            </nav>
          </div>
          
          {/* 当前标签页内容 */}
          {renderTabContent()}
          
          {/* 表单操作按钮 */}
          <div className="mt-8 flex justify-end">
            {submitError && (
              <p className="mr-auto text-red-500">{submitError}</p>
            )}
            <button
              type="button"
              className="mr-4 px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
              onClick={() => router.push('/creator/cards')}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-md shadow-md transition-colors disabled:bg-purple-900 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {getNextButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 属性滑块组件
interface AttributeSliderProps {
  label: string;
  attribute: AttributeKey;
  value: number;
  onChange: (attribute: AttributeKey, value: number) => void;
  description?: string;
}

function AttributeSlider({ label, attribute, value, onChange, description }: AttributeSliderProps) {
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(attribute, parseInt(e.target.value));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    // 确保值在0-10之间
    const clampedValue = Math.max(0, Math.min(10, newValue));
    onChange(attribute, clampedValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={attribute} className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        <span className="text-lg font-semibold text-purple-300">{value}</span>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      <div className="flex items-center space-x-2">
        <input
          type="range"
          id={attribute}
          min="0"
          max="10"
          value={value}
          onChange={handleRangeChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <input
          type="number"
          value={value}
          onChange={handleNumberChange}
          min="0"
          max="10"
          className="w-14 bg-gray-700/70 border border-gray-600 rounded-md py-1 px-2 text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

interface FormTabProps {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

function FormTab({ id, label, active, onClick }: FormTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-3 px-1 border-b-2 font-medium text-sm ${
        active
          ? 'border-purple-500 text-purple-300'
          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
      }`}
    >
      {label}
    </button>
  );
} 