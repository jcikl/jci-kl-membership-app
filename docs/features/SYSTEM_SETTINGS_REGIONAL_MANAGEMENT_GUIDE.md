# 系统设置 - 区域管理功能指南

## 概述

本指南介绍了JCI KL会员管理系统中新增的区域管理功能，包括总部设置、世界区域管理、国家设置和国家区域管理。

## 功能特性

### 1. 总部设置 (Headquarters Settings)

**功能描述：**
- 管理JCI总部的基本信息
- **集成世界区域和国家管理功能**
- 包括总部名称、描述、联系方式、地址、网站和Logo

**主要功能：**
- **总部基本信息设置：** 总部名称、简介、联系方式、地址、网站、Logo
- **世界区域管理：** 创建、编辑、删除世界区域，设置覆盖国家
- **国家管理：** 创建、编辑、删除国家，设置所属世界区域

**访问路径：**
系统设置 → 总部设置

**子标签：**
- 总部设置：基本信息配置
- 世界区域管理：AMEC、ASPAC、Europe、America等区域管理
- 国家管理：Malaysia、Singapore、China等国家管理

### 2. 世界区域管理 (World Region Management) - 已整合到总部设置

**功能描述：**
- 管理JCI世界区域，包括AMEC、ASPAC、Europe、America等
- 支持创建、编辑、删除世界区域
- 可设置区域覆盖的国家

**默认区域：**
1. JCI Africa and the Middle East (JCI AMEC)
2. JCI America
3. JCI Asia and the Pacific (JCI ASPAC)
4. JCI Europe

**主要字段：**
- 区域名称 (必填)
- 区域代码 (必填)
- 区域描述
- 覆盖国家列表

**访问路径：**
系统设置 → 总部设置 → 世界区域管理

### 3. 国家管理 (Country Management) - 已整合到总部设置

**功能描述：**
- 管理JCI成员国
- 支持创建、编辑、删除国家
- 可设置国家所属的世界区域

**默认国家：**
1. Malaysia (MY)
2. Singapore (SG)
3. China (CN)

**主要字段：**
- 国家名称 (必填)
- 国家代码 (必填)
- 所属世界区域
- 国家区域列表

**访问路径：**
系统设置 → 总部设置 → 国家管理

### 4. 国家设置 (Country Settings) - 独立标签

**功能描述：**
- **集成国家基本信息设置和国家区域管理功能**
- 配置JCI国家基本信息和管理国家区域
- 支持设置国家基本信息和创建、编辑、删除国家区域

**主要功能：**
- **国家基本信息设置：** 配置国家名字、代码、简介、联系方式、地址、网站、Logo
- **国家区域管理：** 创建、编辑、删除国家区域，设置所属国家

**默认马来西亚区域：**
1. JCI Malaysia Area Central
2. JCI Malaysia Area South
3. JCI Malaysia Area North
4. JCI Malaysia Area Sabah
5. JCI Malaysia Area Sarawak

**访问路径：**
系统设置 → 国家设置

**子标签：**
- 国家基本信息设置：配置国家基本信息
- 国家区域管理：各国JCI区域管理

### 5. 分会设置增强 (Enhanced Chapter Settings) - 独立标签

**功能描述：**
- 在原有分会设置基础上新增区域关联字段
- 分会可关联到世界区域、国家和国家区域
- **支持级联筛选功能**

**新增字段：**
- 世界区域 (下拉选择)
- 所属国家 (下拉选择，根据世界区域筛选)
- 国家区域 (下拉选择，根据国家筛选)

**级联筛选逻辑：**
1. **选择世界区域** → 自动筛选出该区域下的国家
2. **选择国家** → 自动筛选出该国家下的国家区域
3. **清空上级选择** → 自动清空下级选择

**访问路径：**
系统设置 → 分会设置

## 数据初始化

### 自动初始化

系统提供了自动初始化功能，可以一键创建所有默认数据：

1. **世界区域初始化：** 创建4个默认世界区域
2. **国家初始化：** 创建3个默认国家
3. **马来西亚区域初始化：** 创建5个默认马来西亚国家区域
4. **关联关系建立：** 自动建立区域间的关联关系

### 手动初始化

如果需要手动初始化数据，可以使用以下脚本：

```typescript
import { initializeRegionalData } from '@/scripts/initRegionalData';

// 初始化所有区域数据
await initializeRegionalData();
```

## 技术实现

### 数据库结构

#### 集合设计

```typescript
// 总部设置集合
HEADQUARTERS_SETTINGS: 'headquartersSettings'

// 世界区域集合
WORLD_REGIONS: 'worldRegions'

// 国家集合
COUNTRIES: 'countries'

// 国家区域集合
NATIONAL_REGIONS: 'nationalRegions'
```

#### 数据模型

```typescript
// 总部设置
interface HeadquartersSettings {
  id: string;
  name: string;
  description?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// 世界区域
interface WorldRegion {
  id: string;
  name: string;
  code: string;
  description?: string;
  countries: string[]; // 覆盖的国家ID列表
  createdAt: string;
  updatedAt: string;
}

// 国家
interface Country {
  id: string;
  name: string;
  code: string;
  worldRegionId?: string; // 所属世界区域ID
  nationalRegions: string[]; // 覆盖的国家区域ID列表
  createdAt: string;
  updatedAt: string;
}

// 国家区域
interface NationalRegion {
  id: string;
  name: string;
  code: string;
  countryId: string; // 所属国家ID
  description?: string;
  chapters: string[]; // 覆盖的分会ID列表
  createdAt: string;
  updatedAt: string;
}
```

### 服务层

#### 总部设置服务
- `getHeadquartersSettings()` - 获取总部设置
- `saveHeadquartersSettings()` - 保存总部设置
- `getDefaultHeadquartersSettings()` - 获取默认总部设置

#### 世界区域服务
- `getWorldRegions()` - 获取所有世界区域
- `getWorldRegion()` - 获取单个世界区域
- `createWorldRegion()` - 创建世界区域
- `updateWorldRegion()` - 更新世界区域
- `deleteWorldRegion()` - 删除世界区域
- `initializeDefaultWorldRegions()` - 初始化默认世界区域

#### 国家服务
- `getCountries()` - 获取所有国家
- `getCountriesByWorldRegion()` - 根据世界区域获取国家
- `getCountry()` - 获取单个国家
- `createCountry()` - 创建国家
- `updateCountry()` - 更新国家
- `deleteCountry()` - 删除国家
- `initializeDefaultCountries()` - 初始化默认国家

#### 国家区域服务
- `getNationalRegions()` - 获取所有国家区域
- `getNationalRegionsByCountry()` - 根据国家获取国家区域
- `getNationalRegion()` - 获取单个国家区域
- `createNationalRegion()` - 创建国家区域
- `updateNationalRegion()` - 更新国家区域
- `deleteNationalRegion()` - 删除国家区域
- `initializeDefaultMalaysianRegions()` - 初始化默认马来西亚区域

### 组件层

#### 主要组件
- `HeadquartersSettings` - 总部设置组件（集成世界区域管理和国家管理）
- `CountrySettings` - 国家设置组件（集成国家基本信息设置和国家区域管理）
- `ChapterSettings` - 增强的分会设置组件

#### 组件特性
- 响应式设计
- 实时数据验证
- 友好的用户界面
- 批量操作支持
- 搜索和筛选功能

## 使用指南

### 1. 首次设置

1. **访问系统设置页面**
2. **初始化默认数据：**
   - 进入"总部设置"标签
   - 在"世界区域管理"子标签中点击"初始化默认区域"按钮创建世界区域
   - 在"国家管理"子标签中点击"初始化默认国家"按钮创建国家
   - 进入"国家设置"标签
   - 在"国家区域管理"子标签中点击"初始化马来西亚区域"按钮创建马来西亚国家区域

### 2. 日常管理

1. **总部设置：**
   - 填写总部基本信息
   - 上传总部Logo
   - 保存设置

2. **世界区域管理：**
   - 在总部设置的世界区域管理子标签中查看现有区域
   - 新增、编辑、删除区域
   - 设置区域覆盖的国家

3. **国家管理：**
   - 在总部设置的国家管理子标签中查看现有国家
   - 新增、编辑、删除国家
   - 设置国家所属的世界区域

4. **国家设置：**
   - 在国家设置标签中配置国家基本信息和管理国家区域
   - 在"国家基本信息设置"子标签中配置国家基本信息
   - 在"国家区域管理"子标签中管理国家区域

5. **分会设置：**
   - 在分会设置中选择世界区域
   - 系统自动筛选出该区域下的国家供选择
   - 选择国家后，系统自动筛选出该国家下的国家区域供选择
   - 支持级联筛选，选择上级选项后下级选项自动更新

### 3. 数据维护

- **定期检查数据一致性**
- **及时更新区域信息**
- **维护区域间的关联关系**

## 注意事项

### 数据完整性
- 删除区域前请确保没有关联的分会
- 修改区域代码可能影响现有数据
- 建议在非业务高峰期进行数据维护

### 权限控制
- 区域管理功能需要相应的系统管理权限
- 建议设置数据备份策略
- 重要操作建议多人确认

### 性能考虑
- 大量数据时建议使用分页加载
- 定期清理无效的关联关系
- 监控数据库查询性能

## 故障排除

### 常见问题

1. **初始化失败**
   - 检查Firebase连接
   - 确认用户权限
   - 查看控制台错误信息

2. **数据不显示**
   - 刷新页面
   - 检查网络连接
   - 清除浏览器缓存

3. **保存失败**
   - 检查必填字段
   - 确认数据格式
   - 查看错误提示

### 技术支持

如遇到技术问题，请：
1. 查看浏览器控制台错误信息
2. 检查Firebase控制台日志
3. 联系技术支持团队

## 更新日志

### v1.0.0 (2024-01-10)
- 新增总部设置功能
- 新增世界区域管理功能
- 新增国家设置功能
- 新增国家区域管理功能
- 增强分会设置功能
- 提供数据初始化脚本

## 未来规划

### 计划功能
- 区域层级关系可视化
- 批量导入/导出功能
- 区域统计报表
- 多语言支持
- 移动端适配

### 性能优化
- 数据缓存机制
- 懒加载优化
- 搜索性能提升
- 批量操作优化
