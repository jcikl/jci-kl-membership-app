import { getChapterSettings, saveChapterSettings, getDefaultChapterSettings } from '@/services/chapterSettingsService';

/**
 * 初始化分会设置
 * 如果系统中没有分会设置，则创建默认设置
 */
export const initChapterSettings = async (): Promise<void> => {
  try {
    console.log('正在检查分会设置...');
    
    const existingSettings = await getChapterSettings();
    
    if (!existingSettings) {
      console.log('未找到分会设置，正在创建默认设置...');
      const defaultSettings = getDefaultChapterSettings();
      await saveChapterSettings(defaultSettings);
      console.log('默认分会设置创建成功');
    } else {
      console.log('分会设置已存在');
    }
  } catch (error) {
    console.error('初始化分会设置失败:', error);
    throw error;
  }
};
