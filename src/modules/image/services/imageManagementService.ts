import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ImageType } from '@/modules/image/components/GlobalImageUploadModal';

// 图片信息接口
export interface ImageInfo {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  imageType: ImageType;
  uploadSource: string; // 上传来源，如 'event_form', 'member_profile', 'document_upload' 等
  uploadSourceId?: string; // 来源ID，如活动ID、会员ID等
  uploadSourceName?: string; // 来源名称，如活动名称、会员姓名等
  tags: string[];
  description?: string;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uploadedBy: string; // 上传者用户ID
  uploadedByName: string; // 上传者姓名
}

// 图片文件夹信息
export interface ImageFolder {
  id: string;
  name: string;
  source: string; // 来源标识
  sourceName: string; // 来源名称
  imageCount: number;
  totalSize: number; // 总大小（字节）
  lastUpdated: Timestamp;
  thumbnail?: string; // 文件夹缩略图
}

// 图片统计信息
export interface ImageStats {
  totalImages: number;
  totalSize: number;
  folderCount: number;
  imagesByType: Record<ImageType, number>;
  imagesBySource: Record<string, number>;
  recentUploads: ImageInfo[];
}

// 图片查询选项
export interface ImageQueryOptions {
  source?: string;
  imageType?: ImageType;
  tags?: string[];
  isPublic?: boolean;
  uploadedBy?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'fileName' | 'fileSize';
  orderDirection?: 'asc' | 'desc';
}

class ImageManagementService {
  private readonly COLLECTION_NAME = 'images';

  /**
   * 上传图片信息到数据库
   */
  async uploadImageInfo(imageData: Omit<ImageInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...imageData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('上传图片信息失败:', error);
      throw new Error('上传图片信息失败');
    }
  }

  /**
   * 获取所有图片信息
   */
  async getAllImages(options: ImageQueryOptions = {}): Promise<ImageInfo[]> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      // 添加筛选条件
      if (options.source) {
        q = query(q, where('uploadSource', '==', options.source));
      }
      if (options.imageType) {
        q = query(q, where('imageType', '==', options.imageType));
      }
      if (options.isPublic !== undefined) {
        q = query(q, where('isPublic', '==', options.isPublic));
      }
      if (options.uploadedBy) {
        q = query(q, where('uploadedBy', '==', options.uploadedBy));
      }
      if (options.startDate) {
        q = query(q, where('createdAt', '>=', Timestamp.fromDate(options.startDate)));
      }
      if (options.endDate) {
        q = query(q, where('createdAt', '<=', Timestamp.fromDate(options.endDate)));
      }

      // 添加排序
      const orderField = options.orderBy || 'createdAt';
      const orderDir = options.orderDirection || 'desc';
      q = query(q, orderBy(orderField, orderDir));

      // 添加分页
      if (options.limit) {
        q = query(q, orderBy(orderField, orderDir));
      }

      const querySnapshot = await getDocs(q);
      const images: ImageInfo[] = [];

      querySnapshot.forEach((doc) => {
        images.push({
          id: doc.id,
          ...doc.data()
        } as ImageInfo);
      });

      return images;
    } catch (error) {
      console.error('获取图片列表失败:', error);
      throw new Error('获取图片列表失败');
    }
  }

  /**
   * 根据ID获取图片信息
   */
  async getImageById(imageId: string): Promise<ImageInfo | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, imageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as ImageInfo;
      } else {
        return null;
      }
    } catch (error) {
      console.error('获取图片信息失败:', error);
      throw new Error('获取图片信息失败');
    }
  }

  /**
   * 更新图片信息
   */
  async updateImageInfo(imageId: string, updates: Partial<ImageInfo>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, imageId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('更新图片信息失败:', error);
      throw new Error('更新图片信息失败');
    }
  }

  /**
   * 删除图片信息
   */
  async deleteImageInfo(imageId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, imageId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('删除图片信息失败:', error);
      throw new Error('删除图片信息失败');
    }
  }

  /**
   * 获取图片文件夹列表
   */
  async getImageFolders(): Promise<ImageFolder[]> {
    try {
      const images = await this.getAllImages();
      const folderMap = new Map<string, ImageFolder>();

      images.forEach(image => {
        const source = image.uploadSource;
        if (!folderMap.has(source)) {
          folderMap.set(source, {
            id: source,
            name: image.uploadSourceName || source,
            source: source,
            sourceName: image.uploadSourceName || source,
            imageCount: 0,
            totalSize: 0,
            lastUpdated: image.updatedAt,
            thumbnail: undefined
          });
        }

        const folder = folderMap.get(source)!;
        folder.imageCount++;
        folder.totalSize += image.fileSize;
        
        // 更新最后更新时间
        if (image.updatedAt.toMillis() > folder.lastUpdated.toMillis()) {
          folder.lastUpdated = image.updatedAt;
        }

        // 设置缩略图（使用第一张图片）
        if (!folder.thumbnail) {
          folder.thumbnail = image.url;
        }
      });

      return Array.from(folderMap.values()).sort((a, b) => 
        b.lastUpdated.toMillis() - a.lastUpdated.toMillis()
      );
    } catch (error) {
      console.error('获取图片文件夹失败:', error);
      throw new Error('获取图片文件夹失败');
    }
  }

  /**
   * 根据来源获取图片列表
   */
  async getImagesBySource(source: string): Promise<ImageInfo[]> {
    return this.getAllImages({ source });
  }

  /**
   * 获取图片统计信息
   */
  async getImageStats(): Promise<ImageStats> {
    try {
      const images = await this.getAllImages();
      
      const stats: ImageStats = {
        totalImages: images.length,
        totalSize: images.reduce((sum, img) => sum + img.fileSize, 0),
        folderCount: 0,
        imagesByType: {} as Record<ImageType, number>,
        imagesBySource: {},
        recentUploads: images.slice(0, 10)
      };

      // 统计按类型分组
      images.forEach(image => {
        stats.imagesByType[image.imageType] = (stats.imagesByType[image.imageType] || 0) + 1;
        stats.imagesBySource[image.uploadSource] = (stats.imagesBySource[image.uploadSource] || 0) + 1;
      });

      // 计算文件夹数量
      stats.folderCount = Object.keys(stats.imagesBySource).length;

      return stats;
    } catch (error) {
      console.error('获取图片统计失败:', error);
      throw new Error('获取图片统计失败');
    }
  }

  /**
   * 搜索图片
   */
  async searchImages(searchTerm: string, options: ImageQueryOptions = {}): Promise<ImageInfo[]> {
    try {
      const images = await this.getAllImages(options);
      
      return images.filter(image => 
        image.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        image.uploadSourceName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('搜索图片失败:', error);
      throw new Error('搜索图片失败');
    }
  }

  /**
   * 批量删除图片
   */
  async batchDeleteImages(imageIds: string[]): Promise<void> {
    try {
      const deletePromises = imageIds.map(id => this.deleteImageInfo(id));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('批量删除图片失败:', error);
      throw new Error('批量删除图片失败');
    }
  }

  /**
   * 批量更新图片标签
   */
  async batchUpdateTags(imageIds: string[], tags: string[]): Promise<void> {
    try {
      const updatePromises = imageIds.map(id => 
        this.updateImageInfo(id, { tags })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('批量更新标签失败:', error);
      throw new Error('批量更新标签失败');
    }
  }

  /**
   * 获取上传来源配置
   */
  getUploadSources(): Array<{ value: string; label: string; description: string }> {
    return [
      { value: 'event_form', label: '活动表单', description: '通过活动创建/编辑表单上传的图片' },
      { value: 'member_profile', label: '会员资料', description: '通过会员资料编辑上传的头像' },
      { value: 'document_upload', label: '文档上传', description: '通过文档上传功能上传的图片' },
      { value: 'award_submission', label: '奖项申请', description: '通过奖项申请上传的图片' },
      { value: 'survey_response', label: '调查回复', description: '通过调查回复上传的图片' },
      { value: 'manual_upload', label: '手动上传', description: '通过图片管理页面手动上传的图片' }
    ];
  }
}

export const imageManagementService = new ImageManagementService();
export default imageManagementService;
