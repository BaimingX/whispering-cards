'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { MdZoomIn, MdZoomOut, MdOutlineCropFree, MdOutlinePhotoSizeSelectActual } from "react-icons/md";
import html2canvas from 'html2canvas-pro';

// 定义可用的卡牌框架（未来可扩展）
const CARD_FRAMES = [
  { 
    id: 'default', 
    name: '默认框架', 
    src: '/ui/card/frame.png',
    description: '标准卡牌边框'
  },
  // 未来可以添加更多框架
  // { 
  //   id: 'gold', 
  //   name: '金色框架', 
  //   src: '/ui/card/gold-frame.png',
  //   description: '华丽的金色边框'
  // },
  // { 
  //   id: 'ancient', 
  //   name: '古代框架', 
  //   src: '/ui/card/ancient-frame.png',
  //   description: '神秘的古老边框'
  // },
  // { 
  //   id: 'void', 
  //   name: '虚空框架', 
  //   src: '/ui/card/void-frame.png',
  //   description: '深邃的虚空边框'
  // },
];

interface CardImageEditorProps {
  onImageChange: (file: File | null, position?: { x: number, y: number, scale?: number, frameId?: string }) => void;
  className?: string;
  initialImage?: File | null;
  initialPosition?: { x: number, y: number };
  initialScale?: number;
  initialFrameId?: string;
  cardName?: string;
  attributes?: Record<string, number>;
  description?: string;
  effectType?: string;
  effectImplementation?: string;
  onFinalCardImageChange?: (file: File | null) => void;
}

// 图片压缩函数
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new globalThis.Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 如果图片太大，等比例缩小
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        
        if (width > height && width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        } else if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 调整压缩质量以确保文件大小在1MB以内
        let quality = 0.8;
        let compressedDataUrl = canvas.toDataURL(file.type, quality);
        
        // 二分法查找合适的压缩质量
        const findQuality = () => {
          const binaryData = atob(compressedDataUrl.split(',')[1]);
          const sizeInBytes = binaryData.length;
          const sizeInMB = sizeInBytes / (1024 * 1024);
          
          if (sizeInMB > 1) {
            quality -= 0.05;
            if (quality <= 0.1) {
              quality = 0.1; // 设置最低质量
              return;
            }
            compressedDataUrl = canvas.toDataURL(file.type, quality);
            findQuality();
          }
        };
        
        findQuality();
        
        // 将base64转换回文件
        fetch(compressedDataUrl)
          .then(res => res.blob())
          .then(blob => {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            
            resolve(compressedFile);
          })
          .catch(error => {
            reject(error);
          });
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
  });
}

export default function CardImageEditor({ 
  onImageChange, 
  className = '',
  initialImage = null,
  initialPosition = { x: 0, y: 0 },
  initialScale = 1,
  initialFrameId = 'default',
  cardName = '未命名卡牌',
  attributes = {},
  description = '',
  effectType = '',
  effectImplementation = '',
  onFinalCardImageChange
}: CardImageEditorProps) {
  const [image, setImage] = useState<File | null>(initialImage);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [autoExporting, setAutoExporting] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [imageScale, setImageScale] = useState(initialScale);
  const [selectedFrame, setSelectedFrame] = useState(initialFrameId);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 更新预览
  useEffect(() => {
    if (image && typeof window !== 'undefined') {
      try {
        // 确保image是有效的File对象且在客户端环境
        if (image instanceof File) {
          const previewUrl = URL.createObjectURL(image);
          setPreview(previewUrl);
          
          return () => {
            URL.revokeObjectURL(previewUrl);
          };
        }
      } catch (err) {
        console.error('创建预览URL失败:', err);
        setError('图片预览失败');
      }
    }
  }, [image]);

  // 拖放处理
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }
    
    // 检查文件大小 (最大4MB)
    if (file.size > 4 * 1024 * 1024) {
      setError('图片大小不能超过4MB');
      return;
    }

    try {
      setProcessing(true);
      
      // 如果文件大于1MB，进行压缩
      let processedFile = file;
      if (file.size > 1 * 1024 * 1024) {
        processedFile = await compressImage(file);
      }
      
      // 重置位置和缩放
      const newPosition = { x: 0, y: 0 };
      const newScale = 1;
      
      setImage(processedFile);
      setPosition(newPosition);
      setImageScale(newScale);
      
      // 通知父组件
      onImageChange(processedFile, { 
        ...newPosition, 
        scale: newScale, 
        frameId: selectedFrame 
      });
      
      setProcessing(false);
    } catch (err) {
      console.error('图片处理错误:', err);
      setError('图片处理失败，请重试');
      setProcessing(false);
    }
  }, [onImageChange, selectedFrame]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': []
    },
    maxSize: 4 * 1024 * 1024, // 4MB
    multiple: false
  });

  // 删除图片
  const removeImage = () => {
    setImage(null);
    setPreview(null);
    setPosition({ x: 0, y: 0 });
    setImageScale(1);
    onImageChange(null);
  };

  // 图片拖动处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!preview) return;
    
    e.preventDefault(); // 防止浏览器默认行为
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !preview) return;
    
    e.preventDefault(); // 防止浏览器默认行为
    
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    
    setPosition(newPosition);
    
    // 实时更新位置，确保拖动流畅
    if (image) {
      onImageChange(image, { 
        ...newPosition, 
        scale: imageScale, 
        frameId: selectedFrame 
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !preview) return;
    
    setIsDragging(false);
    // 通知父组件位置变化
    if (image) {
      onImageChange(image, { 
        ...position, 
        scale: imageScale, 
        frameId: selectedFrame 
      });
    }
  };

  // 处理图片缩放
  const handleZoomIn = () => {
    if (!preview) return;
    
    const newScale = Math.min(imageScale + 0.1, 3); // 最大放大3倍
    setImageScale(newScale);
    
    if (image) {
      onImageChange(image, { 
        ...position, 
        scale: newScale, 
        frameId: selectedFrame 
      });
    }
  };

  const handleZoomOut = () => {
    if (!preview) return;
    
    const newScale = Math.max(imageScale - 0.1, 0.5); // 最小缩小0.5倍
    setImageScale(newScale);
    
    if (image) {
      onImageChange(image, { 
        ...position, 
        scale: newScale, 
        frameId: selectedFrame 
      });
    }
  };

  // 重置图片大小
  const handleResetSize = () => {
    if (!preview) return;
    
    setImageScale(1);
    
    if (image) {
      onImageChange(image, { 
        ...position, 
        scale: 1, 
        frameId: selectedFrame 
      });
    }
  };

  // 自适应大小（尝试填充整个卡牌区域）
  const handleFitToFrame = () => {
    if (!preview) return;
    
    // 设置一个更合适的自适应比例以填充卡牌区域
    const newScale = 1.5; // 比例调大，确保图片能覆盖整个卡牌区域
    setImageScale(newScale);
    setPosition({ x: 0, y: 0 });
    
    if (image) {
      onImageChange(image, { 
        x: 0, 
        y: 0, 
        scale: newScale, 
        frameId: selectedFrame 
      });
    }
  };

  // 处理触摸开始事件
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!preview || e.touches.length !== 1) return;
    
    e.preventDefault();
    
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
    });
  };
  
  // 处理触摸移动事件
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !preview || e.touches.length !== 1) return;
    
    e.preventDefault();
    
    const newPosition = {
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    };
    
    setPosition(newPosition);
    
    // 实时更新位置
    if (image) {
      onImageChange(image, { 
        ...newPosition, 
        scale: imageScale, 
        frameId: selectedFrame 
      });
    }
  };
  
  // 处理触摸结束事件
  const handleTouchEnd = () => {
    if (!isDragging || !preview) return;
    
    setIsDragging(false);
  };

  // 处理框架选择
  const handleFrameChange = (frameId: string) => {
    setSelectedFrame(frameId);
    
    if (image) {
      onImageChange(image, { 
        ...position, 
        scale: imageScale, 
        frameId: frameId 
      });
    }
  };

  // 渲染属性文本
  const renderAttributes = () => {
    // 过滤出值大于0的属性
    const validAttributes = Object.entries(attributes).filter(([_, value]) => value > 0);
    
    if (validAttributes.length === 0) return null;

    return (
      <div className="text-xs space-y-0.5 font-serif text-black">
        {validAttributes.map(([key, value]) => (
          <span key={key} className="inline-block mr-2 font-bold">
            {key}: {value}
          </span>
        ))}
      </div>
    );
  };

  // 渲染效果文本
  const renderEffects = () => {
    if (!effectType && !effectImplementation) return null;

    return (
      <div className="text-xs mt-0.5 font-serif text-black">
        {effectType && <span className="font-bold inline">{effectType} :</span>}
        {effectImplementation && <span className=" font-bold inline ml-2">{effectImplementation}</span>}
        {description && (
          <span className="block mt-1 italic ">"{description}"</span>
        )}
      </div>
    );
  };

  // 导出卡片为完整图像
  const exportCardAsImage = useCallback(async (isManualExport = true) => {
    if (!cardRef.current || !preview) return null;
    
    // 如果是手动导出，则更新UI显示的处理状态
    if (isManualExport) {
      setProcessing(true);
    } else {
      setAutoExporting(true);
    }
    
    try {
      // 创建临时DOM元素用于导出，不包含控制按钮
      const tempCard = cardRef.current.cloneNode(true) as HTMLElement;
      
      // 移除控制按钮和提示元素
      const buttonsToRemove = tempCard.querySelectorAll('button, .absolute.bottom-2.right-2, .absolute.top-2.right-2');
      buttonsToRemove.forEach(button => {
        button.parentNode?.removeChild(button);
      });
      
      // 将临时元素附加到DOM以便html2canvas可以使用，但设置为不可见
      document.body.appendChild(tempCard);
      tempCard.style.position = 'absolute';
      tempCard.style.left = '-9999px';
      tempCard.style.width = '295px';
      tempCard.style.height = '420px';
      
      // 使用html2canvas将DOM元素转换为Canvas
      const canvas = await html2canvas(tempCard, {
        backgroundColor: null,
        scale: 2, // 提高导出图像质量
        logging: false,
        useCORS: true, // 允许跨域图像
      });
      
      // 导出完成后移除临时元素
      document.body.removeChild(tempCard);
      
      // 将Canvas转换为Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob as Blob);
        }, 'image/png', 0.95);
      });
      
      // 创建File对象
      const fileName = `${cardName.replace(/\s+/g, '-').toLowerCase()}-card.png`;
      const cardFile = new File([blob], fileName, { type: 'image/png' });
      
      // 调用完整卡片回调
      if (onFinalCardImageChange) {
        onFinalCardImageChange(cardFile);
      }
      
      // 如果是手动导出，创建下载链接
      if (isManualExport) {
        // 创建用于下载的URL
        const downloadUrl = URL.createObjectURL(blob);
        
        // 创建下载链接并触发下载
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // 清理下载链接
        document.body.removeChild(downloadLink);
        
        // 延迟释放URL对象，确保下载已开始
        setTimeout(() => {
          URL.revokeObjectURL(downloadUrl);
        }, 100);
      }
      
      // 恢复对应的状态
      if (isManualExport) {
        setProcessing(false);
      } else {
        setAutoExporting(false);
      }
      
      return cardFile;
    } catch (err) {
      console.error('导出卡片图像失败:', err);
      setError('导出卡片图像失败');
      
      // 恢复对应的状态
      if (isManualExport) {
        setProcessing(false);
      } else {
        setAutoExporting(false);
      }
      
      return null;
    }
  }, [preview, cardName, onFinalCardImageChange]);

  // 当卡片设计更新时，自动导出图像
  useEffect(() => {
    if (preview && cardRef.current && !autoExporting) {
      // 增加导出节流，避免频繁触发
      const exportTimeout = setTimeout(() => {
        exportCardAsImage(false); // 传递false表示这是自动导出，不影响UI按钮状态
      }, 1000);
      
      return () => {
        clearTimeout(exportTimeout);
      };
    }
  }, [preview, position.x, position.y, imageScale, selectedFrame, exportCardAsImage, autoExporting]);

  return (
    <div className={`mt-1 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* 左侧上传区域 */}
        <div
          ref={containerRef}
          className={`relative w-full md:w-[295px] h-[420px] border-2 ${isDragActive ? 'border-purple-500' : 'border-gray-600'} ${!image ? 'border-dashed' : 'border-solid'} rounded-md overflow-hidden bg-gray-800 flex justify-center items-center`}
          {...(!preview ? getRootProps() : {})} // 只在没有预览图片时添加上传功能
          onMouseDown={preview ? handleMouseDown : undefined}
          onMouseMove={preview ? handleMouseMove : undefined}
          onMouseUp={preview ? handleMouseUp : undefined}
          onMouseLeave={preview ? handleMouseUp : undefined}
          onTouchStart={preview ? handleTouchStart : undefined}
          onTouchMove={preview ? handleTouchMove : undefined}
          onTouchEnd={preview ? handleTouchEnd : undefined}
        >
          {!preview && <input {...getInputProps()} />}
          
          {/* 图片预览 - 添加ref用于捕获 */}
          {preview ? (
            <div ref={cardRef} className="w-full h-full relative">
              <div 
                style={{ 
                  transform: `translate(${position.x}px, ${position.y}px) scale(${imageScale})`,
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  transformOrigin: 'center'
                }}
                className="absolute inset-0"
              >
                <Image 
                  src={preview} 
                  alt="Card artwork" 
                  fill
                  className="object-cover user-drag-none"
                  unoptimized
                  draggable={false}
                />
              </div>
              
              {/* 卡牌框架 */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <Image 
                  src={CARD_FRAMES.find(f => f.id === selectedFrame)?.src || '/ui/card/frame.png'} 
                  alt="Card frame"
                  fill
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
              
              {/* 卡牌名称中央栏 - 调整位置 */}
              <div className="absolute left-0 right-0 top-[58.8%] z-10 flex justify-center">
                <div className="w-[85%] py-1 text-center">
                  <h3 className="text-lg font-bold text-black truncate px-2 font-serif">
                    {cardName || '未命名卡牌'}
                  </h3>
                </div>
              </div>
              
              {/* 添加属性和效果区域 - 红框区域 */}
              <div className="absolute left-0 right-0 bottom-[3%] top-[67%] z-10 flex justify-center">
                <div className="w-[88%] h-full px-4 py-2 flex flex-col">
                  {/* 属性区域 */}
                  <div className="mb-1 text-center">
                    {renderAttributes()}
                  </div>
                  
                  {/* 效果区域 */}
                  <div className="text-center">
                    {renderEffects()}
                  </div>
                </div>
              </div>
              
              {/* 垃圾桶删除按钮 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors z-20"
                title="删除图片"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* 拖动提示 */}
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md z-20">
                拖动调整位置
              </div>
            </div>
          ) : (
            <div className="text-center p-6">
              {processing ? (
                <div className="space-y-2">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-gray-400 text-sm">处理图片中...</p>
                </div>
              ) : (
                <>
                  <Image
                    src="/ui/card/frame.png"
                    width={200}
                    height={280}
                    alt="空白卡牌"
                    className="mx-auto mb-4 opacity-30"
                  />
                  
                  {/* 卡牌名称预览 - 调整位置 */}
                  <div className="absolute left-0 right-0 top-[58.8%] z-10 flex justify-center">
                    <div className="w-[85%] py-1 text-center">
                      <h3 className="text-lg font-bold text-black/30 truncate px-2 font-serif bg-[#d0b883]/40 rounded">
                        {cardName || '未命名卡牌'}
                      </h3>
                    </div>
                  </div>
                  
                  {/* 属性和效果区域预览 */}
                  <div className="absolute left-0 right-0 bottom-[3%] top-[70%] z-10 flex justify-center">
                    <div className="w-[88%] h-full px-4 py-2 bg-[#d0b883]/20 rounded">
                      <div className="text-xs text-black/30 font-bold text-center font-serif">
                        物理: 0 | 医疗: 0 | 敏捷: 0
                      </div>
                      <div className="text-xs text-black/30 text-center font-serif">
                        <span className="font-bold block mt-1">效果类型</span>
                        <span className="block">效果描述将显示在这里...</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-gray-300 text-sm">
                      {isDragActive ? "释放文件上传" : "拖放或点击上传卡牌图片"}
                    </p>
                    <p className="text-gray-500 text-xs">支持 JPG、PNG 和 GIF，最大 4MB</p>
                  </div>
                </>
              )}
              
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
          )}
        </div>
        
        {/* 右侧控制区域 */}
        <div className="flex-1">
          {/* 控制面板 */}
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            {/* 图片控制 */}
            <div>
              <p className="text-sm text-gray-400 mb-2">图片调整</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="bg-gray-700 hover:bg-gray-600 text-white rounded p-2 flex items-center justify-center flex-1"
                  title="放大"
                >
                  <MdZoomIn className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="bg-gray-700 hover:bg-gray-600 text-white rounded p-2 flex items-center justify-center flex-1"
                  title="缩小"
                >
                  <MdZoomOut className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetSize}
                  className="bg-gray-700 hover:bg-gray-600 text-white rounded p-2 flex items-center justify-center flex-1"
                  title="重置大小"
                >
                  <MdOutlinePhotoSizeSelectActual className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleFitToFrame}
                  className="bg-gray-700 hover:bg-gray-600 text-white rounded p-2 flex items-center justify-center flex-1"
                  title="适应框架"
                >
                  <MdOutlineCropFree className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* 增加导出卡片按钮 */}
            {preview && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => exportCardAsImage(true)}
                  className="w-full bg-purple-700 hover:bg-purple-600 text-white rounded p-2 flex items-center justify-center"
                  disabled={processing}
                >
                  {processing ? "导出中..." : "下载卡片图像"}
                </button>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  卡片会自动导出并上传，点击按钮可下载到本地
                </p>
              </div>
            )}
          </div>
          
          {/* 指导说明 */}
          <p className="text-xs text-gray-500 text-center">拖动图片可以调整位置，使用上方按钮可以缩放大小</p>
        </div>
      </div>
    </div>
  );
} 