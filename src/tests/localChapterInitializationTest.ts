/**
 * 地方分会初始化测试
 * 
 * 测试初始化马来西亚分会功能，确保数据能正确存储到Firebase
 */

import { initializeDefaultMalaysianChapters, getLocalChapters } from '../services/localChapterService';
import { getNationalRegions } from '../services/nationalRegionService';

// 测试初始化功能
const testInitialization = async () => {
  console.log('🔍 测试马来西亚分会初始化...\n');

  try {
    // 检查初始化前的数据
    console.log('=== 初始化前检查 ===');
    const chaptersBefore = await getLocalChapters();
    console.log(`初始化前分会数量: ${chaptersBefore.length}`);
    
    if (chaptersBefore.length > 0) {
      console.log('现有分会:');
      chaptersBefore.forEach(chapter => {
        console.log(`  - ${chapter.name} (${chapter.code})`);
      });
    }

    // 检查国家区域数据
    console.log('\n=== 检查国家区域数据 ===');
    const nationalRegions = await getNationalRegions();
    console.log(`国家区域数量: ${nationalRegions.length}`);
    
    if (nationalRegions.length > 0) {
      console.log('可用国家区域:');
      nationalRegions.forEach(region => {
        console.log(`  - ${region.name} (${region.code}) - ID: ${region.id}`);
      });
    } else {
      console.log('⚠️  没有找到国家区域数据，初始化可能会失败');
    }

    // 执行初始化
    console.log('\n=== 执行初始化 ===');
    await initializeDefaultMalaysianChapters();

    // 检查初始化后的数据
    console.log('\n=== 初始化后检查 ===');
    const chaptersAfter = await getLocalChapters();
    console.log(`初始化后分会数量: ${chaptersAfter.length}`);
    
    if (chaptersAfter.length > 0) {
      console.log('所有分会:');
      chaptersAfter.forEach(chapter => {
        console.log(`  - ${chapter.name} (${chapter.code})`);
        console.log(`    区域ID: ${chapter.nationalRegionId}`);
        console.log(`    状态: ${chapter.status}`);
        console.log(`    会员数量: ${chapter.memberCount}`);
        console.log(`    成立年份: ${chapter.establishmentYear}`);
        console.log('');
      });
    }

    // 验证结果
    const newChaptersCount = chaptersAfter.length - chaptersBefore.length;
    console.log(`=== 初始化结果 ===`);
    console.log(`新增分会数量: ${newChaptersCount}`);
    
    if (newChaptersCount > 0) {
      console.log('✅ 初始化成功！');
    } else {
      console.log('⚠️  没有新增分会，可能已经存在或初始化失败');
    }

    return {
      success: newChaptersCount > 0,
      beforeCount: chaptersBefore.length,
      afterCount: chaptersAfter.length,
      newCount: newChaptersCount
    };

  } catch (error) {
    console.error('❌ 初始化测试失败:', error);
    return {
      success: false,
      error: error
    };
  }
};

// 测试数据完整性
const testDataIntegrity = async () => {
  console.log('\n🔍 测试数据完整性...\n');

  try {
    const chapters = await getLocalChapters();
    const nationalRegions = await getNationalRegions();

    console.log('=== 数据完整性检查 ===');
    
    // 检查分会数据完整性
    const requiredFields = ['name', 'code', 'nationalRegionId', 'establishmentYear', 'status'];
    let integrityIssues = 0;

    chapters.forEach(chapter => {
      console.log(`检查分会: ${chapter.name}`);
      
      requiredFields.forEach(field => {
        const value = chapter[field as keyof typeof chapter];
        if (!value && value !== 0) {
          console.log(`  ❌ 缺少字段: ${field}`);
          integrityIssues++;
        } else {
          console.log(`  ✅ ${field}: ${value}`);
        }
      });

      // 检查区域关联
      if (chapter.nationalRegionId) {
        const region = nationalRegions.find(r => r.id === chapter.nationalRegionId);
        if (region) {
          console.log(`  ✅ 区域关联: ${region.name} (${region.code})`);
        } else {
          console.log(`  ❌ 区域关联无效: ${chapter.nationalRegionId}`);
          integrityIssues++;
        }
      }

      console.log('');
    });

    console.log(`=== 完整性检查结果 ===`);
    console.log(`发现问题数量: ${integrityIssues}`);
    
    if (integrityIssues === 0) {
      console.log('✅ 数据完整性检查通过');
    } else {
      console.log('❌ 数据完整性检查失败');
    }

    return integrityIssues === 0;

  } catch (error) {
    console.error('❌ 数据完整性测试失败:', error);
    return false;
  }
};

// 测试集合访问
const testCollectionAccess = async () => {
  console.log('\n🔍 测试集合访问...\n');

  try {
    // 测试读取集合
    const chapters = await getLocalChapters();
    console.log(`✅ 成功访问 localChapters 集合`);
    console.log(`集合中文档数量: ${chapters.length}`);

    // 检查集合结构
    if (chapters.length > 0) {
      const sampleChapter = chapters[0];
      console.log('\n示例文档结构:');
      console.log(JSON.stringify(sampleChapter, null, 2));
    }

    return true;

  } catch (error) {
    console.error('❌ 集合访问测试失败:', error);
    console.error('可能的原因:');
    console.error('1. Firebase 配置问题');
    console.error('2. 权限设置问题');
    console.error('3. 集合名称错误');
    console.error('4. 网络连接问题');
    return false;
  }
};

// 运行所有测试
const runAllTests = async () => {
  console.log('🚀 开始地方分会初始化测试\n');
  
  const collectionAccess = await testCollectionAccess();
  if (!collectionAccess) {
    console.log('\n❌ 集合访问失败，无法继续测试');
    return;
  }

  const initializationResult = await testInitialization();
  const dataIntegrity = await testDataIntegrity();
  
  console.log('\n✅ 所有测试完成');
  console.log('\n📋 测试总结:');
  console.log(`- 集合访问: ${collectionAccess ? '✅ 成功' : '❌ 失败'}`);
  console.log(`- 初始化功能: ${initializationResult.success ? '✅ 成功' : '❌ 失败'}`);
  console.log(`- 数据完整性: ${dataIntegrity ? '✅ 通过' : '❌ 失败'}`);
  
  if (initializationResult.success && dataIntegrity) {
    console.log('\n🎉 地方分会初始化功能验证通过！');
  } else {
    console.log('\n⚠️  存在问题需要解决');
  }
};

// 导出测试函数
export {
  testInitialization,
  testDataIntegrity,
  testCollectionAccess,
  runAllTests
};

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
  runAllTests();
}
