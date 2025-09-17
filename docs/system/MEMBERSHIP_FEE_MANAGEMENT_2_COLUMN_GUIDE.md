# 会费管理功能使用指南

## 📋 功能概述

会费管理功能专门用于管理会员费的支付记录和会员匹配。显示会费交易记录，支持手动匹配会员并将匹配信息存储到交易记录的`payerPayee`字段中。

## 🎯 核心功能

### 1. 会费交易记录管理
- **交易记录展示**：显示以支付年份筛选的会费交易记录
- **年份筛选**：支持按年份筛选会费交易记录

### 2. 会员匹配功能
- **手动匹配**：支持为每笔会费交易手动匹配1位或多位会员
- **数据存储**：将会员匹配信息存储到交易记录的`payerPayee`字段

## 🏗️ 技术实现

### 数据结构设计

```typescript
// 会员费匹配数据类型
export interface MembershipFeeData {
  matchedMemberIds: string[];
  matchedAt: string;
  matchedBy: string;
  membershipType: 'renewal' | 'new' | 'mixed';
  renewalMemberIds?: string[];
  newMemberIds?: string[];
}

// 交易记录扩展
export interface Transaction {
  // ... 原有字段
  payerPayee?: string; // 存储会员匹配信息
  membershipFeeData?: MembershipFeeData; // 详细匹配数据
}
```

### 核心逻辑实现

```typescript
// 获取待续费会员名单（基于交易记录的具体用途字段为会员费并根据会费年段筛选）
const pendingRenewalMembers = useMemo(() => {
  if (!selectedPaymentYear) return [];
  
  const previousYear = parseInt(selectedPaymentYear) - 1;
  
  // 获取上一年会员费交易记录
  const previousYearMembershipTransactions = transactions.filter(transaction => {
    if (!transaction.transactionPurpose) return false;
    
    const purpose = purposes.find(p => p.id === transaction.transactionPurpose);
    if (!purpose) return false;
    
    // 检查是否为会员费相关用途且包含上一年份
    const isMembershipFee = purpose.name.includes('会员费') || 
                            purpose.name.includes('新会员') || 
                            purpose.name.includes('续费') ||
                            purpose.name.includes('准会员') ||
                            purpose.name.includes('访问会员');
    
    const isPreviousYear = purpose.name.includes(previousYear.toString());
    
    return isMembershipFee && isPreviousYear;
  });
  
  // 从交易记录中提取已付费的会员信息
  const paidMembersFromTransactions = new Set<string>();
  
  previousYearMembershipTransactions.forEach(transaction => {
    if (transaction.payerPayee) {
      // 解析payerPayee字段中的会员信息
      const memberMatches = transaction.payerPayee.match(/\(([^)]+)\)/g);
      if (memberMatches) {
        memberMatches.forEach(match => {
          const memberId = match.replace(/[()]/g, '');
          // 根据会员编号查找会员
          const member = members.find(m => m.memberId === memberId);
          if (member) {
            paidMembersFromTransactions.add(member.id);
          }
        });
      }
    }
  });
  
  // 筛选出上一年已付费且当前年份未匹配续费的会员
  return members.filter(member => {
    const wasPaidLastYear = paidMembersFromTransactions.has(member.id);
    const isMatchedInCurrentYear = isMemberMatchedInCurrentYear(member.id, selectedPaymentYear);
    
    return wasPaidLastYear && !isMatchedInCurrentYear;
  });
}, [members, selectedPaymentYear, memberMatches, transactions, purposes]);
```

## 🎨 用户界面特性

### 左栏：待续费会员名单
- **会员信息展示**：姓名、会员编号、电话、上一年会费信息
- **匹配状态标识**：已匹配续费（绿色）、未匹配续费（橙色）
- **多选功能**：支持复选框选择多个会员
- **全选操作**：一键选择所有待续费会员
- **导出功能**：支持导出会员名单

### 右栏：会费交易记录
- **交易信息展示**：日期、描述、金额、付款人、交易用途
- **匹配状态显示**：显示已匹配的会员数量和姓名
- **操作按钮**：匹配会员、重新匹配、移除匹配
- **报告生成**：支持生成会费收取报告

### 会员匹配模态框
- **交易详情**：显示选中交易的完整信息
- **会员分类显示**：
  - 待续费会员（橙色背景，优先显示）
  - 其他会员（普通显示）
- **预选功能**：自动应用左栏已选择的会员
- **实时反馈**：显示已选择的会员数量和姓名

## 📊 统计信息

系统提供8个关键统计指标：

1. **总交易数**：当前年份的会费交易总数
2. **总金额**：所有会费交易的总金额
3. **已匹配**：已完成会员匹配的交易数量
4. **未匹配**：尚未匹配会员的交易数量
5. **匹配会员数**：已匹配的会员总数
6. **待续费会员**：需要续费的会员数量
7. **已匹配续费**：已完成续费匹配的会员数量
8. **未匹配续费**：尚未匹配续费的会员数量

## 🔄 数据存储机制

### payerPayee字段存储格式
```typescript
// 单个会员
"张三(JCI001)"

// 多个会员
"张三(JCI001), 李四(JCI002), 王五(JCI003)"
```

### membershipFeeData字段存储格式
```typescript
{
  matchedMemberIds: ["member1", "member2", "member3"],
  matchedAt: "2024-01-15T10:30:00.000Z",
  matchedBy: "user123",
  membershipType: "mixed", // "renewal" | "new" | "mixed"
  renewalMemberIds: ["member1", "member2"],
  newMemberIds: ["member3"]
}
```

## 🚀 使用流程

### 步骤1：选择支付年份
1. 进入财务管理页面
2. 点击"会费管理"标签页
3. 在年份选择器中选择要管理的会费支付年份（如：2024年会费）

### 步骤2：查看待续费会员
1. 左栏自动显示2023年会费交易记录中的会员且2024年未匹配续费的名单
2. 可以查看每个会员的详细信息和匹配状态
3. 使用复选框选择需要匹配的会员

### 步骤3：匹配会费交易
1. 在右栏找到需要匹配的会费交易记录
2. 点击"匹配会员"按钮
3. 在模态框中确认会员选择（左栏预选的会员会自动应用）
4. 点击"确定"完成匹配

### 步骤4：管理匹配关系
- **查看匹配状态**：在交易记录中可以看到已匹配的会员信息
- **重新匹配**：点击"重新匹配"按钮可以修改匹配关系
- **移除匹配**：点击"移除"按钮可以清除匹配关系

## ⚠️ 注意事项

1. **数据一致性**：确保交易记录和会员数据的准确性
2. **权限控制**：只有有权限的用户才能进行会员匹配操作
3. **备份建议**：重要操作前建议备份相关数据
4. **审核流程**：建议建立匹配关系的审核机制
5. **Firebase限制**：遵循Firebase规则，避免传入undefined值

## 🔍 使用场景

### 场景1：新会员费管理
- 选择"2024年会费"
- 左栏显示2023年付费的会员（待续费）
- 右栏显示2024年新会员费交易
- 为每笔交易匹配对应的新会员

### 场景2：续费管理
- 选择"2024年会费"
- 左栏显示2023年会费交易记录中的会员且未匹配2024年续费的名单
- 右栏显示续费相关的交易记录
- 匹配已续费的会员

### 场景3：混合匹配
- 对于金额较大的交易，可能对应多个会员
- 可以同时匹配续费会员和新会员
- 系统会自动识别并分类会员类型

## 🚀 未来扩展

### 计划功能
- **自动匹配建议**：基于付款人姓名自动建议匹配的会员
- **批量匹配**：支持批量处理多个交易的会员匹配
- **匹配历史**：记录匹配操作的完整历史
- **报表生成**：生成详细的会费收取情况报表

### 集成功能
- **邮件通知**：匹配完成后自动发送通知邮件
- **财务对账**：与银行对账单进行自动对账
- **会员状态更新**：根据会费支付情况自动更新会员状态

## 📊 预期筛选结果

根据现有交易记录数据，会费管理页面的筛选结果如下：

### 2022年会费筛选
- **右栏交易记录**：1条
  - 1条2022续费会员费交易记录
- **左栏待续费会员**：基于2021年会费交易记录中的会员且未匹配2022年续费的名单

### 2023年会费筛选
- **右栏交易记录**：1条
  - 1条2023新会员费交易记录
- **左栏待续费会员**：基于2022年会费交易记录中的会员且未匹配2023年续费的名单

### 2024年会费筛选
- **右栏交易记录**：4条
  - 4条2024年会费相关交易记录
- **左栏待续费会员**：基于2023年会费交易记录中的会员且未匹配2024年续费的名单

---

**会费管理2栏布局功能** - 让会员费管理更直观、更高效！
