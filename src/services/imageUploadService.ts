import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

// 图片上传到 Firebase Storage
export const uploadImageToStorage = async (
  file: File,
  path: string = 'chapter-logos'
): Promise<string> => {
  try {
    // 检查 storage 是否可用
    if (!storage) {
      throw new Error('Firebase Storage 未初始化');
    }

    // 生成唯一文件名，确保文件名安全
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // 替换特殊字符
    const fileName = `${timestamp}_${safeFileName}`;
    const fullPath = `${path}/${fileName}`;
    
    const imageRef = ref(storage, fullPath);
    
    // 添加重试机制
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // 上传文件
        const snapshot = await uploadBytes(imageRef, file);
        
        // 获取下载URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;
      } catch (uploadError) {
        retryCount++;
        console.warn(`上传尝试 ${retryCount}/${maxRetries} 失败:`, uploadError);
        
        if (retryCount >= maxRetries) {
          throw uploadError;
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    throw new Error('上传重试次数超限');
  } catch (error) {
    console.error('图片上传失败，详细错误:', error);
    
    // 提供更具体的错误信息
    if (error instanceof Error) {
      if (error.message.includes('storage/unauthorized')) {
        throw new Error('没有权限上传图片，请检查Firebase Storage规则');
      } else if (error.message.includes('storage/object-not-found')) {
        throw new Error('存储路径不存在');
      } else if (error.message.includes('storage/quota-exceeded')) {
        throw new Error('存储空间不足');
      } else if (error.message.includes('storage/unauthenticated')) {
        throw new Error('用户未认证，请先登录');
      } else if (error.message.includes('storage/network-request-failed')) {
        throw new Error('网络连接失败，请检查网络连接');
      } else if (error.message.includes('storage/canceled')) {
        throw new Error('上传被取消');
      } else {
        throw new Error(`图片上传失败: ${error.message}`);
      }
    }
    
    throw new Error('图片上传失败: 未知错误');
  }
};

// 从 Firebase Storage 删除图片
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    // 从URL中提取文件路径
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (pathMatch) {
      const filePath = decodeURIComponent(pathMatch[1]);
      const imageRef = ref(storage, filePath);
      await deleteObject(imageRef);
    }
  } catch (error) {
    console.error('图片删除失败:', error);
    throw new Error('图片删除失败');
  }
};

// 验证图片文件
export const validateImageFile = async (file: File, maxSizeMB: number = 5): Promise<string | null> => {
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    return '只能上传图片文件';
  }
  
  // 检查文件大小
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `图片大小不能超过 ${maxSizeMB}MB`;
  }
  
  // 不限制图片尺寸，系统会自动缩放
  return null;
};

// 智能缩放图片 - 根据目标尺寸和宽高比自动调整
export const smartResizeImage = (
  file: File, 
  targetSize: { width: number; height: number } = { width: 400, height: 400 },
  quality: number = 0.9
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const { width: originalWidth, height: originalHeight } = img;
      const { width: targetWidth, height: targetHeight } = targetSize;
      
      // 计算缩放比例，保持宽高比
      const scaleX = targetWidth / originalWidth;
      const scaleY = targetHeight / originalHeight;
      const scale = Math.min(scaleX, scaleY); // 使用较小的缩放比例以保持宽高比
      
      // 计算最终尺寸
      const finalWidth = Math.round(originalWidth * scale);
      const finalHeight = Math.round(originalHeight * scale);
      
      // 设置canvas尺寸
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      // 绘制缩放后的图片
      ctx?.drawImage(img, 0, 0, finalWidth, finalHeight);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => resolve(file); // 如果图片加载失败，返回原文件
    img.src = URL.createObjectURL(file);
  });
};

// 压缩图片（可选功能）
export const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算压缩后的尺寸
      const maxWidth = 800;
      const maxHeight = 800;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};
