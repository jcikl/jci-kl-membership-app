import { 
  initializeDefaultWorldRegions,
  getWorldRegions,
  updateWorldRegion 
} from '@/modules/system/services/worldRegionService';
import { 
  initializeDefaultCountries,
  getCountries,
  updateCountry 
} from '@/modules/system/services/countryService';
import { 
  initializeDefaultMalaysianRegions,
  getNationalRegions
} from '@/modules/system/services/nationalRegionService';

/**
 * 初始化区域数据
 * 包括世界区域、国家和国家区域的默认数据
 */
export const initializeRegionalData = async (): Promise<void> => {
  try {
    console.log('开始初始化区域数据...');

    // 1. 初始化世界区域
    console.log('初始化世界区域...');
    await initializeDefaultWorldRegions();
    
    // 2. 获取世界区域数据，用于后续关联
    const worldRegions = await getWorldRegions();
    const aspacRegion = worldRegions.find(r => r.code === 'ASPAC');
    
    if (!aspacRegion) {
      throw new Error('未找到ASPAC世界区域');
    }

    // 3. 初始化国家
    console.log('初始化国家...');
    await initializeDefaultCountries();
    
    // 4. 获取国家数据并更新世界区域关联
    const countries = await getCountries();
    const malaysia = countries.find(c => c.code === 'MY');
    const singapore = countries.find(c => c.code === 'SG');
    const china = countries.find(c => c.code === 'CN');
    
    // 更新马来西亚、新加坡、中国为ASPAC区域
    if (malaysia) {
      await updateCountry(malaysia.id, { worldRegionId: aspacRegion.id });
      console.log('更新马来西亚为ASPAC区域');
    }
    
    if (singapore) {
      await updateCountry(singapore.id, { worldRegionId: aspacRegion.id });
      console.log('更新新加坡为ASPAC区域');
    }
    
    if (china) {
      await updateCountry(china.id, { worldRegionId: aspacRegion.id });
      console.log('更新中国为ASPAC区域');
    }

    // 5. 初始化马来西亚国家区域
    if (malaysia) {
      console.log('初始化马来西亚国家区域...');
      await initializeDefaultMalaysianRegions(malaysia.id);
    }

    // 6. 更新世界区域的覆盖国家
    const aspacCountries = [malaysia, singapore, china].filter(Boolean).map(c => c!.id);
    await updateWorldRegion(aspacRegion.id, { countries: aspacCountries });

    // 7. 更新其他世界区域的覆盖国家（目前为空，但保持数据结构一致）
    const otherRegions = worldRegions.filter(r => r.code !== 'ASPAC');
    for (const region of otherRegions) {
      await updateWorldRegion(region.id, { countries: [] });
    }

    console.log('区域数据初始化完成！');
    console.log('已创建：');
    console.log('- 4个世界区域 (AMEC, AMERICA, ASPAC, EUROPE)');
    console.log('- 3个国家 (Malaysia, Singapore, China)');
    console.log('- 5个马来西亚国家区域 (Central, South, North, Sabah, Sarawak)');

  } catch (error) {
    console.error('初始化区域数据失败:', error);
    throw error;
  }
};

/**
 * 检查区域数据是否已初始化
 */
export const checkRegionalDataInitialized = async (): Promise<boolean> => {
  try {
    const [worldRegions, countries, nationalRegions] = await Promise.all([
      getWorldRegions(),
      getCountries(),
      getNationalRegions()
    ]);

    return worldRegions.length > 0 && countries.length > 0 && nationalRegions.length > 0;
  } catch (error) {
    console.error('检查区域数据失败:', error);
    return false;
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  initializeRegionalData()
    .then(() => {
      console.log('区域数据初始化成功！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('区域数据初始化失败:', error);
      process.exit(1);
    });
}
