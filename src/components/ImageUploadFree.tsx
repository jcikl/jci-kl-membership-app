import React, { useState } from 'react';
import { Upload, Button, message, Spin } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';

interface ImageUploadFreeProps {
  value?: string;
  onChange?: (url: string) => void;
  placeholder?: string;
  maxSize?: number; // MB
  enableCompression?: boolean;
  targetSize?: { width: number; height: number };
}

const ImageUploadFree: React.FC<ImageUploadFreeProps> = ({
  value,
  onChange,
  placeholder = '点击上传图片',
  maxSize = 5,
  enableCompression = true,
  targetSize = { width: 800, height: 600 }
}) => {
  const [loading, setLoading] = useState(false);

  // 压缩图片
  const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = img;
        if (enableCompression && targetSize) {
          const ratio = Math.min(targetSize.width / width, targetSize.height / height);
          if (ratio < 1) {
            width *= ratio;
            height *= ratio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // 上传到ImgBB
  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    // 注意：你需要从 https://api.imgbb.com/ 获取免费的API key
    formData.append('key', 'YOUR_IMGBB_API_KEY'); // 替换为你的API key

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('上传失败');
    }

    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || '上传失败');
    }
  };

  // 处理文件上传
  const handleUpload = async (file: File) => {
    try {
      setLoading(true);

      // 验证文件大小
      if (file.size > maxSize * 1024 * 1024) {
        message.error(`文件大小不能超过 ${maxSize}MB`);
        return false;
      }

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        message.error('只能上传图片文件');
        return false;
      }

      // 压缩图片
      let fileToUpload = file;
      if (enableCompression) {
        fileToUpload = await compressImage(file);
      }

      // 上传到ImgBB
      const imageUrl = await uploadToImgBB(fileToUpload);
      
      // 调用onChange
      onChange?.(imageUrl);
      message.success('图片上传成功');
      
      return false; // 阻止默认上传行为
    } catch (error) {
      console.error('上传失败:', error);
      message.error('图片上传失败，请重试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 删除图片
  const handleRemove = () => {
    onChange?.('');
  };

  return (
    <div className="image-upload-free">
      {value ? (
        <div className="image-preview">
          <img 
            src={value} 
            alt="预览" 
            style={{ 
              width: '100%', 
              maxWidth: '200px', 
              height: 'auto',
              borderRadius: '6px'
            }} 
          />
          <div style={{ marginTop: '8px' }}>
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              onClick={handleRemove}
            >
              删除图片
            </Button>
          </div>
        </div>
      ) : (
        <Upload
          beforeUpload={handleUpload}
          showUploadList={false}
          accept="image/*"
        >
          <Button 
            icon={<UploadOutlined />} 
            loading={loading}
            disabled={loading}
          >
            {loading ? '上传中...' : placeholder}
          </Button>
        </Upload>
      )}
      
      {loading && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Spin size="small" />
          <span style={{ marginLeft: '8px' }}>上传中...</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploadFree;
