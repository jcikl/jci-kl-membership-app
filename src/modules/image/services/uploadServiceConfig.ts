import { GLOBAL_SYSTEM_CONFIG } from '@/config/globalSystemSettings';
import { UploadServiceType } from '@/modules/image/components/GlobalImageUploadModal';

/**
 * 上传服务配置服务
 * 统一管理上传服务的配置和默认设置
 */
class UploadServiceConfigService {
  /**
   * 获取默认上传服务
   */
  getDefaultUploadService(): UploadServiceType {
    return UploadServiceType.CLOUDINARY; // 统一使用Cloudinary
  }

  /**
   * 获取Cloudinary配置
   */
  getCloudinaryConfig() {
    return GLOBAL_SYSTEM_CONFIG.UPLOAD_CONFIG.cloudinary;
  }


  /**
   * 获取上传配置
   */
  getUploadConfig() {
    return GLOBAL_SYSTEM_CONFIG.UPLOAD_CONFIG;
  }

  /**
   * 检查上传服务是否可用
   */
  isUploadServiceAvailable(service: UploadServiceType): boolean {
    switch (service) {
      case UploadServiceType.CLOUDINARY:
        const cloudinaryConfig = this.getCloudinaryConfig();
        return !!(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset);
      
      default:
        return false;
    }
  }

  /**
   * 获取推荐的上传服务
   * 统一使用Cloudinary
   */
  getRecommendedUploadService(): UploadServiceType {
    return UploadServiceType.CLOUDINARY;
  }

  /**
   * 获取上传服务的显示名称
   */
  getUploadServiceDisplayName(service: UploadServiceType): string {
    switch (service) {
      case UploadServiceType.CLOUDINARY:
        return 'Cloudinary';
      default:
        return '未知服务';
    }
  }

  /**
   * 获取上传服务的描述
   */
  getUploadServiceDescription(service: UploadServiceType): string {
    switch (service) {
      case UploadServiceType.CLOUDINARY:
        return '专业的图片和视频管理平台，提供自动优化和CDN加速';
      default:
        return '未知服务';
    }
  }

  /**
   * 获取所有可用的上传服务
   */
  getAvailableUploadServices(): Array<{
    value: UploadServiceType;
    label: string;
    description: string;
    available: boolean;
  }> {
    return [
      {
        value: UploadServiceType.CLOUDINARY,
        label: this.getUploadServiceDisplayName(UploadServiceType.CLOUDINARY),
        description: this.getUploadServiceDescription(UploadServiceType.CLOUDINARY),
        available: this.isUploadServiceAvailable(UploadServiceType.CLOUDINARY)
      }
    ];
  }

  /**
   * 获取上传服务的图标
   */
  getUploadServiceIcon(service: UploadServiceType): string {
    switch (service) {
      case UploadServiceType.CLOUDINARY:
        return '☁️';
      default:
        return '📁';
    }
  }

  /**
   * 验证上传配置
   */
  validateUploadConfig(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查Cloudinary配置
    if (!this.isUploadServiceAvailable(UploadServiceType.CLOUDINARY)) {
      errors.push('Cloudinary服务不可用，请检查配置');
    }

    // 检查文件大小限制
    const maxFileSize = GLOBAL_SYSTEM_CONFIG.UPLOAD_CONFIG.maxFileSize;
    if (maxFileSize > 50 * 1024 * 1024) { // 50MB
      warnings.push('文件大小限制过大，可能影响上传性能');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// 导出单例实例
export const uploadServiceConfig = new UploadServiceConfigService();
export default uploadServiceConfig;
