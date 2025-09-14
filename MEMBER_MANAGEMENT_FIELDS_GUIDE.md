# 会员管理字段说明

## 📋 字段概览

会员管理系统包含丰富的字段信息，分为基本信息、职业信息、JCI相关、权限管理等多个类别。

## 👤 基本信息字段

### 1. 个人身份信息
- **姓名** (`name`) - 必填，会员显示名称
- **身份证全名** (`fullNameNric`) - 身份证上的完整姓名
- **性别** (`gender`) - Male/Female
- **种族** (`race`) - Chinese/Malay/Indian/Other
- **国籍** (`nationality`) - 国籍信息
- **出生日期** (`birthDate`) - dd-mmm-yyyy格式
- **身份证/护照号** (`nricOrPassport`) - 身份证明文件号码
- **地址** (`address`) - 家庭地址

### 2. 联系方式
- **邮箱** (`email`) - 必填，登录邮箱
- **电话** (`phone`) - 必填，联系电话
- **WhatsApp群组** (`whatsappGroup`) - 是否加入WhatsApp群组

### 3. 个人兴趣与目标
- **兴趣爱好** (`hobbies`) - 多选，包括运动、娱乐等
- **五年愿景** (`fiveYearsVision`) - 个人发展目标
- **活跃会员方式** (`activeMemberHow`) - 如何成为活跃会员

### 4. 文件资料
- **头像** (`profilePhotoUrl`) - 个人照片URL
- **付款单** (`paymentSlipUrl`) - 付款凭证URL

## 🏢 职业信息字段

### 1. 公司信息
- **公司名称** (`company`) - 公司/企业/雇主名称
- **部门职位** (`departmentAndPosition`) - 部门及职位
- **行业详情** (`industryDetail`) - 具体行业信息
- **业务类别** (`categories`) - 多选：分销商/制造商/零售商/服务提供商
- **自身行业** (`ownIndustry`) - 多选行业分类
- **公司介绍** (`companyIntro`) - 公司运营和角色简介
- **接受国际业务** (`acceptInternationalBusiness`) - Yes/No/Willing to explore
- **感兴趣行业** (`interestedIndustries`) - 多选行业分类

### 2. 社交网络
- **LinkedIn** (`linkedin`) - LinkedIn个人资料
- **公司网站** (`companyWebsite`) - 公司官网

## 🎯 JCI相关字段

### 1. 入会信息
- **户口类型** (`accountType`) - 用户户口类别（管理员专用）
- **会员状态** (`status`) - active/inactive/suspended/pending（管理员专用）
- **会员等级** (`level`) - bronze/silver/gold/platinum/diamond（管理员专用）
- **参议员编号** (`senatorId`) - 参议员ID
- **参议员验证** (`senatorVerified`) - 参议员验证状态（管理员专用）
- **会员编号** (`memberId`) - 系统生成的会员编号（管理员专用）
- **介绍人** (`introducerName`) - 介绍人姓名
- **JCI活动兴趣** (`jciEventInterests`) - 感兴趣的JCI活动类型
- **JCI期望收益** (`jciBenefitsExpectation`) - 期望通过JCI获得的资源/活动/收益
- **入会日期** (`joinDate`) - 加入JCI的日期

### 2. 付款信息
- **付款日期** (`paymentDate`) - dd-mmm-yyyy格式
- **背书日期** (`endorsementDate`) - dd-mmm-yyyy格式
- **付款验证日期** (`paymentVerifiedDate`) - 付款验证日期（管理员专用）

### 3. 服装信息
- **刺绣姓名** (`nameToBeEmbroidered`) - 服装上刺绣的姓名
- **T恤尺寸** (`shirtSize`) - XS/S/M/L/XL/2XL/3XL
- **夹克尺寸** (`jacketSize`) - XS/S/M/L/XL/2XL/3XL
- **剪裁** (`cutting`) - Unisex/Lady
- **T恤接收状态** (`tshirtReceivingStatus`) - Pending/Requested/Processing/Delivered（管理员专用）

## 🏛️ JCI职位字段

### 1. 职位信息
- **JCI职位** (`jciPosition`) - 会长/署理会长/秘书长/财务长/辅导会长/副会长/部门主任/正式会员/准会员/荣誉会员（管理员专用）
- **副会长部门** (`vpDivision`) - personal_dev/business_dev/international_dev/chapter_admin/community_dev（管理员专用）
- **职位开始日期** (`positionStartDate`) - 职位开始日期（管理员专用）
- **职位结束日期** (`positionEndDate`) - 职位结束日期（管理员专用）
- **是否代理职位** (`isActingPosition`) - 是否为代理职位（管理员专用）
- **代理职位** (`actingForPosition`) - 代理的具体职位（管理员专用）

## 📅 任期管理字段

### 1. 任期信息
- **任期开始日期** (`termStartDate`) - 任期开始日期
- **任期结束日期** (`termEndDate`) - 任期结束日期
- **是否当前任期** (`isCurrentTerm`) - 是否为当前任期

## 🔐 权限管理字段

### 1. 权限信息
- **特殊权限** (`hasSpecialPermissions`) - 是否有特殊权限
- **特殊权限列表** (`specialPermissions`) - 特殊权限数组
- **权限备注** (`permissionNotes`) - 权限相关备注
- **有效权限** (`effectivePermissions`) - 当前有效权限列表

### 2. 角色绑定
- **角色绑定** (`roleBindings`) - 角色绑定信息数组
  - `roleId`: 角色ID
  - `scopes`: 权限范围
  - `expiresAt`: 过期时间
  - `delegationRef`: 委托引用

## 📋 任务完成情况字段

### 1. 任务管理
- **必需任务完成** (`requiredTasksCompleted`) - 是否完成必需任务
- **任务完成情况** (`taskCompletions`) - 任务完成详情数组
  - `taskId`: 任务ID
  - `title`: 任务标题
  - `type`: 任务类型（活动参与/委员会角色/理事会会议/课程完成/其他）
  - `completed`: 是否完成
  - `completedAt`: 完成时间
  - `metadata`: 任务元数据

## 🏷️ 会员分类管理字段

### 1. 分类审核
- **提议会员分类** (`proposedMembershipCategory`) - 系统或用户提交的待审核类别
- **分类审核状态** (`categoryReviewStatus`) - pending/approved/rejected
- **分类审核备注** (`categoryReviewNotes`) - 审核备注
- **分类审核员** (`categoryReviewerId`) - 审核员ID
- **分类审核时间** (`categoryReviewedAt`) - 审核时间

## 🔧 系统字段

### 1. 基础信息
- **ID** (`id`) - 会员唯一标识符
- **创建时间** (`createdAt`) - 记录创建时间
- **更新时间** (`updatedAt`) - 记录最后更新时间

### 2. 兼容性字段
- **职业** (`occupation`) - 职业信息（兼容字段）
- **紧急联系人** (`emergencyContact`) - 紧急联系人信息
  - `name`: 联系人姓名
  - `phone`: 联系电话
  - `relationship`: 关系

## 📊 字段权限分类

### 1. 管理员专用字段
- `status` - 会员状态
- `level` - 会员等级
- `memberId` - 会员编号
- `accountType` - 户口类型
- `whatsappGroup` - WhatsApp群组
- `tshirtReceivingStatus` - T恤接收状态
- `jciPosition` - JCI职位
- `vpDivision` - 副会长部门
- `positionStartDate` - 职位开始日期
- `positionEndDate` - 职位结束日期
- `isActingPosition` - 是否代理职位
- `actingForPosition` - 代理职位
- `senatorVerified` - 参议员验证
- `paymentVerifiedDate` - 付款验证日期

### 2. 会员可编辑字段
- 个人身份信息（除管理员专用字段）
- 联系方式
- 个人兴趣与目标
- 职业信息
- 社交网络
- 服装信息（除接收状态）
- 权限相关字段（部分）

### 3. 只读字段
- 系统生成字段（ID、创建时间、更新时间）
- 审核相关字段（审核状态、审核员等）

## 🎯 字段使用场景

### 1. 会员注册
- **必填字段**: 姓名、邮箱、电话、入会日期
- **可选字段**: 其他个人信息、职业信息、兴趣爱好

### 2. 会员管理
- **管理员操作**: 状态管理、职位分配、权限设置
- **会员操作**: 个人信息更新、兴趣偏好设置

### 3. 分类管理
- **分类审核**: 提议分类、审核状态、审核备注
- **任务管理**: 任务完成情况、必需任务跟踪

### 4. 权限控制
- **角色绑定**: 基于职位的权限分配
- **特殊权限**: 管理员授予的特殊权限
- **权限范围**: 细粒度的权限控制

## 🔄 数据关系

### 1. 与职位的关系
- 通过 `jciPosition` 关联JCI职位
- 通过 `vpDivision` 关联副会长部门
- 通过职位历史记录管理职位变更

### 2. 与分类的关系
- 通过 `proposedMembershipCategory` 提议分类
- 通过审核流程确定最终分类
- 与 `member_categories` 集合关联

### 3. 与权限的关系
- 通过 `roleBindings` 管理角色绑定
- 通过 `effectivePermissions` 计算有效权限
- 支持权限委托和过期机制

## 📋 字段验证规则

### 1. 必填验证
- 姓名、邮箱、电话、入会日期

### 2. 格式验证
- 日期格式：dd-mmm-yyyy
- 邮箱格式：标准邮箱格式
- 电话格式：有效电话号码

### 3. 业务验证
- 会员编号唯一性
- 职位任期合理性
- 权限范围有效性

## 🎨 UI显示特性

### 1. 字段分组
- 按功能模块分组显示
- 使用标签页组织字段
- 支持字段权限控制

### 2. 输入控件
- 文本输入：姓名、地址等
- 下拉选择：性别、种族、职位等
- 多选：兴趣爱好、行业分类等
- 日期选择：出生日期、入会日期等
- 文件上传：头像、付款单等

### 3. 权限控制
- 根据用户角色显示/隐藏字段
- 管理员专用字段特殊标识
- 只读字段禁用编辑

---

**文档版本**: 1.0.0
**更新时间**: 2025年1月
**维护者**: JCI KL 财务管理系统团队
