# 全局配置系统使用指南

## 📋 概述

全局配置系统为JCI KL会员管理系统提供了统一的配置管理，包括集合ID、日期处理、权限控制、组件配置、系统设置和数据验证。

## 🚀 快速开始

### 1. 初始化全局配置

```typescript
import { initializeGlobalConfig } from '@/config';

// 在应用启动时初始化
await initializeGlobalConfig();
```

### 2. 使用全局配置

```typescript
import { GlobalConfig, GlobalServices } from '@/config';

// 访问配置
const memberCollectionId = GlobalConfig.Collections.MEMBERS;
const standardDateFormat = GlobalConfig.Date.STANDARD_FORMAT;
const superAdminEmail = GlobalConfig.Permissions.SUPER_ADMIN_EMAIL;

// 使用服务
const collectionId = GlobalServices.Collections.getCollectionId('MEMBERS');
const formattedDate = GlobalServices.Date.parseToStandard(new Date());
const hasPermission = await GlobalServices.Permissions.checkPermission(memberId, 'MEMBER_MANAGEMENT', 'CREATE');
```

## 🔑 集合ID管理

### 基本使用

```typescript
import { getCollectionId, GLOBAL_COLLECTIONS } from '@/config';

// 获取集合ID
const membersCollection = getCollectionId('MEMBERS'); // 'members'
const eventsCollection = getCollectionId('EVENTS'); // 'events'

// 批量获取
const memberRelatedCollections = ['MEMBERS', 'EVENT_REGISTRATIONS', 'TRANSACTIONS'];
const collectionIds = getCollectionIds(memberRelatedCollections);

// 验证集合ID
const isValid = isValidCollectionId('members'); // true
```

### 在服务中使用

```typescript
import { getCollectionId } from '@/config';
import { collection, doc } from 'firebase/firestore';

// 在Firebase操作中使用
const membersRef = collection(db, getCollectionId('MEMBERS'));
const memberDoc = doc(db, getCollectionId('MEMBERS'), memberId);
```

## 📅 日期处理

### 基本使用

```typescript
import { globalDateService, GLOBAL_DATE_CONFIG } from '@/config';

// 解析任意格式日期为标准格式
const standardDate = globalDateService.parseToStandard('2024-01-15'); // '15-Jan-2024'
const chineseDate = globalDateService.parseToStandard('2024年1月15日'); // '15-Jan-2024'

// 验证日期
const isValid = globalDateService.validateDate('15-Jan-2024');

// 获取财政年度
const currentFiscalYear = globalDateService.getCurrentFiscalYear(1); // 假设1月为财政年度开始

// 格式化日期
const formatted = globalDateService.formatDate(new Date(), GLOBAL_DATE_CONFIG.STANDARD_FORMAT);
```

### 在组件中使用

```typescript
import { globalDateService, dateValidators } from '@/config';

// 在表单中使用
const MyForm = () => {
  const validateDate = (value: string) => {
    return dateValidators.standardDate(value) ? undefined : '日期格式不正确';
  };

  return (
    <Form.Item name="date" rules={[{ validator: validateDate }]}>
      <DatePicker />
    </Form.Item>
  );
};
```

## 🔐 权限控制

### 基本权限检查

```typescript
import { globalPermissionService, PermissionModule, PermissionAction } from '@/config';

// 检查单个权限
const hasCreatePermission = await globalPermissionService.checkPermission(
  memberId, 
  'MEMBER_MANAGEMENT', 
  'CREATE'
);

// 批量权限检查
const permissions = [
  { module: 'MEMBER_MANAGEMENT' as PermissionModule, action: 'CREATE' as PermissionAction },
  { module: 'MEMBER_MANAGEMENT' as PermissionModule, action: 'UPDATE' as PermissionAction }
];
const results = await globalPermissionService.checkPermissions(memberId, permissions);

// 检查管理权限
const canManageMembers = await globalPermissionService.checkManagePermission(
  memberId, 
  'MEMBER_MANAGEMENT'
);
```

### 在组件中使用权限控制

```typescript
import { usePermission, withPermissionControl } from '@/config';

// 使用Hook
const MyComponent = ({ memberId }: { memberId: string }) => {
  const { hasPermission, loading } = usePermission(memberId, 'MEMBER_MANAGEMENT', 'CREATE');

  if (loading) return <div>检查权限中...</div>;
  if (!hasPermission) return <div>权限不足</div>;

  return <button>创建会员</button>;
};

// 使用HOC
const ProtectedButton = withPermissionControl(Button, 'MEMBER_MANAGEMENT', 'CREATE');

const MyPage = ({ memberId }: { memberId: string }) => (
  <ProtectedButton memberId={memberId}>创建会员</ProtectedButton>
);
```

### 使用权限验证器

```typescript
import { permissionValidators } from '@/config';

// 在服务中使用
const MyService = {
  async createMember(memberId: string, memberData: any) {
    const canCreate = await permissionValidators.memberManagement.create(memberId);
    if (!canCreate.hasPermission) {
      throw new Error('权限不足');
    }
    
    // 执行创建逻辑
  }
};
```

## 🎨 组件配置

### 基本使用

```typescript
import { globalComponentService, GLOBAL_COMPONENT_CONFIG } from '@/config';

// 获取组件配置
const tableConfig = globalComponentService.getTableConfig({
  dataSource: members,
  columns: memberColumns
});

const formConfig = globalComponentService.getFormConfig({
  layout: 'horizontal'
});

// 应用全局样式
globalComponentService.applyGlobalStyles();
```

### 使用权限控制组件

```typescript
import { globalComponentService } from '@/config';

const MyPage = ({ memberId }: { memberId: string }) => {
  const ProtectedButton = globalComponentService.getProtectedButton(
    memberId,
    'MEMBER_MANAGEMENT',
    'CREATE',
    { type: 'primary' },
    <div>权限不足</div>
  );

  return (
    <ProtectedButton memberId={memberId} module="MEMBER_MANAGEMENT" action="CREATE">
      创建会员
    </ProtectedButton>
  );
};
```

## ⚙️ 系统配置

### 基本使用

```typescript
import { globalSystemService, GLOBAL_SYSTEM_CONFIG } from '@/config';

// 获取环境信息
const isDev = globalSystemService.isDevelopment();
const isProd = globalSystemService.isProduction();

// 验证文件上传
const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
const validation = globalSystemService.validateFileUpload(file);

// 记录错误
try {
  // 一些操作
} catch (error) {
  globalSystemService.logError(error as Error, { context: 'user_action' });
}

// 验证密码
const passwordValidation = globalSystemService.validatePassword('MyPassword123');
```

### 在应用中使用

```typescript
import { globalSystemService } from '@/config';

// 在应用启动时
const App = () => {
  useEffect(() => {
    globalSystemService.initialize();
  }, []);

  return <div>My App</div>;
};
```

## ✅ 数据验证

### 基本使用

```typescript
import { globalValidationService, GLOBAL_VALIDATION_CONFIG } from '@/config';

// 验证各种数据类型
const isValidEmail = globalValidationService.validateEmail('user@example.com');
const isValidPhone = globalValidationService.validatePhone('+60123456789');
const isValidNRIC = globalValidationService.validateNRIC('123456-12-1234');

// 验证字段长度
const nameValidation = globalValidationService.validateFieldLength('John Doe', 'name');

// 验证数值范围
const ageValidation = globalValidationService.validateNumberRange(25, 'age');

// 验证文件
const fileValidation = globalValidationService.validateFile(file);
```

### 使用Yup验证模式

```typescript
import { yupSchemas } from '@/config';

// 在表单中使用
const MyForm = () => {
  return (
    <Form
      initialValues={initialValues}
      validationSchema={yup.object().shape({
        name: yupSchemas.name,
        email: yupSchemas.email,
        phone: yupSchemas.phone,
        memberId: yupSchemas.memberId
      })}
    >
      {/* 表单项 */}
    </Form>
  );
};
```

### 使用表单验证器

```typescript
import { formValidators } from '@/config';

// 创建自定义验证器
const emailValidator = formValidators.createPatternValidator(
  GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.email,
  '邮箱格式不正确'
);

const ageValidator = formValidators.createRangeValidator(16, 100, '年龄');

// 异步验证器
const memberIdValidator = formValidators.createAsyncValidator(
  async (memberId: string) => {
    // 检查会员编号是否已存在
    const exists = await checkMemberIdExists(memberId);
    return !exists;
  },
  '会员编号已存在'
);
```

## 🔄 最佳实践

### 1. 统一导入

```typescript
// 推荐：统一从config/index导入
import { GlobalConfig, GlobalServices } from '@/config';

// 避免：分散导入
import { GLOBAL_COLLECTIONS } from '@/config/globalCollections';
import { globalDateService } from '@/config/globalDateSettings';
```

### 2. 错误处理

```typescript
// 推荐：使用全局错误处理
try {
  const result = await globalPermissionService.checkPermission(memberId, module, action);
  if (!result.hasPermission) {
    message.error(result.reason);
    return;
  }
} catch (error) {
  globalSystemService.logError(error as Error);
  message.error('权限检查失败');
}
```

### 3. 性能优化

```typescript
// 推荐：缓存权限检查结果
const [permissions, setPermissions] = useState<Record<string, boolean>>({});

useEffect(() => {
  const checkPermissions = async () => {
    const results = await globalPermissionService.checkPermissions(memberId, [
      { module: 'MEMBER_MANAGEMENT', action: 'CREATE' },
      { module: 'MEMBER_MANAGEMENT', action: 'UPDATE' }
    ]);
    setPermissions(results);
  };
  
  checkPermissions();
}, [memberId]);
```

### 4. 类型安全

```typescript
// 推荐：使用类型定义
import { PermissionModule, PermissionAction } from '@/config';

const checkPermission = async (module: PermissionModule, action: PermissionAction) => {
  // TypeScript会检查类型安全
};
```

## 🚨 注意事项

1. **初始化顺序**：确保在使用任何全局配置之前调用 `initializeGlobalConfig()`
2. **权限检查**：所有权限检查都是异步的，需要使用 `await` 或 `.then()`
3. **错误处理**：始终处理权限检查和数据验证可能出现的错误
4. **类型安全**：使用TypeScript类型定义确保类型安全
5. **性能考虑**：避免在渲染循环中进行权限检查，考虑使用缓存

## 📚 更多示例

查看以下文件获取更多使用示例：
- `src/components/` - 组件中的使用示例
- `src/services/` - 服务中的使用示例
- `src/pages/` - 页面中的使用示例
