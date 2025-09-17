import { getChapterSettings, saveChapterSettings, getDefaultChapterSettings } from '@/modules/system/services/chapterSettingsService';

/**
 * 初始化分会设置
 * 如果系统中没有分会设置，则创建默认设置
 */
export const initChapterSettings = async (): Promise<void> => {
  try {
    const existingSettings = await getChapterSettings();
    
    if (!existingSettings) {
      const defaultSettings = getDefaultChapterSettings();
      await saveChapterSettings(defaultSettings);
    }
  } catch (error) {
    console.error('初始化分会设置失败:', error);
    throw error;
  }
};
