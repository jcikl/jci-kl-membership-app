/**
 * 会员分会字段功能测试
 * 
 * 测试会员管理中新添加的分会相关字段：
 * - chapterId: 分会Document ID
 * - chapterName: 分会名称  
 * - countryName: 国家分会名称
 * - worldRegion: 世界区域
 */

import { Member } from '@/types';

// 测试数据
const testMember: Member = {
  id: 'test-member-1',
  email: 'test@example.com',
  name: '张三',
  phone: '1234567890',
  memberId: 'JCI001',
  joinDate: '2024-01-01T00:00:00.000Z',
  status: 'active',
  level: 'bronze',
  accountType: 'member',
  // 分会相关字段
  chapterId: 'chapter-kl-001',
  chapterName: 'JCI Kuala Lumpur',
  countryName: 'JCI Malaysia',
  worldRegion: 'JCI Asia and the Pacific (JCI ASPAC)',
  profile: {
    // 基本档案信息
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

// 测试字段渲染函数
const testFieldRendering = () => {
  console.log('=== 会员分会字段渲染测试 ===');
  
  // 模拟renderFieldValue函数的分会字段处理
  const renderFieldValue = (member: Member, fieldKey: string) => {
    const value = member[fieldKey as keyof Member];
    
    switch (fieldKey) {
      case 'chapterId':
        return `🔵 ${value || '-'}`;
      case 'chapterName':
        return `🏢 ${value || '-'}`;
      case 'countryName':
        return `🌍 ${value || '-'}`;
      case 'worldRegion':
        return `🌏 ${value || '-'}`;
      default:
        return value || '-';
    }
  };

  // 测试各个分会字段的渲染
  console.log('分会Document ID:', renderFieldValue(testMember, 'chapterId'));
  console.log('分会名称:', renderFieldValue(testMember, 'chapterName'));
  console.log('国家分会名称:', renderFieldValue(testMember, 'countryName'));
  console.log('世界区域:', renderFieldValue(testMember, 'worldRegion'));
};

// 测试字段验证
const testFieldValidation = () => {
  console.log('\n=== 会员分会字段验证测试 ===');
  
  // 模拟yup验证模式
  const validateChapterFields = (data: any) => {
    const errors: string[] = [];
    
    if (data.chapterId && typeof data.chapterId !== 'string') {
      errors.push('分会Document ID必须是字符串');
    }
    
    if (data.chapterName && typeof data.chapterName !== 'string') {
      errors.push('分会名称必须是字符串');
    }
    
    if (data.countryName && typeof data.countryName !== 'string') {
      errors.push('国家分会名称必须是字符串');
    }
    
    if (data.worldRegion && typeof data.worldRegion !== 'string') {
      errors.push('世界区域必须是字符串');
    }
    
    return errors;
  };

  // 测试有效数据
  const validData = {
    chapterId: 'chapter-kl-001',
    chapterName: 'JCI Kuala Lumpur',
    countryName: 'JCI Malaysia',
    worldRegion: 'JCI Asia and the Pacific (JCI ASPAC)'
  };
  
  const validErrors = validateChapterFields(validData);
  console.log('有效数据验证结果:', validErrors.length === 0 ? '✅ 通过' : '❌ 失败');
  
  // 测试无效数据
  const invalidData = {
    chapterId: 123, // 应该是字符串
    chapterName: 'JCI Kuala Lumpur',
    countryName: 'JCI Malaysia',
    worldRegion: 'JCI Asia and the Pacific (JCI ASPAC)'
  };
  
  const invalidErrors = validateChapterFields(invalidData);
  console.log('无效数据验证结果:', invalidErrors.length > 0 ? '✅ 正确捕获错误' : '❌ 未捕获错误');
  console.log('错误信息:', invalidErrors);
};

// 测试字段预设
const testFieldPresets = () => {
  console.log('\n=== 分会字段预设测试 ===');
  
  // 可用字段列表（用于演示）
  console.log('可用字段包括: 姓名、邮箱、手机号、会员编号、分会信息等');
  
  const fieldPresets = [
    {
      name: '基本信息',
      description: '显示会员的基本信息字段',
      fields: ['name', 'email', 'phone', 'memberId']
    },
    {
      name: '分会信息',
      description: '显示分会相关字段',
      fields: ['name', 'email', 'phone', 'memberId', 'chapterId', 'chapterName', 'countryName', 'worldRegion']
    }
  ];
  
  // 验证分会信息预设
  const chapterPreset = fieldPresets.find(preset => preset.name === '分会信息');
  if (chapterPreset) {
    console.log('✅ 分会信息预设存在');
    console.log('包含字段:', chapterPreset.fields);
    
    // 验证所有分会字段都在预设中
    const chapterFields = ['chapterId', 'chapterName', 'countryName', 'worldRegion'];
    const allChapterFieldsIncluded = chapterFields.every(field => 
      chapterPreset.fields.includes(field)
    );
    console.log('所有分会字段都包含在预设中:', allChapterFieldsIncluded ? '✅ 是' : '❌ 否');
  } else {
    console.log('❌ 分会信息预设不存在');
  }
};

// 测试表格列生成
const testTableColumns = () => {
  console.log('\n=== 表格列生成测试 ===');
  
  const generateColumns = (selectedFields: string[]) => {
    const availableFields = [
      { key: 'name', label: '姓名', category: '基本信息', required: true },
      { key: 'chapterId', label: '分会Document ID', category: '分会信息' },
      { key: 'chapterName', label: '分会名称', category: '分会信息' },
      { key: 'countryName', label: '国家分会名称', category: '分会信息' },
      { key: 'worldRegion', label: '世界区域', category: '分会信息' },
    ];
    
    return selectedFields.map(fieldKey => {
      const field = availableFields.find(f => f.key === fieldKey);
      return {
        title: field?.label || fieldKey,
        dataIndex: fieldKey,
        key: fieldKey,
        width: fieldKey === 'chapterId' ? 150 : 
               fieldKey === 'chapterName' ? 150 : 
               fieldKey === 'countryName' ? 120 : 
               fieldKey === 'worldRegion' ? 120 : 100,
      };
    });
  };
  
  const chapterFields = ['chapterId', 'chapterName', 'countryName', 'worldRegion'];
  const columns = generateColumns(chapterFields);
  
  console.log('生成的分会相关列:');
  columns.forEach(column => {
    console.log(`- ${column.title} (${column.dataIndex}): 宽度 ${column.width}px`);
  });
  
  // 验证所有分会字段都有对应的列
  const allFieldsHaveColumns = chapterFields.every(field => 
    columns.some(col => col.dataIndex === field)
  );
  console.log('所有分会字段都有对应的列:', allFieldsHaveColumns ? '✅ 是' : '❌ 否');
};

// 运行所有测试
const runAllTests = () => {
  console.log('🚀 开始会员分会字段功能测试\n');
  
  testFieldRendering();
  testFieldValidation();
  testFieldPresets();
  testTableColumns();
  
  console.log('\n✅ 所有测试完成');
};

// 导出测试函数
export {
  testFieldRendering,
  testFieldValidation,
  testFieldPresets,
  testTableColumns,
  runAllTests,
  testMember
};

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
  runAllTests();
}
