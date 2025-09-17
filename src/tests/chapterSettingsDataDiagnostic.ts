/**
 * 分会设置数据诊断
 * 
 * 诊断分会设置中所属国家和国家区域显示document ID的问题
 */

import { getWorldRegions } from '@/modules/system/services/worldRegionService';
import { getCountries } from '@/modules/system/services/countryService';
import { getNationalRegions } from '@/modules/system/services/nationalRegionService';

// 诊断数据结构
const diagnoseDataStructure = async () => {
  console.log('🔍 开始诊断分会设置数据结构...\n');

  try {
    // 获取所有数据
    const [worldRegions, countries, nationalRegions] = await Promise.all([
      getWorldRegions(),
      getCountries(),
      getNationalRegions()
    ]);

    console.log('=== 世界区域数据 ===');
    console.log(`总数: ${worldRegions.length}`);
    worldRegions.forEach((region, index) => {
      console.log(`${index + 1}. ID: ${region.id}`);
      console.log(`   名称: ${region.name}`);
      console.log(`   代码: ${region.code}`);
      console.log(`   覆盖国家: ${region.countries?.length || 0} 个`);
      console.log('');
    });

    console.log('=== 国家数据 ===');
    console.log(`总数: ${countries.length}`);
    countries.forEach((country, index) => {
      console.log(`${index + 1}. ID: ${country.id}`);
      console.log(`   名称: ${country.name}`);
      console.log(`   代码: ${country.code}`);
      console.log(`   世界区域ID: ${country.worldRegionId || '未分配'}`);
      console.log(`   国家区域: ${country.nationalRegions?.length || 0} 个`);
      console.log('');
    });

    console.log('=== 国家区域数据 ===');
    console.log(`总数: ${nationalRegions.length}`);
    nationalRegions.forEach((region, index) => {
      console.log(`${index + 1}. ID: ${region.id}`);
      console.log(`   名称: ${region.name}`);
      console.log(`   代码: ${region.code}`);
      console.log(`   国家ID: ${region.countryId || '未分配'}`);
      console.log(`   分会: ${region.chapters?.length || 0} 个`);
      console.log('');
    });

    // 检查数据完整性
    console.log('=== 数据完整性检查 ===');
    
    // 检查国家是否有对应的世界区域
    const countriesWithoutWorldRegion = countries.filter(c => !c.worldRegionId);
    console.log(`没有世界区域的国家: ${countriesWithoutWorldRegion.length} 个`);
    if (countriesWithoutWorldRegion.length > 0) {
      countriesWithoutWorldRegion.forEach(country => {
        console.log(`  - ${country.name} (${country.id})`);
      });
    }

    // 检查国家区域是否有对应的国家
    const regionsWithoutCountry = nationalRegions.filter(r => !r.countryId);
    console.log(`没有国家的国家区域: ${regionsWithoutCountry.length} 个`);
    if (regionsWithoutCountry.length > 0) {
      regionsWithoutCountry.forEach(region => {
        console.log(`  - ${region.name} (${region.id})`);
      });
    }

    // 检查级联关系
    console.log('\n=== 级联关系检查 ===');
    
    // 检查世界区域 -> 国家的级联
    worldRegions.forEach(worldRegion => {
      const relatedCountries = countries.filter(c => c.worldRegionId === worldRegion.id);
      console.log(`世界区域 "${worldRegion.name}" 关联的国家: ${relatedCountries.length} 个`);
      relatedCountries.forEach(country => {
        console.log(`  - ${country.name} (${country.id})`);
      });
    });

    // 检查国家 -> 国家区域的级联
    countries.forEach(country => {
      const relatedRegions = nationalRegions.filter(r => r.countryId === country.id);
      console.log(`国家 "${country.name}" 关联的国家区域: ${relatedRegions.length} 个`);
      relatedRegions.forEach(region => {
        console.log(`  - ${region.name} (${region.id})`);
      });
    });

    // 模拟Select组件的显示逻辑
    console.log('\n=== Select组件显示逻辑测试 ===');
    
    // 模拟世界区域Select
    console.log('世界区域Select选项:');
    worldRegions.forEach(region => {
      console.log(`  <Option key="${region.id}" value="${region.id}">${region.name} (${region.code})</Option>`);
    });

    // 模拟国家Select（假设选择了第一个世界区域）
    if (worldRegions.length > 0 && countries.length > 0) {
      const selectedWorldRegionId = worldRegions[0].id;
      const filteredCountries = countries.filter(c => c.worldRegionId === selectedWorldRegionId);
      
      console.log(`\n当选择世界区域 "${worldRegions[0].name}" 时，国家Select选项:`);
      if (filteredCountries.length > 0) {
        filteredCountries.forEach(country => {
          console.log(`  <Option key="${country.id}" value="${country.id}">${country.name} (${country.code})</Option>`);
        });
      } else {
        console.log('  没有找到对应的国家');
      }
    }

    // 模拟国家区域Select（假设选择了第一个国家）
    if (countries.length > 0 && nationalRegions.length > 0) {
      const selectedCountryId = countries[0].id;
      const filteredRegions = nationalRegions.filter(r => r.countryId === selectedCountryId);
      
      console.log(`\n当选择国家 "${countries[0].name}" 时，国家区域Select选项:`);
      if (filteredRegions.length > 0) {
        filteredRegions.forEach(region => {
          console.log(`  <Option key="${region.id}" value="${region.id}">${region.name} (${region.code})</Option>`);
        });
      } else {
        console.log('  没有找到对应的国家区域');
      }
    }

  } catch (error) {
    console.error('❌ 诊断过程中出现错误:', error);
  }
};

// 检查分会设置数据加载
const checkChapterSettingsDataLoading = async () => {
  console.log('\n🔍 检查分会设置数据加载...\n');

  try {
    // 模拟分会设置的数据加载过程
    const [worldRegions, countries, nationalRegions] = await Promise.all([
      getWorldRegions(),
      getCountries(),
      getNationalRegions()
    ]);

    console.log('数据加载结果:');
    console.log(`- 世界区域: ${worldRegions.length} 个`);
    console.log(`- 国家: ${countries.length} 个`);
    console.log(`- 国家区域: ${nationalRegions.length} 个`);

    // 检查数据是否有name字段
    console.log('\n数据字段检查:');
    
    if (worldRegions.length > 0) {
      const sampleWorldRegion = worldRegions[0];
      console.log('世界区域示例数据:');
      console.log(`  - id: ${sampleWorldRegion.id}`);
      console.log(`  - name: ${sampleWorldRegion.name || '❌ 缺少name字段'}`);
      console.log(`  - code: ${sampleWorldRegion.code || '❌ 缺少code字段'}`);
    }

    if (countries.length > 0) {
      const sampleCountry = countries[0];
      console.log('国家示例数据:');
      console.log(`  - id: ${sampleCountry.id}`);
      console.log(`  - name: ${sampleCountry.name || '❌ 缺少name字段'}`);
      console.log(`  - code: ${sampleCountry.code || '❌ 缺少code字段'}`);
      console.log(`  - worldRegionId: ${sampleCountry.worldRegionId || '❌ 缺少worldRegionId字段'}`);
    }

    if (nationalRegions.length > 0) {
      const sampleRegion = nationalRegions[0];
      console.log('国家区域示例数据:');
      console.log(`  - id: ${sampleRegion.id}`);
      console.log(`  - name: ${sampleRegion.name || '❌ 缺少name字段'}`);
      console.log(`  - code: ${sampleRegion.code || '❌ 缺少code字段'}`);
      console.log(`  - countryId: ${sampleRegion.countryId || '❌ 缺少countryId字段'}`);
    }

  } catch (error) {
    console.error('❌ 检查数据加载时出现错误:', error);
  }
};

// 运行所有诊断
const runDiagnosis = async () => {
  console.log('🚀 开始分会设置数据诊断\n');
  
  await diagnoseDataStructure();
  await checkChapterSettingsDataLoading();
  
  console.log('\n✅ 诊断完成');
  console.log('\n📋 可能的问题原因:');
  console.log('1. 数据库中缺少name或code字段');
  console.log('2. 数据加载时字段映射错误');
  console.log('3. Select组件的Option渲染逻辑问题');
  console.log('4. 级联筛选逻辑导致数据丢失');
};

// 导出诊断函数
export {
  diagnoseDataStructure,
  checkChapterSettingsDataLoading,
  runDiagnosis
};

// 如果直接运行此文件，执行诊断
if (require.main === module) {
  runDiagnosis();
}
