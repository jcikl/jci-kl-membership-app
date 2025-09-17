/**
 * 世界区域管理覆盖国家显示功能测试
 * 测试世界区域管理卡片中覆盖国家栏的显示逻辑
 */

import { getWorldRegions } from '@/modules/system/services/worldRegionService';
import { getCountries } from '@/modules/system/services/countryService';

/**
 * 测试世界区域管理覆盖国家显示
 */
export const testWorldRegionCountriesDisplay = async () => {
  try {
    console.log('🎯 测试世界区域管理覆盖国家显示功能');
    console.log('=====================================\n');

    // 1. 获取数据
    const [worldRegions, countries] = await Promise.all([
      getWorldRegions(),
      getCountries()
    ]);

    console.log(`📊 数据概览:`);
    console.log(`- 世界区域: ${worldRegions.length} 个`);
    console.log(`- 国家: ${countries.length} 个\n`);

    // 2. 检查每个世界区域管理的覆盖国家
    console.log('🌍 世界区域管理覆盖国家检查:');
    for (const region of worldRegions) {
      console.log(`\n${region.name} (${region.code}):`);
      
      // 方法1: 检查countries字段
      const countriesFromField = region.countries || [];
      console.log(`   countries字段: ${countriesFromField.length} 个国家`);
      
      // 方法2: 根据worldRegionId动态计算
      const countriesFromRelation = countries.filter(c => c.worldRegionId === region.id);
      console.log(`   关联关系: ${countriesFromRelation.length} 个国家`);
      
      if (countriesFromRelation.length > 0) {
        countriesFromRelation.forEach(country => {
          console.log(`     - ${country.name} (${country.code})`);
        });
      } else {
        console.log(`     - 暂无关联国家`);
      }
      
      // 检查数据一致性
      const isConsistent = countriesFromField.length === countriesFromRelation.length;
      console.log(`   数据一致性: ${isConsistent ? '✅ 一致' : '❌ 不一致'}`);
    }

    // 3. 测试显示逻辑
    console.log('\n🔍 显示逻辑测试:');
    for (const region of worldRegions) {
      const displayCountries = region.countries && region.countries.length > 0 
        ? region.countries.map(id => {
            const country = countries.find(c => c.id === id);
            return country ? country.name : id;
          })
        : countries.filter(c => c.worldRegionId === region.id).map(c => c.name);
      
      console.log(`${region.name}: ${displayCountries.length > 0 ? displayCountries.join(', ') : '暂无'}`);
    }

    // 4. 问题诊断
    console.log('\n🔧 问题诊断:');
    const regionsWithEmptyCountries = worldRegions.filter(r => 
      (!r.countries || r.countries.length === 0) && 
      countries.filter(c => c.worldRegionId === r.id).length === 0
    );
    
    if (regionsWithEmptyCountries.length > 0) {
      console.log(`发现 ${regionsWithEmptyCountries.length} 个区域确实没有关联国家:`);
      regionsWithEmptyCountries.forEach(region => {
        console.log(`  - ${region.name} (${region.code})`);
      });
    }

    const regionsWithInconsistentData = worldRegions.filter(r => {
      const fieldCount = r.countries ? r.countries.length : 0;
      const relationCount = countries.filter(c => c.worldRegionId === r.id).length;
      return fieldCount !== relationCount;
    });

    if (regionsWithInconsistentData.length > 0) {
      console.log(`\n发现 ${regionsWithInconsistentData.length} 个区域数据不一致:`);
      regionsWithInconsistentData.forEach(region => {
        const fieldCount = region.countries ? region.countries.length : 0;
        const relationCount = countries.filter(c => c.worldRegionId === region.id).length;
        console.log(`  - ${region.name}: countries字段=${fieldCount}, 关联关系=${relationCount}`);
      });
      console.log('\n💡 建议: 点击"同步覆盖国家"按钮来修复数据不一致问题');
    }

    console.log('\n✅ 世界区域管理覆盖国家显示功能测试完成！');
    return true;

  } catch (error) {
    console.error('❌ 世界区域管理覆盖国家显示功能测试失败:', error);
    return false;
  }
};

/**
 * 生成数据修复建议
 */
export const generateDataFixSuggestions = async () => {
  try {
    console.log('🔧 数据修复建议');
    console.log('=====================================\n');

    const [worldRegions, countries] = await Promise.all([
      getWorldRegions(),
      getCountries()
    ]);

    console.log('1. 立即修复方案:');
    console.log('   - 在总部设置的世界区域管理子标签中点击"同步覆盖国家"按钮');
    console.log('   - 系统会自动根据国家的worldRegionId字段更新世界区域的countries字段\n');

    console.log('2. 数据初始化方案:');
    console.log('   - 重新运行数据初始化脚本');
    console.log('   - 确保所有世界区域都有正确的覆盖国家数据\n');

    console.log('3. 手动修复方案:');
    for (const region of worldRegions) {
      const regionCountries = countries.filter(c => c.worldRegionId === region.id);
      if (regionCountries.length > 0) {
        console.log(`   - ${region.name}: 应该包含 ${regionCountries.length} 个国家`);
        regionCountries.forEach(country => {
          console.log(`     * ${country.name} (${country.code})`);
        });
      }
    }

    console.log('\n4. 预防措施:');
    console.log('   - 在创建/编辑国家时，自动更新对应世界区域的countries字段');
    console.log('   - 在创建/编辑世界区域时，检查并同步覆盖国家数据');
    console.log('   - 定期运行数据一致性检查');

  } catch (error) {
    console.error('❌ 生成数据修复建议失败:', error);
  }
};

// 如果直接运行此测试
if (require.main === module) {
  testWorldRegionCountriesDisplay()
    .then((result) => {
      if (result) {
        generateDataFixSuggestions();
        console.log('\n🎉 测试完成！请根据建议修复数据不一致问题。');
        process.exit(0);
      } else {
        console.log('\n❌ 测试失败！请检查相关功能。');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}
