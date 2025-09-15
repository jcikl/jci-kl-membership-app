/**
 * 全局设置总指挥系统使用示例
 * 演示如何使用总指挥系统检查和修正代码合规性
 */

import { globalSettingsCommander } from '@/config/globalSettingsCommander';

// 示例1: 检查不合规的代码
const nonCompliantCode = `
import React from 'react';
import { Form, Input, DatePicker } from 'antd';

const MyComponent: React.FC = () => {
  const validateEmail = (email: string) => {
    return /^[^@]*@[^@]*\.[^@]*$/.test(email);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB');
  };

  return (
    <Form>
      <Form.Item label="邮箱">
        <Input placeholder="请输入邮箱" />
      </Form.Item>
      <Form.Item label="日期">
        <DatePicker format="DD-MMM-YYYY" />
      </Form.Item>
    </Form>
  );
};

export default MyComponent;
`;

// 示例2: 检查合规的代码
const compliantCode = `
import React from 'react';
import { Form, Input, DatePicker } from 'antd';
import { globalValidationService, GLOBAL_VALIDATION_CONFIG } from '@/config/globalValidationSettings';
import { globalDateService, GLOBAL_DATE_CONFIG } from '@/config/globalDateSettings';

const MyComponent: React.FC = () => {
  const validateEmail = (email: string) => {
    return globalValidationService.validateEmail(email);
  };

  const formatDate = (date: Date) => {
    return globalDateService.formatDate(date);
  };

  return (
    <Form>
      <Form.Item label="邮箱">
        <Input placeholder="请输入邮箱" />
      </Form.Item>
      <Form.Item label="日期">
        <DatePicker format={GLOBAL_DATE_CONFIG.STANDARD_FORMAT} />
      </Form.Item>
    </Form>
  );
};

export default MyComponent;
`;

/**
 * 运行示例
 */
export async function runGlobalSettingsCommanderExample(): Promise<void> {
  // 检查不合规的代码
  const nonCompliantResult = await globalSettingsCommander.checkFileCompliance(
    'examples/nonCompliant.tsx',
    nonCompliantCode
  );

  // 检查合规的代码
  const compliantResult = await globalSettingsCommander.checkFileCompliance(
    'examples/compliant.tsx',
    compliantCode
  );

  // 演示自动修正
  // const _correctedCode = globalSettingsCommander.autoCorrectCode(
  //   nonCompliantCode,
  //   nonCompliantResult.violations
  // );

  // 生成报告
  const report = globalSettingsCommander.generateComplianceReport([
    nonCompliantResult,
    compliantResult
  ]);

  console.log(report);
}

/**
 * 批量检查示例
 */
export async function runBatchCheckExample(): Promise<void> {
  const files = [
    { path: 'examples/nonCompliant.tsx', content: nonCompliantCode },
    { path: 'examples/compliant.tsx', content: compliantCode }
  ];

  const results = await globalSettingsCommander.checkMultipleFilesCompliance(files);
  
  // 输出详细结果
  results.forEach(result => {
    console.log(`📄 ${result.filePath}:`);
    console.log(`   合规性: ${result.isCompliant ? '✅' : '❌'}`);
    console.log(`   分数: ${result.score}/100`);
    console.log(`   违规: ${result.violations.length}`);
    console.log(`   建议: ${result.recommendations.length}\n`);
  });
}

// 如果直接运行此文件
if (require.main === module) {
  runGlobalSettingsCommanderExample()
    .then(() => runBatchCheckExample())
    .catch(() => {});
}
