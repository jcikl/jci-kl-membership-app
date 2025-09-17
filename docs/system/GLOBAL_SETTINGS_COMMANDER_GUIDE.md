# 全局设置总指挥系统使用指南

## 🎯 概述

全局设置总指挥系统是一个统一的代码合规性检查和自动修正工具，确保整个代码库完全遵循全局设置标准。

## 🏗️ 系统架构

### 核心组件

1. **全局设置总指挥** (`globalSettingsCommander.ts`)
   - 统一的合规性检查引擎
   - 自动修正功能
   - 报告生成系统

2. **合规性检查脚本** (`globalSettingsComplianceChecker.ts`)
   - 批量文件检查
   - 命令行工具
   - 自动化集成

3. **现有全局设置模块**
   - `globalSystemSettings.ts` - 系统级配置
   - `globalComponentSettings.ts` - UI组件配置
   - `globalValidationSettings.ts` - 数据验证配置
   - `globalDateSettings.ts` - 日期处理配置
   - `globalPermissions.ts` - 权限管理配置
   - `globalCollections.ts` - 集合ID配置

## 🚀 使用方法

### 1. 基本使用

```typescript
import { globalSettingsCommander } from '@/config/globalSettingsCommander';

// 检查单个文件
const result = await globalSettingsCommander.checkFileCompliance(
  'src/components/MyComponent.tsx',
  fileContent
);

console.log(`合规性: ${result.isCompliant}`);
console.log(`分数: ${result.score}/100`);
```

### 2. 批量检查

```typescript
import { runGlobalSettingsComplianceCheck } from '@/scripts/globalSettingsComplianceChecker';

// 检查整个代码库
await runGlobalSettingsComplianceCheck();
```

### 3. 自动修正

```typescript
// 自动修正不合规的代码
const correctedContent = globalSettingsCommander.autoCorrectCode(
  originalContent,
  violations
);
```

## 📋 检查规则

### 禁止的硬编码模式

| 类型 | 模式 | 建议替代方案 |
|------|------|-------------|
| 邮箱验证 | `/^[^@]*@[^@]*\.[^@]*$/` | `globalValidationService.validateEmail()` |
| 手机号验证 | `/^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/` | `globalValidationService.validatePhone()` |
| 身份证验证 | `/^[0-9]{6}-[0-9]{2}-[0-9]{4}$/` | `globalValidationService.validateNRIC()` |
| 会员编号验证 | `/^JCI\d{7}$/` | `globalValidationService.validateMemberId()` |
| 日期格式 | `format="DD-MMM-YYYY"` | `format={GLOBAL_DATE_CONFIG.STANDARD_FORMAT}` |
| 表格分页 | `pageSize: 20` | `...globalComponentService.getTableConfig()` |
| 集合ID | `collection('members')` | `collection(GLOBAL_COLLECTIONS.MEMBERS)` |

### 必需的导入

每个使用全局设置的文件必须导入相应的模块：

```typescript
// 验证相关
import { globalValidationService, GLOBAL_VALIDATION_CONFIG } from '@/config/globalValidationSettings';

// 组件相关
import { globalComponentService, GLOBAL_COMPONENT_CONFIG } from '@/config/globalComponentSettings';

// 日期相关
import { globalDateService, GLOBAL_DATE_CONFIG } from '@/config/globalDateSettings';

// 权限相关
import { globalPermissionService, GLOBAL_PERMISSION_CONFIG } from '@/config/globalPermissions';

// 系统相关
import { globalSystemService, GLOBAL_SYSTEM_CONFIG } from '@/config/globalSystemSettings';

// 集合相关
import { GLOBAL_COLLECTIONS } from '@/config/globalCollections';
```

## 🔧 命令行工具

### 检查整个代码库

```bash
# 在项目根目录运行
npx ts-node src/scripts/globalSettingsComplianceChecker.ts
```

### 检查特定文件

```typescript
import { checkSpecificFile } from '@/scripts/globalSettingsComplianceChecker';

await checkSpecificFile('src/components/MyComponent.tsx');
```

### 自动修正文件

```typescript
import { autoCorrectFile } from '@/scripts/globalSettingsComplianceChecker';

await autoCorrectFile('src/components/MyComponent.tsx');
```

## 📊 报告示例

```
# 全局设置合规性报告

## 总体统计
- 检查文件总数: 45
- 合规文件数: 38
- 合规率: 84.4%
- 平均分数: 87.2/100

## 详细结果

### src/components/MyComponent.tsx
- 合规性: ❌ 不合规
- 分数: 75/100
- 违规数量: 2
- 建议数量: 1

#### 违规详情:
- 第15行: 发现硬编码email_regex，应使用全局设置 (error)
- 第23行: 发现硬编码date_format，应使用全局设置 (error)

#### 改进建议:
- 建议使用全局邮箱验证服务 (优先级: high)
```

## 🎯 最佳实践

### 1. 开发时遵循

- 始终使用全局设置服务而不是硬编码值
- 在创建新组件时立即导入所需的全局设置
- 定期运行合规性检查

### 2. 代码审查

- 在PR中检查是否遵循全局设置标准
- 使用合规性检查工具验证代码质量
- 确保新代码的合规性分数达到90分以上

### 3. 持续集成

```yaml
# .github/workflows/compliance-check.yml
name: Global Settings Compliance Check
on: [push, pull_request]
jobs:
  compliance-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Compliance Check
        run: npx ts-node src/scripts/globalSettingsComplianceChecker.ts
```

## 🔍 常见问题

### Q: 如何添加新的检查规则？

A: 在 `globalSettingsCommander.ts` 的 `FORBIDDEN_PATTERNS` 中添加新的模式：

```typescript
{ pattern: /your_pattern/g, type: 'your_type', module: 'your_module' }
```

### Q: 如何自定义检查范围？

A: 修改 `globalSettingsComplianceChecker.ts` 中的 `CHECK_CONFIG`：

```typescript
const CHECK_CONFIG = {
  EXTENSIONS: ['.ts', '.tsx'],
  EXCLUDE_DIRS: ['node_modules', 'dist'],
  INCLUDE_DIRS: ['src/components', 'src/pages']
};
```

### Q: 如何集成到IDE？

A: 可以创建VS Code任务或使用ESLint插件来集成合规性检查。

## 📈 未来扩展

1. **IDE集成**: 开发VS Code扩展
2. **实时检查**: 保存时自动检查
3. **更多规则**: 支持自定义检查规则
4. **性能优化**: 增量检查支持
5. **报告导出**: 支持多种格式的报告导出

## 🤝 贡献指南

1. 遵循现有的代码风格
2. 添加适当的测试用例
3. 更新相关文档
4. 确保新功能不影响现有功能

---

**注意**: 这个系统是JCI KL会员管理系统的核心组件，确保所有代码都遵循统一的全局设置标准，提高代码质量和维护性。
