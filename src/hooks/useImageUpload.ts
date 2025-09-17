import React, { useState, useCallback } from 'react';
import { message } from 'antd';
import { UploadServiceType, ImageType } from '@/modules/image/components/GlobalImageUploadModal';
import { uploadServiceConfig } from '@/modules/image/services/uploadServiceConfig';

// Hook返回类型
interface UseImageUploadReturn {
  // 状态
  isModalVisible: boolean;
  currentImageUrl: string;
  
  // 方法
  openUploadModal: () => void;
  closeUploadModal: () => void;
  handleUploadSuccess: (url: string) => void;
  handleDeleteImage: () => void;
  setImageUrl: (url: string) => void;
}

// Hook配置选项
interface UseImageUploadOptions {
  initialImageUrl?: string;
  onImageChange?: (url: string) => void;
  onImageDelete?: () => void;
  uploadService?: UploadServiceType;
  imageType?: ImageType;
  maxSize?: number;
  targetSize?: { width: number; height: number };
  enableCompression?: boolean;
  placeholder?: string;
  accept?: string;
}

/**
 * 图片上传Hook
 * 提供统一的图片上传状态管理和方法
 */
export const useImageUpload = (options: UseImageUploadOptions = {}): UseImageUploadReturn => {
  const {
    initialImageUrl = '',
    onImageChange,
    onImageDelete
  } = options;

  // 状态管理
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(initialImageUrl);

  // 监听initialImageUrl变化
  React.useEffect(() => {
    console.log('useImageUpload: initialImageUrl 变化:', initialImageUrl);
    console.log('useImageUpload: currentImageUrl (更新前):', currentImageUrl);
    setCurrentImageUrl(initialImageUrl);
  }, [initialImageUrl]);

  // 打开上传Modal
  const openUploadModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  // 关闭上传Modal
  const closeUploadModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // 处理上传成功
  const handleUploadSuccess = useCallback((url: string) => {
    console.log('useImageUpload: 处理上传成功，URL:', url);
    console.log('useImageUpload: 当前图片URL (更新前):', currentImageUrl);
    
    setCurrentImageUrl(url);
    onImageChange?.(url);
    closeUploadModal();
    message.success('图片上传成功');
    
    console.log('useImageUpload: 状态更新完成');
  }, [onImageChange, closeUploadModal, currentImageUrl]);

  // 处理删除图片
  const handleDeleteImage = useCallback(() => {
    setCurrentImageUrl('');
    onImageDelete?.();
    message.success('图片已删除');
  }, [onImageDelete]);

  // 设置图片URL
  const setImageUrl = useCallback((url: string) => {
    setCurrentImageUrl(url);
    onImageChange?.(url);
  }, [onImageChange]);

  return {
    // 状态
    isModalVisible,
    currentImageUrl,
    
    // 方法
    openUploadModal,
    closeUploadModal,
    handleUploadSuccess,
    handleDeleteImage,
    setImageUrl
  };
};

/**
 * 图片上传Hook的配置对象
 * 用于传递给GlobalImageUploadModal组件
 */
export const createImageUploadConfig = (options: UseImageUploadOptions = {}) => {
  const {
    uploadService = uploadServiceConfig.getDefaultUploadService(),
    imageType = ImageType.GENERAL,
    maxSize = 10,
    targetSize = { width: 800, height: 600 },
    enableCompression = true,
    placeholder = '点击上传图片',
    accept = 'image/*'
  } = options;

  return {
    uploadService,
    imageType,
    maxSize,
    targetSize,
    enableCompression,
    placeholder,
    accept
  };
};

export default useImageUpload;
