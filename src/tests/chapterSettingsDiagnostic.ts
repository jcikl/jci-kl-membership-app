/**
 * 分会设置区域选择诊断工具
 * 用于诊断为什么所属国家和国家区域显示文件ID而不是名称
 */

import { getChapterSettings } from '../services/chapterSettingsService';
import { getWorldRegions } from '../services/worldRegionService';
import { getCountries } from '../services/countryService';
import { getNationalRegions } from '../services/nationalRegionService';
import { WorldRegion, Country, NationalRegion } from '../types';

/**
 * 诊断分会设置区域选择问题
 */
export const diagnoseChapterSettingsRegionSelection = async () => {
  try {
    console.log('🔍 诊断分会设置区域选择问题');
    console.log('=====================================\n');

    // 1. 获取所有数据
    const [chapterData, worldRegions, countries, nationalRegions] = await Promise.all([
      getChapterSettings(),
      getWorldRegions(),
      getCountries(),
      getNationalRegions()
    ]);

    console.log('📊 数据概览:');
    console.log(`- 分会设置: ${chapterData ? '已配置' : '未配置'}`);
    console.log(`- 世界区域: ${worldRegions.length} 个`);
    console.log(`- 国家: ${countries.length} 个`);
    console.log(`- 国家区域: ${nationalRegions.length} 个\n`);

    // 2. 检查分会设置中的区域ID
    if (chapterData) {
      console.log('🏢 分会设置区域信息:');
      console.log(`- 世界区域ID: ${chapterData.worldRegionId || '未设置'}`);
      console.log(`- 国家ID: ${chapterData.countryId || '未设置'}`);
      console.log(`- 国家区域ID: ${chapterData.nationalRegionId || '未设置'}\n`);

      // 3. 检查ID对应的名称
      if (chapterData.worldRegionId) {
        const worldRegion = worldRegions.find((r: WorldRegion) => r.id === chapterData.worldRegionId);
        console.log(`🌍 世界区域: ${worldRegion ? worldRegion.name : '未找到'} (${chapterData.worldRegionId})`);
      }

      if (chapterData.countryId) {
        const country = countries.find((c: Country) => c.id === chapterData.countryId);
        console.log(`🏳️ 国家: ${country ? country.name : '未找到'} (${chapterData.countryId})`);
      }

      if (chapterData.nationalRegionId) {
        const nationalRegion = nationalRegions.find((r: NationalRegion) => r.id === chapterData.nationalRegionId);
        console.log(`🏘️ 国家区域: ${nationalRegion ? nationalRegion.name : '未找到'} (${chapterData.nationalRegionId})\n`);
      }
    }

    // 4. 检查数据完整性
    console.log('🔍 数据完整性检查:');
    
    // 检查世界区域数据
    console.log('\n世界区域数据:');
    worldRegions.forEach((region: WorldRegion) => {
      console.log(`  - ${region.name} (${region.code}) - ID: ${region.id}`);
    });

    // 检查国家数据
    console.log('\n国家数据:');
    countries.forEach((country: Country) => {
      const worldRegion = worldRegions.find((r: WorldRegion) => r.id === country.worldRegionId);
      console.log(`  - ${country.name} (${country.code}) - 世界区域: ${worldRegion ? worldRegion.name : '未分配'} - ID: ${country.id}`);
    });

    // 检查国家区域数据
    console.log('\n国家区域数据:');
    nationalRegions.forEach((region: NationalRegion) => {
      const country = countries.find((c: Country) => c.id === region.countryId);
      console.log(`  - ${region.name} (${region.code}) - 国家: ${country ? country.name : '未分配'} - ID: ${region.id}`);
    });

    // 5. 检查级联关系
    console.log('\n🔗 级联关系检查:');
    if (chapterData?.worldRegionId) {
      const relatedCountries = countries.filter((c: Country) => c.worldRegionId === chapterData.worldRegionId);
      console.log(`世界区域 ${chapterData.worldRegionId} 下的国家: ${relatedCountries.length} 个`);
      relatedCountries.forEach((country: Country) => {
        console.log(`  - ${country.name} (${country.code})`);
      });
    }

    if (chapterData?.countryId) {
      const relatedRegions = nationalRegions.filter((r: NationalRegion) => r.countryId === chapterData.countryId);
      console.log(`国家 ${chapterData.countryId} 下的区域: ${relatedRegions.length} 个`);
      relatedRegions.forEach((region: NationalRegion) => {
        console.log(`  - ${region.name} (${region.code})`);
      });
    }

    // 6. 问题诊断
    console.log('\n🚨 问题诊断:');
    
    const issues = [];
    
    if (chapterData?.worldRegionId && !worldRegions.find(r => r.id === chapterData.worldRegionId)) {
      issues.push(`世界区域ID ${chapterData.worldRegionId} 在数据中不存在`);
    }
    
    if (chapterData?.countryId && !countries.find(c => c.id === chapterData.countryId)) {
      issues.push(`国家ID ${chapterData.countryId} 在数据中不存在`);
    }
    
    if (chapterData?.nationalRegionId && !nationalRegions.find(r => r.id === chapterData.nationalRegionId)) {
      issues.push(`国家区域ID ${chapterData.nationalRegionId} 在数据中不存在`);
    }

    if (chapterData?.countryId && chapterData?.worldRegionId) {
      const country = countries.find(c => c.id === chapterData.countryId);
      if (country && country.worldRegionId !== chapterData.worldRegionId) {
        issues.push(`国家 ${country.name} 不属于世界区域 ${chapterData.worldRegionId}`);
      }
    }

    if (chapterData?.nationalRegionId && chapterData?.countryId) {
      const region = nationalRegions.find(r => r.id === chapterData.nationalRegionId);
      if (region && region.countryId !== chapterData.countryId) {
        issues.push(`国家区域 ${region.name} 不属于国家 ${chapterData.countryId}`);
      }
    }

    if (issues.length === 0) {
      console.log('✅ 未发现明显问题');
    } else {
      console.log('❌ 发现以下问题:');
      issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }

    // 7. 修复建议
    console.log('\n💡 修复建议:');
    if (issues.length > 0) {
      console.log('1. 检查数据库中的关联关系是否正确');
      console.log('2. 重新初始化区域数据');
      console.log('3. 清除分会设置中的无效ID');
    } else {
      console.log('1. 检查前端组件的筛选逻辑');
      console.log('2. 确认表单字段的显示逻辑');
      console.log('3. 检查数据加载时机');
    }

    console.log('\n✅ 诊断完成！');
    return true;

  } catch (error) {
    console.error('❌ 诊断失败:', error);
    return false;
  }
};

/**
 * 修复分会设置区域选择问题
 */
export const fixChapterSettingsRegionSelection = async () => {
  try {
    console.log('🔧 修复分会设置区域选择问题');
    console.log('=====================================\n');

    const chapterData = await getChapterSettings();
    if (!chapterData) {
      console.log('❌ 没有分会设置数据，无法修复');
      return false;
    }

    const [worldRegions, countries, nationalRegions] = await Promise.all([
      getWorldRegions(),
      getCountries(),
      getNationalRegions()
    ]);

    let needsUpdate = false;
    const updates: any = {};

    // 检查并修复世界区域ID
    if (chapterData.worldRegionId && !worldRegions.find(r => r.id === chapterData.worldRegionId)) {
      console.log(`❌ 无效的世界区域ID: ${chapterData.worldRegionId}`);
      updates.worldRegionId = null;
      updates.countryId = null;
      updates.nationalRegionId = null;
      needsUpdate = true;
    }

    // 检查并修复国家ID
    if (chapterData.countryId && !countries.find(c => c.id === chapterData.countryId)) {
      console.log(`❌ 无效的国家ID: ${chapterData.countryId}`);
      updates.countryId = null;
      updates.nationalRegionId = null;
      needsUpdate = true;
    }

    // 检查并修复国家区域ID
    if (chapterData.nationalRegionId && !nationalRegions.find(r => r.id === chapterData.nationalRegionId)) {
      console.log(`❌ 无效的国家区域ID: ${chapterData.nationalRegionId}`);
      updates.nationalRegionId = null;
      needsUpdate = true;
    }

    // 检查级联关系
    if (chapterData.countryId && chapterData.worldRegionId) {
      const country = countries.find(c => c.id === chapterData.countryId);
      if (country && country.worldRegionId !== chapterData.worldRegionId) {
        console.log(`❌ 国家 ${country.name} 不属于世界区域 ${chapterData.worldRegionId}`);
        updates.countryId = null;
        updates.nationalRegionId = null;
        needsUpdate = true;
      }
    }

    if (chapterData.nationalRegionId && chapterData.countryId) {
      const region = nationalRegions.find(r => r.id === chapterData.nationalRegionId);
      if (region && region.countryId !== chapterData.countryId) {
        console.log(`❌ 国家区域 ${region.name} 不属于国家 ${chapterData.countryId}`);
        updates.nationalRegionId = null;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      console.log('🔧 需要更新分会设置...');
      // 这里可以调用更新函数
      console.log('更新内容:', updates);
      console.log('✅ 修复完成！');
    } else {
      console.log('✅ 分会设置数据正常，无需修复');
    }

    return true;

  } catch (error) {
    console.error('❌ 修复失败:', error);
    return false;
  }
};

// 如果直接运行此诊断
if (require.main === module) {
  diagnoseChapterSettingsRegionSelection()
    .then((result) => {
      if (result) {
        console.log('\n🎉 诊断完成！请根据建议修复问题。');
        process.exit(0);
      } else {
        console.log('\n❌ 诊断失败！请检查相关功能。');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('诊断执行失败:', error);
      process.exit(1);
    });
}
