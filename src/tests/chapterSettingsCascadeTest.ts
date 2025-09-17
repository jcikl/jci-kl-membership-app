/**
 * 分会设置级联筛选功能测试
 * 测试世界区域 -> 国家 -> 国家区域的级联筛选逻辑
 */

import { getWorldRegions } from '@/services/worldRegionService';
import { getCountries } from '@/services/countryService';
import { getNationalRegions } from '@/services/nationalRegionService';
import { Country, NationalRegion } from '@/types';

// 模拟筛选函数
const filterCountriesByWorldRegion = (countries: Country[], worldRegionId: string) => {
  return countries.filter(country => country.worldRegionId === worldRegionId);
};

const filterNationalRegionsByCountry = (nationalRegions: NationalRegion[], countryId: string) => {
  return nationalRegions.filter(region => region.countryId === countryId);
};

/**
 * 测试级联筛选功能
 */
export const testCascadeFiltering = async () => {
  try {
    console.log('开始测试级联筛选功能...');

    // 1. 获取所有数据
    const [worldRegions, countries, nationalRegions] = await Promise.all([
      getWorldRegions(),
      getCountries(),
      getNationalRegions()
    ]);

    console.log(`获取到 ${worldRegions.length} 个世界区域`);
    console.log(`获取到 ${countries.length} 个国家`);
    console.log(`获取到 ${nationalRegions.length} 个国家区域`);

    // 2. 测试世界区域筛选国家
    const aspacRegion = worldRegions.find(r => r.code === 'ASPAC');
    if (aspacRegion) {
      const aspacCountries = filterCountriesByWorldRegion(countries, aspacRegion.id);
      console.log(`ASPAC区域下有 ${aspacCountries.length} 个国家:`, 
        aspacCountries.map(c => c.name));
    }

    // 3. 测试国家筛选国家区域
    const malaysia = countries.find(c => c.code === 'MY');
    if (malaysia) {
      const malaysianRegions = filterNationalRegionsByCountry(nationalRegions, malaysia.id);
      console.log(`马来西亚下有 ${malaysianRegions.length} 个国家区域:`, 
        malaysianRegions.map(r => r.name));
    }

    // 4. 测试完整级联
    if (aspacRegion && malaysia) {
      console.log('\n完整级联测试:');
      console.log(`1. 选择世界区域: ${aspacRegion.name}`);
      
      const filteredCountries = filterCountriesByWorldRegion(countries, aspacRegion.id);
      console.log(`2. 筛选出国家: ${filteredCountries.map(c => c.name).join(', ')}`);
      
      const filteredRegions = filterNationalRegionsByCountry(nationalRegions, malaysia.id);
      console.log(`3. 选择马来西亚后筛选出区域: ${filteredRegions.map(r => r.name).join(', ')}`);
    }

    console.log('\n级联筛选功能测试完成！');
    return true;

  } catch (error) {
    console.error('级联筛选功能测试失败:', error);
    return false;
  }
};

/**
 * 验证数据完整性
 */
export const validateDataIntegrity = async () => {
  try {
    console.log('开始验证数据完整性...');

    const [worldRegions, countries, nationalRegions] = await Promise.all([
      getWorldRegions(),
      getCountries(),
      getNationalRegions()
    ]);

    // 检查是否有国家没有关联世界区域
    const countriesWithoutRegion = countries.filter(c => !c.worldRegionId);
    if (countriesWithoutRegion.length > 0) {
      console.warn(`发现 ${countriesWithoutRegion.length} 个国家没有关联世界区域:`, 
        countriesWithoutRegion.map(c => c.name));
    }

    // 检查是否有国家区域没有关联国家
    const regionsWithoutCountry = nationalRegions.filter(r => !r.countryId);
    if (regionsWithoutCountry.length > 0) {
      console.warn(`发现 ${regionsWithoutCountry.length} 个国家区域没有关联国家:`, 
        regionsWithoutCountry.map(r => r.name));
    }

    // 检查是否有国家关联了不存在的世界区域
    const invalidWorldRegionRefs = countries.filter(c => 
      c.worldRegionId && !worldRegions.find(wr => wr.id === c.worldRegionId)
    );
    if (invalidWorldRegionRefs.length > 0) {
      console.warn(`发现 ${invalidWorldRegionRefs.length} 个国家关联了无效的世界区域:`, 
        invalidWorldRegionRefs.map(c => c.name));
    }

    // 检查是否有国家区域关联了不存在的国家
    const invalidCountryRefs = nationalRegions.filter(r => 
      r.countryId && !countries.find(c => c.id === r.countryId)
    );
    if (invalidCountryRefs.length > 0) {
      console.warn(`发现 ${invalidCountryRefs.length} 个国家区域关联了无效的国家:`, 
        invalidCountryRefs.map(r => r.name));
    }

    console.log('数据完整性验证完成！');
    return true;

  } catch (error) {
    console.error('数据完整性验证失败:', error);
    return false;
  }
};

// 如果直接运行此测试
if (require.main === module) {
  Promise.all([
    testCascadeFiltering(),
    validateDataIntegrity()
  ]).then(([cascadeResult, integrityResult]) => {
    if (cascadeResult && integrityResult) {
      console.log('\n✅ 所有测试通过！');
      process.exit(0);
    } else {
      console.log('\n❌ 部分测试失败！');
      process.exit(1);
    }
  }).catch((error) => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}
