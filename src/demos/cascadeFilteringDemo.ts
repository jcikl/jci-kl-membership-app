/**
 * 级联筛选功能演示
 * 展示分会设置中的世界区域 -> 国家 -> 国家区域级联筛选
 */

import { getWorldRegions } from '@/services/worldRegionService';
import { getCountries } from '@/services/countryService';
import { getNationalRegions } from '@/services/nationalRegionService';
import { WorldRegion, Country, NationalRegion } from '@/types';

/**
 * 演示级联筛选功能
 */
export const demonstrateCascadeFiltering = async () => {
  try {
    console.log('🎯 分会设置级联筛选功能演示');
    console.log('=====================================\n');

    // 获取所有数据
    const [worldRegions, countries, nationalRegions] = await Promise.all([
      getWorldRegions(),
      getCountries(),
      getNationalRegions()
    ]);

    console.log('📊 数据概览:');
    console.log(`- 世界区域: ${worldRegions.length} 个`);
    console.log(`- 国家: ${countries.length} 个`);
    console.log(`- 国家区域: ${nationalRegions.length} 个\n`);

    // 演示ASPAC区域的级联筛选
    const aspacRegion = worldRegions.find((r: WorldRegion) => r.code === 'ASPAC');
    if (aspacRegion) {
      console.log('🌏 演示: 选择世界区域 "JCI Asia and the Pacific (JCI ASPAC)"');
      console.log('↓');
      
      // 筛选该区域下的国家
      const aspacCountries = countries.filter((c: Country) => c.worldRegionId === aspacRegion.id);
      console.log(`📋 筛选出 ${aspacCountries.length} 个国家:`);
      aspacCountries.forEach((country: Country) => {
        console.log(`   - ${country.name} (${country.code})`);
      });
      console.log('');

      // 演示选择马来西亚后的筛选
      const malaysia = aspacCountries.find((c: Country) => c.code === 'MY');
      if (malaysia) {
        console.log('🇲🇾 演示: 选择国家 "JCI Malaysia"');
        console.log('↓');
        
        // 筛选该国家下的国家区域
        const malaysianRegions = nationalRegions.filter((r: NationalRegion) => r.countryId === malaysia.id);
        console.log(`🗺️ 筛选出 ${malaysianRegions.length} 个国家区域:`);
        malaysianRegions.forEach((region: NationalRegion) => {
          console.log(`   - ${region.name} (${region.code})`);
        });
        console.log('');
      }
    }

    // 演示其他区域的筛选
    const otherRegions = worldRegions.filter((r: WorldRegion) => r.code !== 'ASPAC');
    if (otherRegions.length > 0) {
      console.log('🌍 其他世界区域筛选演示:');
      otherRegions.forEach((region: WorldRegion) => {
        const regionCountries = countries.filter((c: Country) => c.worldRegionId === region.id);
        console.log(`- ${region.name}: ${regionCountries.length} 个国家`);
        if (regionCountries.length > 0) {
          regionCountries.forEach((country: Country) => {
            const countryRegions = nationalRegions.filter((r: NationalRegion) => r.countryId === country.id);
            console.log(`  - ${country.name}: ${countryRegions.length} 个区域`);
          });
        }
      });
      console.log('');
    }

    // 演示清空上级选择的效果
    console.log('🔄 演示: 清空上级选择的效果');
    console.log('1. 清空世界区域选择 → 国家和国家区域选择被清空');
    console.log('2. 清空国家选择 → 国家区域选择被清空');
    console.log('3. 重新选择世界区域 → 国家选项重新筛选');
    console.log('4. 重新选择国家 → 国家区域选项重新筛选\n');

    // 演示用户界面提示
    console.log('💡 用户界面提示:');
    console.log('- 未选择世界区域时，国家下拉框显示 "请先选择世界区域"');
    console.log('- 未选择国家时，国家区域下拉框显示 "请先选择国家"');
    console.log('- 下拉框在无选项时会被禁用');
    console.log('- 选择上级选项后，下级选项自动清空并重新筛选\n');

    console.log('✅ 级联筛选功能演示完成！');
    console.log('这个功能确保了数据的一致性和用户体验的流畅性。');

  } catch (error) {
    console.error('❌ 级联筛选功能演示失败:', error);
    throw error;
  }
};

/**
 * 生成级联筛选的流程图
 */
export const generateCascadeFlowDiagram = () => {
  const diagram = `
分会设置级联筛选流程图
====================

用户操作流程:
1. 用户选择世界区域
   ↓
2. 系统筛选该区域下的国家
   ↓
3. 用户选择国家
   ↓
4. 系统筛选该国家下的国家区域
   ↓
5. 用户选择国家区域
   ↓
6. 完成分会区域设置

数据筛选逻辑:
世界区域 (World Region)
    ↓ (worldRegionId)
国家 (Country)
    ↓ (countryId)
国家区域 (National Region)
    ↓ (nationalRegionId)
分会 (Chapter)

清空逻辑:
- 清空世界区域 → 清空国家和国家区域
- 清空国家 → 清空国家区域
- 保持数据一致性
`;

  console.log(diagram);
};

// 如果直接运行此演示
if (require.main === module) {
  demonstrateCascadeFiltering()
    .then(() => {
      generateCascadeFlowDiagram();
    })
    .catch((error) => {
      console.error('演示执行失败:', error);
      process.exit(1);
    });
}
