import { BudgetMainCategory, BudgetSubCategory, BudgetMainCategoryData } from '@/types/finance';

// JCI预算分类配置
export const BUDGET_CATEGORIES: BudgetMainCategoryData[] = [
  {
    id: 'income',
    mainCategoryName: '预算收入 (Budgeted Income)',
    mainCategoryCode: 'I',
    totalAmount: 0,
    subCategories: [
      {
        id: 'membership_subscription',
        subCategoryName: '会员费收入 (Membership Subscription)',
        subCategoryCode: 'A',
        totalAmount: 0,
        items: [],
        parentMainCategory: 'income',
      },
      {
        id: 'external_funding',
        subCategoryName: '外部资助 (External Funding)',
        subCategoryCode: 'B',
        totalAmount: 0,
        items: [],
        parentMainCategory: 'income',
      },
      {
        id: 'project_surplus',
        subCategoryName: '项目盈余 (Project Surplus)',
        subCategoryCode: 'C',
        totalAmount: 0,
        items: [],
        parentMainCategory: 'income',
      },
      {
        id: 'project_floating_funds',
        subCategoryName: '项目浮动资金应收 (Project Floating Funds Receivables)',
        subCategoryCode: 'D',
        totalAmount: 0,
        items: [],
        parentMainCategory: 'income',
      },
      {
        id: 'other_income',
        subCategoryName: '其他收入 (Other Income)',
        subCategoryCode: 'E',
        totalAmount: 0,
        items: [],
        parentMainCategory: 'income',
      },
    ],
  },
  {
    id: 'expense',
    mainCategoryName: '预算支出 (Budgeted Expenses)',
    mainCategoryCode: 'II',
    totalAmount: 0,
    subCategories: [
      {
        id: 'administrative_management',
        subCategoryName: '行政与管理 (Administrative & Management)',
        subCategoryCode: 'A',
        totalAmount: 0,
        items: [],
        parentMainCategory: 'expense',
      },
      {
        id: 'projects',
        subCategoryName: '项目支出 (Projects)',
        subCategoryCode: 'B',
        totalAmount: 0,
        items: [],
        parentMainCategory: 'expense',
      },
      {
        id: 'convention_reception',
        subCategoryName: '大会接待 (Convention Reception)',
        subCategoryCode: 'C',
        totalAmount: 0,
        items: [],
        parentMainCategory: 'expense',
      },
      {
        id: 'merchandise',
        subCategoryName: '商品采购 (Merchandise)',
        subCategoryCode: 'D',
        totalAmount: 0,
        items: [],
        parentMainCategory: 'expense',
      },
      {
        id: 'pre_purchase_tickets',
        subCategoryName: '预购大会门票 (Pre-Purchase of Convention Tickets)',
        subCategoryCode: 'E',
        totalAmount: 0,
        items: [],
        parentMainCategory: 'expense',
      },
    ],
  },
];

// 预算分类选项
export const BUDGET_MAIN_CATEGORY_OPTIONS = [
  { value: 'income', label: '收入 (Income)' },
  { value: 'expense', label: '支出 (Expense)' },
];

export const BUDGET_SUB_CATEGORY_OPTIONS: Record<BudgetMainCategory, Array<{ value: BudgetSubCategory; label: string }>> = {
  income: [
    { value: 'membership_subscription', label: 'A. 会员费收入 (Membership Subscription)' },
    { value: 'external_funding', label: 'B. 外部资助 (External Funding)' },
    { value: 'project_surplus', label: 'C. 项目盈余 (Project Surplus)' },
    { value: 'project_floating_funds', label: 'D. 项目浮动资金应收 (Project Floating Funds Receivables)' },
    { value: 'other_income', label: 'E. 其他收入 (Other Income)' },
  ],
  expense: [
    { value: 'administrative_management', label: 'A. 行政与管理 (Administrative & Management)' },
    { value: 'projects', label: 'B. 项目支出 (Projects)' },
    { value: 'convention_reception', label: 'C. 大会接待 (Convention Reception)' },
    { value: 'merchandise', label: 'D. 商品采购 (Merchandise)' },
    { value: 'pre_purchase_tickets', label: 'E. 预购大会门票 (Pre-Purchase of Convention Tickets)' },
  ],
};

// 根据主分类获取子分类选项
export const getSubCategoryOptions = (mainCategory: BudgetMainCategory) => {
  return BUDGET_SUB_CATEGORY_OPTIONS[mainCategory] || [];
};

// 根据子分类生成项目代码
export const generateItemCode = (subCategory: BudgetSubCategory, itemIndex: number): string => {
  const subCategoryCode = BUDGET_CATEGORIES
    .flatMap(main => main.subCategories)
    .find(sub => sub.id === subCategory)?.subCategoryCode || 'X';
  
  return `${subCategoryCode}.${itemIndex + 1}`;
};

// 获取分类显示名称
export const getCategoryDisplayName = (mainCategory: BudgetMainCategory, subCategory?: BudgetSubCategory): string => {
  const mainCategoryData = BUDGET_CATEGORIES.find(cat => cat.id === mainCategory);
  if (!mainCategoryData) return '';
  
  if (!subCategory) {
    return mainCategoryData.mainCategoryName;
  }
  
  const subCategoryData = mainCategoryData.subCategories.find(sub => sub.id === subCategory);
  return subCategoryData ? subCategoryData.subCategoryName : '';
};

// 预算项目模板
export const BUDGET_ITEM_TEMPLATES: Record<BudgetSubCategory, Array<{ name: string; note?: string }>> = {
  // 收入项目模板
  membership_subscription: [
    { name: '现有会员费', note: 'Note 1' },
    { name: '新会员费', note: 'Note 2' },
  ],
  external_funding: [
    { name: '分会赞助', note: 'Note 3' },
  ],
  project_surplus: [
    { name: '个人项目', note: 'Note 4' },
    { name: '社区项目', note: 'Note 4' },
    { name: '商业项目', note: 'Note 4' },
    { name: '国际项目', note: 'Note 4' },
    { name: '财务项目', note: 'Note 4' },
    { name: 'GLC项目', note: 'Note 4' },
    { name: '第69届就职典礼及颁奖晚宴', note: 'Note 4' },
    { name: '中央南区大会', note: 'Note 4' },
  ],
  project_floating_funds: [
    { name: '个人项目浮动资金', note: 'Note 4' },
    { name: '社区项目浮动资金', note: 'Note 4' },
    { name: '商业项目浮动资金', note: 'Note 4' },
    { name: '国际项目浮动资金', note: 'Note 4' },
    { name: '财务项目浮动资金', note: 'Note 4' },
    { name: 'GLC项目浮动资金', note: 'Note 4' },
    { name: '第69届就职典礼及颁奖晚宴浮动资金', note: 'Note 4' },
    { name: '中央南区大会浮动资金', note: 'Note 4' },
  ],
  other_income: [
    { name: '粉红衬衫销售', note: 'Note 5' },
    { name: '名片销售', note: 'Note 6' },
  ],
  
  // 支出项目模板
  administrative_management: [
    { name: '建筑管理费', note: 'Note 7' },
    { name: '电费', note: 'Note 8' },
    { name: '水费', note: 'Note 9' },
    { name: '门牌税', note: 'Note 10' },
    { name: 'JCIM国家会费', note: 'Note 11' },
    { name: 'JCIM中央南区会费', note: 'Note 12' },
    { name: 'Google Drive年度订阅', note: 'Note 13' },
    { name: '审计费', note: 'Note 14' },
    { name: '印刷材料', note: 'Note 15' },
    { name: '网站域名及设置', note: 'Note 16' },
    { name: '移动费用', note: 'Note 17' },
    { name: 'ZOOM Pro账户', note: 'Note 18' },
    { name: '秘书处管理', note: 'Note 19' },
    { name: '报纸订阅', note: 'Note 20' },
    { name: '媒体感谢礼品', note: 'Note 21' },
    { name: '杂项', note: 'Note 22' },
  ],
  projects: [
    { name: '个人项目支出', note: 'Note 3' },
    { name: '社区项目支出', note: 'Note 3' },
    { name: '商业项目支出', note: 'Note 3' },
    { name: '国际项目支出', note: 'Note 3' },
    { name: '财务项目支出', note: 'Note 3' },
    { name: 'GLC项目支出', note: 'Note 3' },
    { name: '第69届就职典礼及颁奖晚宴支出', note: 'Note 3' },
    { name: '中央南区大会支出', note: 'Note 3' },
  ],
  convention_reception: [
    { name: 'JCIM中央南区大会接待', note: 'Note 23' },
    { name: 'JCIM国家大会接待', note: 'Note 24' },
    { name: 'JCI亚太区大会姐妹分会接待', note: 'Note 25' },
  ],
  merchandise: [
    { name: '粉红衬衫采购', note: 'Note 26' },
    { name: '名片采购', note: 'Note 27' },
    { name: 'JCI徽章采购', note: 'Note 28' },
  ],
  pre_purchase_tickets: [
    { name: '2023 JCIM中央南区大会门票', note: 'Note 29' },
    { name: '2023 JCIM国家大会门票', note: 'Note 29' },
  ],
};

// 根据子分类获取项目模板
export const getItemTemplates = (subCategory: BudgetSubCategory) => {
  return BUDGET_ITEM_TEMPLATES[subCategory] || [];
};
