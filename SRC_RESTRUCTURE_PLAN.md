# 🏗️ src目录分阶段重构计划

## 📊 当前结构分析

### 文件分布统计
- **components/**: 126个文件（包含子目录）
- **services/**: 43个文件
- **pages/**: 24个文件
- **types/**: 9个文件
- **hooks/**: 6个文件
- **其他目录**: 约50个文件

### 功能模块识别

#### 💰 财务模块 (Finance)
**组件文件**:
- AccountBalanceDisplay.tsx
- BalanceCacheManager.tsx
- BalanceCalculationTool.tsx
- BalanceDebugTool.tsx
- BalanceDisplayCard.tsx
- BalanceInconsistencyDebugger.tsx
- BalanceSyncManager.tsx
- BankAccountManagement.tsx
- BillPaymentSystem.tsx
- BudgetModal.tsx
- ExpenseSplittingModal.tsx
- FinanceDateFilter.tsx
- FinanceExcelUpload.tsx
- FinancialImportModal.tsx
- FinancialReportGenerator.tsx
- FinancialReports.tsx
- GlobalYearFilterModal.tsx
- IntegratedBudgetManagement.tsx
- JCIBudgetTable.tsx
- TransactionBatchSettingsModal.tsx
- TransactionManagement.tsx
- TransactionPurposeManagement.tsx
- TransactionSplitModal.tsx
- UnifiedProjectFinanceManagement.tsx
- YearFilter.tsx

**服务文件**:
- budgetActualService.ts
- budgetTemplateService.ts
- financeService.ts
- financialReportGenerator.ts
- financialReportService.ts
- projectAccountService.ts
- projectFinanceService.ts
- simpleFinancialReportGenerator.ts
- transactionPurposeInitService.ts

**页面文件**:
- FinancePage.tsx
- TransactionPurposeInitPage.tsx

#### 👥 会员模块 (Member)
**组件文件**:
- AssociateMembershipManager.tsx
- MembershipFeeManagement.tsx
- MembershipFeeViewer.tsx
- MembershipTasksManager.tsx
- OfficialMembershipManager.tsx
- ProfileEditForm.tsx
- VisitingMembershipManager.tsx

**服务文件**:
- memberService.ts
- membershipTaskPolicyService.ts

**页面文件**:
- MemberDetailPage.tsx
- MemberListPage.tsx
- ProfilePage.tsx

#### 📅 活动模块 (Event)
**组件文件**:
- ActivityGanttChart.tsx
- ActivityParticipationManager.tsx
- ActivityParticipationTracker.tsx
- EventDetail.tsx
- EventForm/ (8个文件)
- EventForm.tsx
- EventList.tsx
- EventRegistrationForm.tsx
- EventRegistrationManagement.tsx
- EventSettings.tsx
- EventStatistics.tsx

**服务文件**:
- eventService.ts
- EventFormValidator.ts

**页面文件**:
- EventCreatePage.tsx
- EventDetailPage.tsx
- EventManagementPage.tsx
- EventRegistrationPage.tsx
- EventRegistrationSuccessPage.tsx
- PublicEventListPage.tsx

#### 🏆 奖项模块 (Award)
**组件文件**:
- AwardsDashboard.tsx
- AwardsManagementWrapper.tsx
- CompetitorScoreTracker.tsx
- EAwardsComponent.tsx
- EfficientStarAward.tsx
- NationalAreaIncentiveAward.tsx
- NewAwardIndicatorManagement.tsx
- SenatorManagement.tsx
- SenatorScoreManager.tsx
- StarPointAward.tsx
- StarPointCategories.tsx

**服务文件**:
- awardIndicatorService.ts
- awardService.ts
- indicatorService.ts

**页面文件**:
- AwardsManagementPage.tsx

#### 🔐 权限模块 (Permission)
**组件文件**:
- FieldGroupSection.tsx
- FieldPermissionController.tsx
- FieldPermissionStatus.tsx
- FieldSelector.tsx
- PermissionControlDemo.tsx
- rbac/ (11个文件)

**服务文件**:
- permissionService.ts
- permissionSyncService.ts
- rbacService.ts
- surveyPermissionService.ts

#### 📊 调查模块 (Survey)
**组件文件**:
- survey/ (8个文件)

**服务文件**:
- surveyService.ts
- surveyTemplateService.ts

**页面文件**:
- SurveyCreatePage.tsx
- SurveyDetailPage.tsx
- SurveyEditPage.tsx
- SurveyListPage.tsx
- SurveyResponsePage.tsx

#### 🖼️ 图片管理模块 (Image)
**组件文件**:
- ChapterLogoUpload.tsx
- ChapterLogoUploadExample.tsx
- CloudinaryUpload.tsx
- GlobalImageUploadModal.tsx
- ImageManagement/ (3个文件)
- ImageUpload.tsx
- ImageUploadFree.tsx
- SimpleUploadTest.tsx
- UploadServiceStatus.tsx
- UploadServiceTest.tsx
- UploadTest.tsx

**服务文件**:
- folderManagementService.ts
- imageManagementService.ts
- uploadServiceConfig.ts

**页面文件**:
- FolderManagementPage.tsx
- ImageManagementPage.tsx

#### ⚙️ 系统设置模块 (System)
**组件文件**:
- ChapterSettings.tsx
- CountryManagement.tsx
- CountrySettings.tsx
- HeadquartersSettings.tsx
- WorldRegionManagement.tsx

**服务文件**:
- chapterSettingsService.ts
- countryService.ts
- headquartersSettingsService.ts
- localChapterService.ts
- nationalRegionService.ts
- worldRegionService.ts

**页面文件**:
- SystemSettingsPage.tsx

#### 🔧 共享模块 (Shared)
**组件文件**:
- AppHeader.tsx
- AppSider.tsx
- LoadingSpinner.tsx
- common/ (7个文件)

**服务文件**:
- authService.ts
- firebase.ts
- dataValidationService.ts
- fieldMappingService.ts
- pdfParseService.ts
- taskService.ts
- testReportGeneration.ts

**页面文件**:
- DashboardPage.tsx
- LoginPage.tsx
- RegisterPage.tsx
- PDFInterpretationPage.tsx

## 🚀 分阶段重构计划

### 第一阶段：分析现有结构 ✅
- [x] 分析当前文件分布
- [x] 识别功能模块
- [x] 制定重构计划

### 第二阶段：试点模块重构（财务模块）
**目标**: 验证重构方案的可行性
**文件数量**: 约35个文件
**预计时间**: 2-3天

**步骤**:
1. 创建 `src/modules/finance/` 目录结构
2. 移动财务相关组件
3. 移动财务相关服务
4. 移动财务相关页面
5. 更新导入路径
6. 测试功能完整性

### 第三阶段：会员模块重构
**目标**: 重构会员管理相关文件
**文件数量**: 约12个文件
**预计时间**: 1-2天

### 第四阶段：活动模块重构
**目标**: 重构活动管理相关文件
**文件数量**: 约20个文件
**预计时间**: 2-3天

### 第五阶段：权限模块重构
**目标**: 重构权限管理相关文件
**文件数量**: 约15个文件
**预计时间**: 1-2天

### 第六阶段：奖项模块重构
**目标**: 重构奖项管理相关文件
**文件数量**: 约14个文件
**预计时间**: 1-2天

### 第七阶段：其他模块重构
**目标**: 重构调查、图片、系统设置模块
**文件数量**: 约30个文件
**预计时间**: 2-3天

### 第八阶段：共享模块整理
**目标**: 整理共享组件和服务
**文件数量**: 约20个文件
**预计时间**: 1-2天

### 第九阶段：清理和优化
**目标**: 清理冗余文件，优化结构
**预计时间**: 1天

### 第十阶段：全面验证和测试
**目标**: 确保所有功能正常
**预计时间**: 2-3天

## 📁 目标目录结构

```
src/
├── modules/
│   ├── finance/              # 财务模块
│   │   ├── components/       # 财务组件
│   │   ├── services/         # 财务服务
│   │   ├── pages/           # 财务页面
│   │   ├── types/           # 财务类型
│   │   ├── hooks/           # 财务钩子
│   │   └── __tests__/       # 财务测试
│   ├── member/              # 会员模块
│   ├── event/               # 活动模块
│   ├── permission/          # 权限模块
│   ├── award/               # 奖项模块
│   ├── survey/              # 调查模块
│   ├── image/               # 图片管理模块
│   └── system/              # 系统设置模块
├── shared/                  # 共享模块
│   ├── components/          # 通用组件
│   ├── services/            # 通用服务
│   ├── utils/               # 工具函数
│   ├── types/               # 通用类型
│   └── hooks/               # 通用钩子
├── pages/                   # 页面组件
├── store/                   # 全局状态
├── config/                  # 配置文件
└── styles/                  # 样式文件
```

## ⚠️ 风险控制

### 每个阶段的风险控制措施
1. **备份当前状态**: 每个阶段开始前创建git分支
2. **逐步迁移**: 一次迁移一个子模块
3. **及时测试**: 每迁移一个文件就测试功能
4. **回滚准备**: 准备快速回滚方案

### 测试策略
1. **单元测试**: 确保组件功能正常
2. **集成测试**: 确保模块间协作正常
3. **端到端测试**: 确保用户流程正常
4. **性能测试**: 确保重构不影响性能

## 📅 时间安排

**总预计时间**: 15-20天
**建议节奏**: 每天完成一个小模块，周末进行测试和优化

---

**准备开始第二阶段：财务模块试点重构！** 🚀
