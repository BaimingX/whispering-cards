/**
 * 图片处理工具库
 */

/**
 * 图片压缩函数
 * @param file 需要压缩的图片文件
 * @returns 压缩后的图片文件
 */
export async function compressImage(file: File): Promise<File> {
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