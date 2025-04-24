'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface ImageDropzoneProps {
  onImageChange: (file: File | null) => void;
  className?: string;
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
        
        // 将Data URL转换回File对象
        fetch(compressedDataUrl)
          .then(res => res.blob())
          .then(blob => {
            const compressedFile = new File([blob], file.name, { 
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          })
          .catch(err => {
            reject(err);
          });
      };
      
      img.onerror = (error: unknown) => {
        reject(error);
      };
    };
    
    reader.onerror = (error: ProgressEvent<FileReader>) => {
      reject(error);
    };
  });
}

export default function ImageDropzone({ onImageChange, className = '' }: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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
      
      // 创建预览URL
      const previewUrl = URL.createObjectURL(processedFile);
      setPreview(previewUrl);
      onImageChange(processedFile);
      
      setProcessing(false);
      
      // 清理预览URL
      return () => URL.revokeObjectURL(previewUrl);
    } catch (err) {
      console.error('图片处理错误:', err);
      setError('图片处理失败，请重试');
      setProcessing(false);
    }
  }, [onImageChange]);

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

  const removeImage = () => {
    setPreview(null);
    onImageChange(null);
  };

  return (
    <div className={className}>
      {!preview ? (
        <div 
          {...getRootProps()} 
          className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${isDragActive ? 'border-purple-500 bg-purple-900/10' : 'border-gray-600'} border-dashed rounded-md cursor-pointer hover:border-purple-500 transition-colors ${processing ? 'opacity-50 cursor-wait' : ''}`}
        >
          <input {...getInputProps()} disabled={processing} />
          <div className="space-y-1 text-center">
            {processing ? (
              <>
                <div className="mx-auto h-12 w-12 text-purple-500">
                  <svg className="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-sm text-gray-400">正在处理图片...</p>
              </>
            ) : (
              <>
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
                <div className="flex text-sm text-gray-400 justify-center">
                  <label
                    className="relative cursor-pointer rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none"
                  >
                    <span>{isDragActive ? '放开以上传图片' : '点击上传图片'}</span>
                  </label>
                  <p className="pl-1">或直接从电脑拖拽图片至此</p>
                </div>
                <p className="text-xs text-gray-500">支持 PNG, JPG, GIF 格式，最大 4MB</p>
                <p className="text-xs text-gray-500">（大于1MB的图片将自动压缩）</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative mt-1 rounded-md overflow-hidden group">
          <div className="relative h-72 w-full max-w-[260px] mx-auto rounded-lg border-2 border-gray-600">
            <Image
              src={preview}
              alt="卡牌图片预览"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button 
              onClick={removeImage}
              type="button"
              className="bg-red-600 text-white rounded-full p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
} 