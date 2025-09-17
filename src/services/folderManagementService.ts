import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { GLOBAL_COLLECTIONS } from '@/config/globalCollections';

// 文件类型枚举
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  OTHER = 'other'
}

// 文件信息接口
export interface FileInfo {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileType: FileType;
  url: string;
  thumbnailUrl?: string;
  folderId: string;
  folderName: string;
  tags: string[];
  description?: string;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uploadedBy: string;
  uploadedByName: string;
  downloadCount: number;
  lastAccessed?: Timestamp;
}

// 文件夹信息接口
export interface FolderInfo {
  id: string;
  name: string;
  description?: string;
  parentId?: string; // 支持嵌套文件夹
  path: string; // 完整路径，如 "/documents/2024"
  color?: string; // 文件夹颜色标识
  icon?: string; // 文件夹图标
  isPublic: boolean;
  fileCount: number;
  totalSize: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  createdByName: string;
  lastAccessed?: Timestamp;
}

// 文件查询选项
export interface FileQueryOptions {
  folderId?: string;
  fileType?: FileType;
  tags?: string[];
  isPublic?: boolean;
  uploadedBy?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'fileName' | 'fileSize' | 'downloadCount';
  orderDirection?: 'asc' | 'desc';
}

// 文件夹查询选项
export interface FolderQueryOptions {
  parentId?: string;
  isPublic?: boolean;
  createdBy?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'name' | 'fileCount';
  orderDirection?: 'asc' | 'desc';
}

// 文件统计信息
export interface FileStats {
  totalFiles: number;
  totalSize: number;
  folderCount: number;
  filesByType: Record<FileType, number>;
  filesByFolder: Record<string, number>;
  recentUploads: FileInfo[];
  mostDownloaded: FileInfo[];
}

class FolderManagementService {
  private readonly FILES_COLLECTION = GLOBAL_COLLECTIONS.FILES || 'files';
  private readonly FOLDERS_COLLECTION = GLOBAL_COLLECTIONS.FOLDERS || 'folders';

  /**
   * 创建文件夹
   */
  async createFolder(folderData: Omit<FolderInfo, 'id' | 'createdAt' | 'updatedAt' | 'fileCount' | 'totalSize'>): Promise<string> {
    try {
      // 检查文件夹名称是否重复
      const existingFolder = await this.getFolderByName(folderData.name, folderData.parentId);
      if (existingFolder) {
        throw new Error('文件夹名称已存在');
      }

      // 构建路径
      const path = this.buildFolderPath(folderData.name, folderData.parentId);

      const docRef = await addDoc(collection(db, this.FOLDERS_COLLECTION), {
        ...folderData,
        path,
        fileCount: 0,
        totalSize: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('创建文件夹失败:', error);
      throw new Error('创建文件夹失败');
    }
  }

  /**
   * 获取文件夹列表
   */
  async getFolders(options: FolderQueryOptions = {}): Promise<FolderInfo[]> {
    try {
      let q = query(collection(db, this.FOLDERS_COLLECTION));

      // 添加筛选条件
      if (options.parentId !== undefined) {
        q = query(q, where('parentId', '==', options.parentId));
      }
      if (options.isPublic !== undefined) {
        q = query(q, where('isPublic', '==', options.isPublic));
      }
      if (options.createdBy) {
        q = query(q, where('createdBy', '==', options.createdBy));
      }

      // 添加排序
      const orderField = options.orderBy || 'updatedAt';
      const orderDir = options.orderDirection || 'desc';
      q = query(q, orderBy(orderField, orderDir));

      const querySnapshot = await getDocs(q);
      const folders: FolderInfo[] = [];

      querySnapshot.forEach((doc) => {
        folders.push({
          id: doc.id,
          ...doc.data()
        } as FolderInfo);
      });

      return folders;
    } catch (error) {
      console.error('获取文件夹列表失败:', error);
      throw new Error('获取文件夹列表失败');
    }
  }

  /**
   * 根据ID获取文件夹
   */
  async getFolderById(folderId: string): Promise<FolderInfo | null> {
    try {
      const docRef = doc(db, this.FOLDERS_COLLECTION, folderId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as FolderInfo;
      } else {
        return null;
      }
    } catch (error) {
      console.error('获取文件夹失败:', error);
      throw new Error('获取文件夹失败');
    }
  }

  /**
   * 根据名称获取文件夹
   */
  async getFolderByName(name: string, parentId?: string): Promise<FolderInfo | null> {
    try {
      let q = query(
        collection(db, this.FOLDERS_COLLECTION),
        where('name', '==', name)
      );

      if (parentId !== undefined) {
        q = query(q, where('parentId', '==', parentId));
      }

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as FolderInfo;
    } catch (error) {
      console.error('获取文件夹失败:', error);
      throw new Error('获取文件夹失败');
    }
  }

  /**
   * 更新文件夹
   */
  async updateFolder(folderId: string, updates: Partial<FolderInfo>): Promise<void> {
    try {
      const docRef = doc(db, this.FOLDERS_COLLECTION, folderId);
      
      // 如果更新了名称，需要更新路径
      if (updates.name) {
        const folder = await this.getFolderById(folderId);
        if (folder) {
          updates.path = await this.buildFolderPath(updates.name, folder.parentId);
        }
      }

      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('更新文件夹失败:', error);
      throw new Error('更新文件夹失败');
    }
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(folderId: string): Promise<void> {
    try {
      // 检查文件夹是否为空
      const files = await this.getFiles({ folderId });
      if (files.length > 0) {
        throw new Error('文件夹不为空，无法删除');
      }

      // 检查是否有子文件夹
      const subFolders = await this.getFolders({ parentId: folderId });
      if (subFolders.length > 0) {
        throw new Error('文件夹包含子文件夹，无法删除');
      }

      const docRef = doc(db, this.FOLDERS_COLLECTION, folderId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('删除文件夹失败:', error);
      throw new Error('删除文件夹失败');
    }
  }

  /**
   * 上传文件信息
   */
  async uploadFileInfo(fileData: Omit<FileInfo, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.FILES_COLLECTION), {
        ...fileData,
        downloadCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // 更新文件夹统计信息
      await this.updateFolderStats(fileData.folderId);

      return docRef.id;
    } catch (error) {
      console.error('上传文件信息失败:', error);
      throw new Error('上传文件信息失败');
    }
  }

  /**
   * 获取文件列表
   */
  async getFiles(options: FileQueryOptions = {}): Promise<FileInfo[]> {
    try {
      let q = query(collection(db, this.FILES_COLLECTION));

      // 添加筛选条件
      if (options.folderId) {
        q = query(q, where('folderId', '==', options.folderId));
      }
      if (options.fileType) {
        q = query(q, where('fileType', '==', options.fileType));
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
      const files: FileInfo[] = [];

      querySnapshot.forEach((doc) => {
        files.push({
          id: doc.id,
          ...doc.data()
        } as FileInfo);
      });

      return files;
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw new Error('获取文件列表失败');
    }
  }

  /**
   * 根据ID获取文件
   */
  async getFileById(fileId: string): Promise<FileInfo | null> {
    try {
      const docRef = doc(db, this.FILES_COLLECTION, fileId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as FileInfo;
      } else {
        return null;
      }
    } catch (error) {
      console.error('获取文件失败:', error);
      throw new Error('获取文件失败');
    }
  }

  /**
   * 更新文件信息
   */
  async updateFileInfo(fileId: string, updates: Partial<FileInfo>): Promise<void> {
    try {
      const docRef = doc(db, this.FILES_COLLECTION, fileId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('更新文件信息失败:', error);
      throw new Error('更新文件信息失败');
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const file = await this.getFileById(fileId);
      if (!file) {
        throw new Error('文件不存在');
      }

      const docRef = doc(db, this.FILES_COLLECTION, fileId);
      await deleteDoc(docRef);

      // 更新文件夹统计信息
      await this.updateFolderStats(file.folderId);
    } catch (error) {
      console.error('删除文件失败:', error);
      throw new Error('删除文件失败');
    }
  }

  /**
   * 批量删除文件
   */
  async batchDeleteFiles(fileIds: string[]): Promise<void> {
    try {
      const deletePromises = fileIds.map(id => this.deleteFile(id));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('批量删除文件失败:', error);
      throw new Error('批量删除文件失败');
    }
  }

  /**
   * 移动文件到其他文件夹
   */
  async moveFiles(fileIds: string[], targetFolderId: string): Promise<void> {
    try {
      const targetFolder = await this.getFolderById(targetFolderId);
      if (!targetFolder) {
        throw new Error('目标文件夹不存在');
      }

      const updatePromises = fileIds.map(fileId => 
        this.updateFileInfo(fileId, { 
          folderId: targetFolderId,
          folderName: targetFolder.name 
        })
      );

      await Promise.all(updatePromises);

      // 更新相关文件夹统计信息
      const files = await Promise.all(fileIds.map(id => this.getFileById(id)));
      const folderIds = [...new Set(files.map(f => f?.folderId).filter(Boolean))];
      const updateStatsPromises = folderIds.map(id => this.updateFolderStats(id!));
      await Promise.all(updateStatsPromises);
    } catch (error) {
      console.error('移动文件失败:', error);
      throw new Error('移动文件失败');
    }
  }

  /**
   * 搜索文件
   */
  async searchFiles(searchTerm: string, options: FileQueryOptions = {}): Promise<FileInfo[]> {
    try {
      const files = await this.getFiles(options);
      
      return files.filter(file => 
        file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        file.folderName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('搜索文件失败:', error);
      throw new Error('搜索文件失败');
    }
  }

  /**
   * 获取文件统计信息
   */
  async getFileStats(): Promise<FileStats> {
    try {
      const [files, folders] = await Promise.all([
        this.getFiles(),
        this.getFolders()
      ]);
      
      const stats: FileStats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.fileSize, 0),
        folderCount: folders.length,
        filesByType: {} as Record<FileType, number>,
        filesByFolder: {},
        recentUploads: files.slice(0, 10),
        mostDownloaded: files.sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 10)
      };

      // 统计按类型分组
      files.forEach(file => {
        stats.filesByType[file.fileType] = (stats.filesByType[file.fileType] || 0) + 1;
        stats.filesByFolder[file.folderId] = (stats.filesByFolder[file.folderId] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('获取文件统计失败:', error);
      throw new Error('获取文件统计失败');
    }
  }

  /**
   * 更新文件夹统计信息
   */
  private async updateFolderStats(folderId: string): Promise<void> {
    try {
      const files = await this.getFiles({ folderId });
      const fileCount = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);

      await this.updateFolder(folderId, { fileCount, totalSize });
    } catch (error) {
      console.error('更新文件夹统计失败:', error);
    }
  }

  /**
   * 构建文件夹路径
   */
  private async buildFolderPath(name: string, parentId?: string): Promise<string> {
    if (!parentId) {
      return `/${name}`;
    }

    const parentFolder = await this.getFolderById(parentId);
    if (!parentFolder) {
      throw new Error('父文件夹不存在');
    }

    return `${parentFolder.path}/${name}`;
  }

  /**
   * 获取文件类型
   */
  getFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileType.DOCUMENT;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return FileType.ARCHIVE;
    return FileType.OTHER;
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取文件夹图标
   */
  getFolderIcon(folderName: string): string {
    const iconMap: Record<string, string> = {
      'documents': '📄',
      'images': '🖼️',
      'videos': '🎥',
      'audio': '🎵',
      'archives': '📦',
      'downloads': '⬇️',
      'temp': '🗂️',
      'shared': '👥'
    };

    const lowerName = folderName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }

    return '📁';
  }

  /**
   * 获取文件夹颜色
   */
  getFolderColor(folderName: string): string {
    const colorMap: Record<string, string> = {
      'documents': '#1890ff',
      'images': '#52c41a',
      'videos': '#fa8c16',
      'audio': '#eb2f96',
      'archives': '#722ed1',
      'downloads': '#13c2c2',
      'temp': '#666',
      'shared': '#f5222d'
    };

    const lowerName = folderName.toLowerCase();
    for (const [key, color] of Object.entries(colorMap)) {
      if (lowerName.includes(key)) {
        return color;
      }
    }

    return '#1890ff';
  }
}

export const folderManagementService = new FolderManagementService();
export default folderManagementService;
