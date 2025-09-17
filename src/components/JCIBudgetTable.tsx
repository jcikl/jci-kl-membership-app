import React, { useMemo, useState, useEffect } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Typography,
  Collapse,
  Alert,
  Tooltip,
  message,
} from 'antd';
import {
  DollarOutlined,
  PieChartOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { Budget, BudgetAllocation } from '@/types/finance';
import { budgetActualService, ActualIncomeExpenseData } from '@/services/budgetActualService';
import BudgetModal from './BudgetModal';

const { Text } = Typography;
const { Panel } = Collapse;

interface JCIBudgetTableProps {
  budgets: Budget[];
  allocations: BudgetAllocation[];
  loading?: boolean;
  onEditBudget?: (budget: Budget) => void;
  onDeleteBudget: (budget: Budget) => void;
  onViewAllocations: (budget: Budget) => void;
  onStartApproval: (budget: Budget) => void;
  onViewWorkflow?: (budget: Budget) => void;
  onUpdateBudget?: (budget: Budget) => void;
  onCreateBudget?: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUseTemplate?: () => void;
  selectedYear?: number;
}

interface BudgetSummary {
  totalIncome: number;
  totalExpense: number;
  netSurplus: number;
  incomeCategories: {
    membership: number;
    externalFunding: number;
    projectSurplus: number;
    otherIncome: number;
  };
  expenseCategories: {
    administrative: number;
    projects: number;
    convention: number;
    merchandise: number;
    prePurchase: number;
  };
  // 实际收支数据
  actualData?: {
    totalActualIncome: number;
    totalActualExpense: number;
    netActual: number;
    overallVariance: number;
    overallVariancePercentage: number;
  };
}

const JCIBudgetTable: React.FC<JCIBudgetTableProps> = ({
  budgets,
  loading = false,
  onDeleteBudget,
  onViewAllocations,
  onStartApproval,
  onUpdateBudget,
  onCreateBudget,
  onUseTemplate,
  selectedYear = new Date().getFullYear(),
}) => {
  
  // 实际收支数据状态
  const [actualData, setActualData] = useState<ActualIncomeExpenseData[]>([]);
  
  // BudgetModal状态管理
  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
  const [budgetModalMode, setBudgetModalMode] = useState<'create' | 'edit'>('create');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // 加载实际收支数据
  useEffect(() => {
    const loadActualData = async () => {
      if (budgets.length === 0) return;
      
      try {
        const data = await budgetActualService.calculateActualIncomeExpense(budgets);
        setActualData(data);
      } catch (error) {
        console.error('加载实际收支数据失败:', error);
        message.error('加载实际收支数据失败');
      }
    };

    loadActualData();
  }, [budgets]);

  // 处理创建预算
  const handleCreateBudget = () => {
    setBudgetModalMode('create');
    setSelectedBudget(null);
    setIsBudgetModalVisible(true);
  };

  // 处理编辑预算
  const handleEditBudget = (budget: Budget) => {
    setBudgetModalMode('edit');
    setSelectedBudget(budget);
    setIsBudgetModalVisible(true);
  };

  // 处理BudgetModal确认
  const handleBudgetModalOk = async (budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (budgetModalMode === 'create' && onCreateBudget) {
        await onCreateBudget(budgetData);
        message.success('预算创建成功');
      } else if (budgetModalMode === 'edit' && selectedBudget && onUpdateBudget) {
        const updatedBudget = { ...selectedBudget, ...budgetData };
        await onUpdateBudget(updatedBudget);
        message.success('预算更新成功');
      }
      setIsBudgetModalVisible(false);
    } catch (error) {
      console.error('预算操作失败:', error);
      message.error('预算操作失败');
    }
  };

  // 处理BudgetModal取消
  const handleBudgetModalCancel = () => {
    setIsBudgetModalVisible(false);
    setSelectedBudget(null);
  };

  // 获取子分类显示名称
  const getSubCategoryDisplayName = (subCategory: string): string => {
    const subCategoryNames: Record<string, string> = {
      // 收入子分类
      'membership_subscription': 'A. 会员订阅',
      'external_funding': 'B. 外部资助',
      'project_surplus': 'C. 项目盈余',
      'project_floating_funds': 'D. 项目浮动资金',
      'other_income': 'E. 其他收入',
      // 支出子分类
      'administrative_management': 'A. 行政费用',
      'projects': 'B. 项目支出',
      'convention_reception': 'C. 大会接待',
      'merchandise': 'D. 商品采购',
      'pre_purchase_tickets': 'E. 预购门票',
    };
    return subCategoryNames[subCategory] || subCategory;
  };

   // 嵌套分组数据 - 简化版本，不显示主分类行
   const nestedBudgetData = useMemo(() => {
     const groupedData: any[] = [];
     
     // 按主分类分组
     const mainCategoryGroups = budgets.reduce((acc, budget) => {
       const mainCategory = budget.mainCategory || 'unknown';
       if (!acc[mainCategory]) {
         acc[mainCategory] = [];
       }
       acc[mainCategory].push(budget);
       return acc;
     }, {} as Record<string, Budget[]>);

     // 为每个主分类创建嵌套结构（不显示主分类行）
     Object.entries(mainCategoryGroups).forEach(([mainCategory, categoryBudgets]) => {
       // 按子分类分组
       const subCategoryGroups = categoryBudgets.reduce((acc, budget) => {
         const subCategory = budget.subCategory || 'unknown';
         if (!acc[subCategory]) {
           acc[subCategory] = [];
         }
         acc[subCategory].push(budget);
         return acc;
       }, {} as Record<string, Budget[]>);

       // 为每个子分类创建嵌套结构
       Object.entries(subCategoryGroups).forEach(([subCategory, subCategoryBudgets]) => {
         // 计算子分类总计
         const subCategoryTotal = subCategoryBudgets.reduce((sum, b) => sum + b.totalBudget, 0);
         
         // 获取子分类显示名称
         const subCategoryName = getSubCategoryDisplayName(subCategory);
         
         // 添加子分类行
         groupedData.push({
           key: `sub-${subCategory}`,
           projectName: subCategoryName,
           totalBudget: subCategoryTotal,
           spentAmount: subCategoryBudgets.reduce((sum, b) => sum + b.spentAmount, 0),
           remainingAmount: subCategoryTotal - subCategoryBudgets.reduce((sum, b) => sum + b.spentAmount, 0),
           status: subCategoryBudgets[0].status,
           mainCategory: mainCategory,
           subCategory: subCategory,
           itemCode: null,
           note: null,
           description: `${subCategoryBudgets.length}个项目`,
           isGroup: true,
           level: 1, // 子分类层级（现在是第一层）
           children: [],
         });

         // 直接添加所有项目，不进行项目模板分组
         subCategoryBudgets.forEach((budget, index) => {
           groupedData.push({
             key: `${budget.id}-${index}`,
             ...budget,
             isGroup: false,
             level: 2, // 项目层级（现在是第二层）
           });
         });
       });
     });

     return groupedData;
   }, [budgets]);


  // 计算预算汇总数据
  const budgetSummary: BudgetSummary = useMemo(() => {
    const summary: BudgetSummary = {
      totalIncome: 0,
      totalExpense: 0,
      netSurplus: 0,
      incomeCategories: {
        membership: 0,
        externalFunding: 0,
        projectSurplus: 0,
        otherIncome: 0,
      },
      expenseCategories: {
        administrative: 0,
        projects: 0,
        convention: 0,
        merchandise: 0,
        prePurchase: 0,
      },
    };

    budgets.forEach(budget => {
      // 优先使用新的层次结构字段进行分类
      if (budget.mainCategory === 'income') {
        switch (budget.subCategory) {
          case 'membership_subscription':
            summary.incomeCategories.membership += budget.totalBudget;
            break;
          case 'external_funding':
            summary.incomeCategories.externalFunding += budget.totalBudget;
            break;
          case 'project_surplus':
            summary.incomeCategories.projectSurplus += budget.totalBudget;
            break;
          case 'project_floating_funds':
            summary.incomeCategories.projectSurplus += budget.totalBudget; // 归类到项目盈余
            break;
          case 'other_income':
            summary.incomeCategories.otherIncome += budget.totalBudget;
            break;
          default:
            // 兼容旧的分类逻辑
            if (budget.projectName.includes('会员') || budget.projectName.includes('Membership')) {
              summary.incomeCategories.membership += budget.totalBudget;
            } else if (budget.projectName.includes('赞助') || budget.projectName.includes('Sponsor')) {
              summary.incomeCategories.externalFunding += budget.totalBudget;
            } else if (budget.projectName.includes('项目') || budget.projectName.includes('Project')) {
              summary.incomeCategories.projectSurplus += budget.totalBudget;
            } else {
              summary.incomeCategories.otherIncome += budget.totalBudget;
            }
        }
      } else if (budget.mainCategory === 'expense') {
        switch (budget.subCategory) {
          case 'administrative_management':
            summary.expenseCategories.administrative += budget.totalBudget;
            break;
          case 'projects':
            summary.expenseCategories.projects += budget.totalBudget;
            break;
          case 'convention_reception':
            summary.expenseCategories.convention += budget.totalBudget;
            break;
          case 'merchandise':
            summary.expenseCategories.merchandise += budget.totalBudget;
            break;
          case 'pre_purchase_tickets':
            summary.expenseCategories.prePurchase += budget.totalBudget;
            break;
          default:
            // 兼容旧的分类逻辑
            if (budget.projectName.includes('行政') || budget.projectName.includes('Administrative')) {
              summary.expenseCategories.administrative += budget.totalBudget;
            } else if (budget.projectName.includes('项目') || budget.projectName.includes('Project')) {
              summary.expenseCategories.projects += budget.totalBudget;
            } else if (budget.projectName.includes('大会') || budget.projectName.includes('Convention')) {
              summary.expenseCategories.convention += budget.totalBudget;
            } else if (budget.projectName.includes('商品') || budget.projectName.includes('Merchandise')) {
              summary.expenseCategories.merchandise += budget.totalBudget;
            } else if (budget.projectName.includes('预购') || budget.projectName.includes('Pre-Purchase')) {
              summary.expenseCategories.prePurchase += budget.totalBudget;
            }
        }
      } else {
        // 兼容没有层次结构字段的旧数据
        if (budget.projectName.includes('会员') || budget.projectName.includes('Membership')) {
          summary.incomeCategories.membership += budget.totalBudget;
        } else if (budget.projectName.includes('赞助') || budget.projectName.includes('Sponsor')) {
          summary.incomeCategories.externalFunding += budget.totalBudget;
        } else if (budget.projectName.includes('项目') || budget.projectName.includes('Project')) {
          summary.incomeCategories.projectSurplus += budget.totalBudget;
        } else if (budget.projectName.includes('行政') || budget.projectName.includes('Administrative')) {
          summary.expenseCategories.administrative += budget.totalBudget;
        } else if (budget.projectName.includes('大会') || budget.projectName.includes('Convention')) {
          summary.expenseCategories.convention += budget.totalBudget;
        } else if (budget.projectName.includes('商品') || budget.projectName.includes('Merchandise')) {
          summary.expenseCategories.merchandise += budget.totalBudget;
        } else if (budget.projectName.includes('预购') || budget.projectName.includes('Pre-Purchase')) {
          summary.expenseCategories.prePurchase += budget.totalBudget;
        } else {
          summary.incomeCategories.otherIncome += budget.totalBudget;
        }
      }
    });

    summary.totalIncome = Object.values(summary.incomeCategories).reduce((sum, val) => sum + val, 0);
    summary.totalExpense = Object.values(summary.expenseCategories).reduce((sum, val) => sum + val, 0);
    summary.netSurplus = summary.totalIncome - summary.totalExpense;

    // 添加实际收支数据
    if (actualData.length > 0) {
      const incomeData = actualData.filter(d => d.budgetCategory === 'income');
      const expenseData = actualData.filter(d => d.budgetCategory === 'expense');
      
      const totalActualIncome = incomeData.reduce((sum, d) => sum + d.actualIncome, 0);
      const totalActualExpense = expenseData.reduce((sum, d) => sum + d.actualExpense, 0);
      const netActual = totalActualIncome - totalActualExpense;
      const overallVariance = netActual - summary.netSurplus;
      const overallVariancePercentage = summary.netSurplus !== 0 ? (overallVariance / summary.netSurplus) * 100 : 0;

      summary.actualData = {
        totalActualIncome,
        totalActualExpense,
        netActual,
        overallVariance,
        overallVariancePercentage
      };
    }

    return summary;
  }, [budgets, actualData]);


  // 获取预算项目的实际数据
  const getBudgetActualData = (budget: Budget): ActualIncomeExpenseData | null => {
    return actualData.find(d => d.budgetId === budget.id) || null;
  };

  // 获取子分类的实际数据
  const getSubCategoryActualData = (subCategory: string, mainCategory: string): ActualIncomeExpenseData | null => {
    return actualData.find(d => d.budgetSubCategory === subCategory && d.budgetCategory === mainCategory) || null;
  };

   // 收入表格列定义 - 使用BudgetModal
   const incomeColumns = [
     {
       title: '序号',
       dataIndex: 'index',
       key: 'index',
       width: 60,
       align: 'center' as const,
       render: (_: any, record: any, index: number) => {
         if (record.isGroup) {
           return <Text type="secondary">-</Text>;
         }
         return index + 1;
       },
     },
     {
       title: 'Budgeted Income (次分类)',
       dataIndex: 'projectName',
       key: 'projectName',
       render: (text: string, record: any) => {
         if (record.isGroup) {
           return (
             <div style={{ paddingLeft: '0px' }}>
               <Text strong style={{ color: '#1890ff' }}>
                 📂 {text}
               </Text>
               <br />
               <Text type="secondary" style={{ fontSize: '12px' }}>
                 {record.description}
               </Text>
             </div>
           );
         }
         
         return (
           <div style={{ paddingLeft: '20px' }}>
             <Text strong>{text}</Text>
             <br />
             <Text type="secondary" style={{ fontSize: '12px' }}>
               {record.budgetYear}年度
             </Text>
           </div>
         );
       },
     },
     {
       title: 'Notes',
       dataIndex: 'note',
       key: 'note',
       width: 80,
       align: 'center' as const,
       render: (text: string, record: any) => {
         if (record.isGroup) {
           return <Text type="secondary">-</Text>;
         }
         return text || '-';
       },
     },
     {
       title: 'Amount (RM)',
       dataIndex: 'totalBudget',
       key: 'totalBudget',
       align: 'right' as const,
       width: 150,
       render: (amount: number, record: any) => {
         if (record.isGroup) {
           // 子分类行不显示总和，因为Total栏已经显示了
           return <Text type="secondary">-</Text>;
         }
         
         return (
           <Text strong style={{ color: '#52c41a' }}>
             {amount.toLocaleString()}
           </Text>
         );
       },
     },
     {
       title: 'Total (RM)',
       dataIndex: 'totalBudget',
       key: 'total',
       align: 'right' as const,
       width: 150,
       render: (amount: number, record: any) => {
         if (record.isGroup && record.level === 1) {
           return (
             <Text strong style={{ color: '#1890ff' }}>
               {amount.toLocaleString()}
             </Text>
           );
         }
         
         return <Text type="secondary">-</Text>;
       },
     },
     {
       title: 'Actual Income (RM)',
       key: 'actualIncome',
       align: 'right' as const,
       width: 150,
       render: (_: any, record: any) => {
         if (record.isGroup) {
           const subCategoryData = getSubCategoryActualData(record.subCategory, record.mainCategory);
           if (subCategoryData) {
             return (
               <Text strong style={{ color: '#52c41a' }}>
                 {subCategoryData.actualIncome.toLocaleString()}
               </Text>
             );
           }
           return <Text type="secondary">-</Text>;
         }
         
         const budgetActualData = getBudgetActualData(record);
         if (budgetActualData) {
           return (
             <Text style={{ color: '#52c41a' }}>
               {budgetActualData.actualIncome.toLocaleString()}
             </Text>
           );
         }
         
         return <Text type="secondary">-</Text>;
       },
     },
     {
       title: 'Variance (RM)',
       key: 'variance',
       align: 'right' as const,
       width: 150,
       render: (_: any, record: any) => {
         if (record.isGroup) {
           const subCategoryData = getSubCategoryActualData(record.subCategory, record.mainCategory);
           if (subCategoryData) {
             const variance = subCategoryData.actualIncome - subCategoryData.budgetedAmount;
             const variancePercentage = subCategoryData.budgetedAmount !== 0 ? 
               (variance / subCategoryData.budgetedAmount) * 100 : 0;
             
             const status = budgetActualService.getBudgetExecutionStatus(variancePercentage);
             return (
               <div>
                 <Text strong style={{ color: status.color }}>
                   {budgetActualService.formatAmount(variance, true)}
                 </Text>
                 <br />
                 <Text type="secondary" style={{ fontSize: '12px' }}>
                   {budgetActualService.formatPercentage(variancePercentage)}
                 </Text>
               </div>
             );
           }
           return <Text type="secondary">-</Text>;
         }
         
         const budgetActualData = getBudgetActualData(record);
         if (budgetActualData) {
           const variance = budgetActualData.actualIncome - budgetActualData.budgetedAmount;
           const variancePercentage = budgetActualData.budgetedAmount !== 0 ? 
             (variance / budgetActualData.budgetedAmount) * 100 : 0;
           
           const status = budgetActualService.getBudgetExecutionStatus(variancePercentage);
           return (
             <div>
               <Text style={{ color: status.color }}>
                 {budgetActualService.formatAmount(variance, true)}
               </Text>
               <br />
               <Text type="secondary" style={{ fontSize: '12px' }}>
                 {budgetActualService.formatPercentage(variancePercentage)}
               </Text>
             </div>
           );
         }
         
         return <Text type="secondary">-</Text>;
       },
     },
     {
       title: '操作',
       key: 'actions',
       width: 120,
       render: (_: any, record: any) => {
         if (record.isGroup) {
           // 次分类行不显示展开按钮
           return <Text type="secondary">-</Text>;
         }
         
         return (
           <Space size="small">
             <Tooltip title="查看分配">
               <Button
                 size="small"
                 icon={<EyeOutlined />}
                 onClick={() => onViewAllocations(record)}
               />
             </Tooltip>
             {record.status === 'draft' && (
               <>
                 <Tooltip title="编辑">
                   <Button
                     size="small"
                     icon={<EditOutlined />}
                     onClick={() => handleEditBudget(record)}
                   />
                 </Tooltip>
                 <Tooltip title="提交审批">
                   <Button
                     type="primary"
                     size="small"
                     onClick={() => onStartApproval(record)}
                   />
                 </Tooltip>
                 <Tooltip title="删除">
                   <Button
                     size="small"
                     danger
                     icon={<DeleteOutlined />}
                     onClick={() => onDeleteBudget(record)}
                   />
                 </Tooltip>
               </>
             )}
             {record.status === 'approved' && (
               <Tooltip title="撤销审批">
                 <Button
                   size="small"
                   danger
                   onClick={() => onStartApproval(record)}
                 >
                   撤销审批
                 </Button>
               </Tooltip>
             )}
           </Space>
         );
       },
     },
   ];

  // 支出表格列定义 - 与收入表格保持一致
  const expenseColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: any, record: any, index: number) => {
        if (record.isGroup) {
          return <Text type="secondary">-</Text>;
        }
        return index + 1;
      },
    },
    {
      title: 'Budgeted Expenses (次分类)',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string, record: any) => {
        if (record.isGroup) {
          return (
            <div style={{ paddingLeft: '0px' }}>
              <Text strong style={{ color: '#1890ff' }}>
                📂 {text}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description}
              </Text>
            </div>
          );
        }
        
        return (
          <div style={{ paddingLeft: '20px' }}>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.budgetYear}年度
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Notes',
      dataIndex: 'note',
      key: 'note',
      width: 80,
      align: 'center' as const,
      render: (text: string, record: any) => {
        if (record.isGroup) {
          return <Text type="secondary">-</Text>;
        }
        return text || '-';
      },
    },
    {
      title: 'Amount (RM)',
      dataIndex: 'totalBudget',
      key: 'totalBudget',
      align: 'right' as const,
      width: 150,
      render: (amount: number, record: any) => {
        if (record.isGroup) {
          // 子分类行不显示总和，因为Total栏已经显示了
          return <Text type="secondary">-</Text>;
        }
        
        return (
          <Text strong style={{ color: '#ff4d4f' }}>
            {amount.toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: 'Total (RM)',
      dataIndex: 'totalBudget',
      key: 'total',
      align: 'right' as const,
      width: 150,
      render: (amount: number, record: any) => {
        if (record.isGroup && record.level === 1) {
          return (
            <Text strong style={{ color: '#1890ff' }}>
              {amount.toLocaleString()}
            </Text>
          );
        }
        
        return <Text type="secondary">-</Text>;
      },
    },
     {
       title: 'Actual Expense (RM)',
       key: 'actualExpense',
       align: 'right' as const,
       width: 150,
       render: (_: any, record: any) => {
         if (record.isGroup) {
           const subCategoryData = getSubCategoryActualData(record.subCategory, record.mainCategory);
           if (subCategoryData) {
             return (
               <Text strong style={{ color: '#ff4d4f' }}>
                 {subCategoryData.actualExpense.toLocaleString()}
               </Text>
             );
           }
           return <Text type="secondary">-</Text>;
         }
         
         const budgetActualData = getBudgetActualData(record);
         if (budgetActualData) {
           return (
             <Text style={{ color: '#ff4d4f' }}>
               {budgetActualData.actualExpense.toLocaleString()}
             </Text>
           );
         }
         
         return <Text type="secondary">-</Text>;
       },
     },
     {
       title: 'Variance (RM)',
       key: 'expenseVariance',
       align: 'right' as const,
       width: 150,
       render: (_: any, record: any) => {
         if (record.isGroup) {
           const subCategoryData = getSubCategoryActualData(record.subCategory, record.mainCategory);
           if (subCategoryData) {
             const variance = subCategoryData.actualExpense - subCategoryData.budgetedAmount;
             const variancePercentage = subCategoryData.budgetedAmount !== 0 ? 
               (variance / subCategoryData.budgetedAmount) * 100 : 0;
             
             const status = budgetActualService.getBudgetExecutionStatus(variancePercentage);
             return (
               <div>
                 <Text strong style={{ color: status.color }}>
                   {budgetActualService.formatAmount(variance, true)}
                 </Text>
                 <br />
                 <Text type="secondary" style={{ fontSize: '12px' }}>
                   {budgetActualService.formatPercentage(variancePercentage)}
                 </Text>
               </div>
             );
           }
           return <Text type="secondary">-</Text>;
         }
         
         const budgetActualData = getBudgetActualData(record);
         if (budgetActualData) {
           const variance = budgetActualData.actualExpense - budgetActualData.budgetedAmount;
           const variancePercentage = budgetActualData.budgetedAmount !== 0 ? 
             (variance / budgetActualData.budgetedAmount) * 100 : 0;
           
           const status = budgetActualService.getBudgetExecutionStatus(variancePercentage);
           return (
             <div>
               <Text style={{ color: status.color }}>
                 {budgetActualService.formatAmount(variance, true)}
               </Text>
               <br />
               <Text type="secondary" style={{ fontSize: '12px' }}>
                 {budgetActualService.formatPercentage(variancePercentage)}
               </Text>
             </div>
           );
         }
         
         return <Text type="secondary">-</Text>;
       },
     },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => {
        if (record.isGroup) {
          // 次分类行不显示展开按钮，与收入表格保持一致
          return <Text type="secondary">-</Text>;
        }
        
        return (
          <Space size="small">
            <Tooltip title="查看分配">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onViewAllocations(record)}
              />
            </Tooltip>
            {record.status === 'draft' && (
              <>
                <Tooltip title="编辑">
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEditBudget(record)}
                  />
                </Tooltip>
                <Tooltip title="提交审批">
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => onStartApproval(record)}
                  />
                </Tooltip>
                <Tooltip title="删除">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDeleteBudget(record)}
                  />
                </Tooltip>
              </>
            )}
            {record.status === 'approved' && (
              <Tooltip title="撤销审批">
                <Button
                  size="small"
                  danger
                  onClick={() => onStartApproval(record)}
                >
                  撤销审批
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

   return (
     <div>
       <style>{`
         .main-category-row {
           background-color: #e6f7ff !important;
           font-weight: bold;
         }
         .main-category-row:hover {
           background-color: #bae7ff !important;
         }
         .sub-category-row {
           background-color: #f0f9ff !important;
           font-weight: 500;
         }
         .sub-category-row:hover {
           background-color: #d6f0ff !important;
         }
         .normal-row {
           background-color: #ffffff;
         }
         .normal-row:hover {
           background-color: #f5f5f5;
         }
       `}</style>
       
       {/* 预算汇总卡片 */}
      <Card 
        title="2024 JCI Kuala Lumpur 预算汇总" 
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                // 触发使用模板功能，需要从父组件传递
                if (onUseTemplate) {
                  onUseTemplate();
                }
              }}
            >
              使用模板
            </Button>
            <Button 
              type="primary" 
              onClick={handleCreateBudget}
              disabled={!onCreateBudget}
            >
              创建预算
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="总收入预算"
              value={budgetSummary.totalIncome}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="RM"
            />
            {budgetSummary.actualData && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  实际收入: {budgetSummary.actualData.totalActualIncome.toLocaleString()} RM
                </Text>
                <br />
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: '12px',
                    color: budgetSummary.actualData.totalActualIncome >= budgetSummary.totalIncome ? '#52c41a' : '#ff4d4f'
                  }}
                >
                  {budgetSummary.actualData.totalActualIncome >= budgetSummary.totalIncome ? 
                    <ArrowUpOutlined /> : <ArrowDownOutlined />} 
                  {budgetActualService.formatPercentage(
                    budgetSummary.totalIncome !== 0 ? 
                    ((budgetSummary.actualData.totalActualIncome - budgetSummary.totalIncome) / budgetSummary.totalIncome) * 100 : 0
                  )}
                </Text>
              </div>
            )}
          </Col>
          <Col span={6}>
            <Statistic
              title="总支出预算"
              value={budgetSummary.totalExpense}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
              suffix="RM"
            />
            {budgetSummary.actualData && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  实际支出: {budgetSummary.actualData.totalActualExpense.toLocaleString()} RM
                </Text>
                <br />
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: '12px',
                    color: budgetSummary.actualData.totalActualExpense <= budgetSummary.totalExpense ? '#52c41a' : '#ff4d4f'
                  }}
                >
                  {budgetSummary.actualData.totalActualExpense <= budgetSummary.totalExpense ? 
                    <ArrowUpOutlined /> : <ArrowDownOutlined />} 
                  {budgetActualService.formatPercentage(
                    budgetSummary.totalExpense !== 0 ? 
                    ((budgetSummary.actualData.totalActualExpense - budgetSummary.totalExpense) / budgetSummary.totalExpense) * 100 : 0
                  )}
                </Text>
              </div>
            )}
          </Col>
          <Col span={6}>
            <Statistic
              title="预算盈余"
              value={budgetSummary.netSurplus}
              prefix={<DollarOutlined />}
              valueStyle={{ color: budgetSummary.netSurplus >= 0 ? '#52c41a' : '#ff4d4f' }}
              suffix="RM"
            />
            {budgetSummary.actualData && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  实际盈余: {budgetSummary.actualData.netActual.toLocaleString()} RM
                </Text>
                <br />
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: '12px',
                    color: budgetSummary.actualData.netActual >= budgetSummary.netSurplus ? '#52c41a' : '#ff4d4f'
                  }}
                >
                  {budgetSummary.actualData.netActual >= budgetSummary.netSurplus ? 
                    <ArrowUpOutlined /> : <ArrowDownOutlined />} 
                  {budgetActualService.formatAmount(budgetSummary.actualData.overallVariance, true)} RM
                </Text>
              </div>
            )}
          </Col>
          <Col span={6}>
            <Statistic
              title="预算项目数"
              value={budgets.length}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            {budgetSummary.actualData && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  整体偏差: {budgetActualService.formatPercentage(budgetSummary.actualData.overallVariancePercentage)}
                </Text>
                <br />
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: '12px',
                    color: Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 5 ? '#52c41a' : 
                           Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 15 ? '#1890ff' :
                           Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 30 ? '#faad14' : '#ff4d4f'
                  }}
                >
                  {Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 5 ? '优秀' :
                   Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 15 ? '良好' :
                   Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 30 ? '需关注' : '严重偏差'}
                </Text>
              </div>
            )}
          </Col>
        </Row>

        {/* 预算执行状态警告 */}
        {budgetSummary.netSurplus < 0 && (
          <Alert
            message="预算赤字警告"
            description={`当前预算存在 ${Math.abs(budgetSummary.netSurplus).toLocaleString()} RM 的赤字，请及时调整预算或增加收入来源。`}
            type="warning"
            icon={<WarningOutlined />}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

       {/* 收入预算表格 */}
       <Card 
         title="I. 预算收入 (Budgeted Income)" 
         style={{ marginBottom: 24 }}
       >
           <Table
             columns={incomeColumns}
             dataSource={nestedBudgetData.filter(item => 
               item.mainCategory === 'income' || 
               item.projectName.includes('会员') || 
               item.projectName.includes('赞助') || 
               item.projectName.includes('项目') ||
               item.projectName.includes('其他')
             )}
             rowKey="key"
             loading={loading}
             pagination={false}
             size="small"
             bordered
             rowClassName={(record) => {
               if (record.isGroup && record.level === 1) {
                 return 'sub-category-row'; // 子分类行样式
               }
               return 'normal-row'; // 普通行样式
             }}
             summary={() => (
               <Table.Summary.Row style={{ backgroundColor: '#e6f7ff' }}>
                 <Table.Summary.Cell index={0} colSpan={3}>
                   <Text strong style={{ fontSize: '14px' }}>Total Budgeted Income</Text>
                 </Table.Summary.Cell>
                 <Table.Summary.Cell index={3} align="right">
                   <Text type="secondary" style={{ fontSize: '14px' }}>-</Text>
                 </Table.Summary.Cell>
                 <Table.Summary.Cell index={4} align="right">
                   <Text strong style={{ color: '#1890ff', fontSize: '14px' }}>
                     {budgetSummary.totalIncome.toLocaleString()}
                   </Text>
                 </Table.Summary.Cell>
                 <Table.Summary.Cell index={5} align="right">
                   <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
                     {budgetSummary.actualData ? budgetSummary.actualData.totalActualIncome.toLocaleString() : '-'}
                   </Text>
                 </Table.Summary.Cell>
                 <Table.Summary.Cell index={6} align="right">
                   <Text strong style={{ color: '#1890ff', fontSize: '14px' }}>
                     {budgetSummary.actualData ? 
                       budgetActualService.formatAmount(budgetSummary.actualData.totalActualIncome - budgetSummary.totalIncome, true) : '-'}
                   </Text>
                 </Table.Summary.Cell>
               </Table.Summary.Row>
             )}
           />
       </Card>

      {/* 支出预算表格 */}
      <Card 
        title="II. 预算支出 (Budgeted Expenses)" 
        style={{ marginBottom: 24 }}
      >
          <Table
            columns={expenseColumns}
            dataSource={nestedBudgetData.filter(item => 
              item.mainCategory === 'expense' || 
              item.projectName.includes('行政') || 
              item.projectName.includes('项目') || 
              item.projectName.includes('大会') ||
              item.projectName.includes('商品') ||
              item.projectName.includes('预购')
            )}
            rowKey="key"
            loading={loading}
            pagination={false}
            size="small"
            bordered
            rowClassName={(record) => {
              if (record.isGroup && record.level === 1) {
                return 'sub-category-row'; // 子分类行样式，与收入表格保持一致
              }
              return 'normal-row'; // 普通行样式
            }}
             summary={() => (
               <Table.Summary.Row style={{ backgroundColor: '#fff2e8' }}>
                 <Table.Summary.Cell index={0} colSpan={3}>
                   <Text strong style={{ fontSize: '14px' }}>Total Budgeted Expenses</Text>
                 </Table.Summary.Cell>
                 <Table.Summary.Cell index={3} align="right">
                   <Text type="secondary" style={{ fontSize: '14px' }}>-</Text>
                 </Table.Summary.Cell>
                 <Table.Summary.Cell index={4} align="right">
                   <Text strong style={{ color: '#1890ff', fontSize: '14px' }}>
                     {budgetSummary.totalExpense.toLocaleString()}
                   </Text>
                 </Table.Summary.Cell>
                 <Table.Summary.Cell index={5} align="right">
                   <Text strong style={{ color: '#ff4d4f', fontSize: '14px' }}>
                     {budgetSummary.actualData ? budgetSummary.actualData.totalActualExpense.toLocaleString() : '-'}
                   </Text>
                 </Table.Summary.Cell>
                 <Table.Summary.Cell index={6} align="right">
                   <Text strong style={{ color: '#1890ff', fontSize: '14px' }}>
                     {budgetSummary.actualData ? 
                       budgetActualService.formatAmount(budgetSummary.actualData.totalActualExpense - budgetSummary.totalExpense, true) : '-'}
                   </Text>
                 </Table.Summary.Cell>
               </Table.Summary.Row>
             )}
          />
      </Card>

      {/* 预算执行监控 */}
      <Card title="III. 预算执行监控 (Budget Execution Monitoring)">
        <Collapse>
          <Panel header="收入分类详情" key="income-details">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="会员费收入"
                    value={budgetSummary.incomeCategories.membership}
                    suffix="RM"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  {budgetSummary.actualData && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        实际: {actualData.find(d => d.budgetSubCategory === 'membership_subscription')?.actualIncome.toLocaleString() || 0} RM
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="外部资助"
                    value={budgetSummary.incomeCategories.externalFunding}
                    suffix="RM"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  {budgetSummary.actualData && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        实际: {actualData.find(d => d.budgetSubCategory === 'external_funding')?.actualIncome.toLocaleString() || 0} RM
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="项目盈余"
                    value={budgetSummary.incomeCategories.projectSurplus}
                    suffix="RM"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  {budgetSummary.actualData && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        实际: {(actualData.find(d => d.budgetSubCategory === 'project_surplus')?.actualIncome || 0) + 
                               (actualData.find(d => d.budgetSubCategory === 'project_floating_funds')?.actualIncome || 0)} RM
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="其他收入"
                    value={budgetSummary.incomeCategories.otherIncome}
                    suffix="RM"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  {budgetSummary.actualData && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        实际: {actualData.find(d => d.budgetSubCategory === 'other_income')?.actualIncome.toLocaleString() || 0} RM
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </Panel>
          
          <Panel header="支出分类详情" key="expense-details">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="行政费用"
                    value={budgetSummary.expenseCategories.administrative}
                    suffix="RM"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                  {budgetSummary.actualData && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        实际: {actualData.find(d => d.budgetSubCategory === 'administrative_management')?.actualExpense.toLocaleString() || 0} RM
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="项目支出"
                    value={budgetSummary.expenseCategories.projects}
                    suffix="RM"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                  {budgetSummary.actualData && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        实际: {actualData.find(d => d.budgetSubCategory === 'projects')?.actualExpense.toLocaleString() || 0} RM
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="大会接待"
                    value={budgetSummary.expenseCategories.convention}
                    suffix="RM"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                  {budgetSummary.actualData && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        实际: {actualData.find(d => d.budgetSubCategory === 'convention_reception')?.actualExpense.toLocaleString() || 0} RM
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="商品采购"
                    value={budgetSummary.expenseCategories.merchandise}
                    suffix="RM"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                  {budgetSummary.actualData && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        实际: {actualData.find(d => d.budgetSubCategory === 'merchandise')?.actualExpense.toLocaleString() || 0} RM
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </Panel>

          <Panel header="偏差分析 (Variance Analysis)" key="variance-analysis">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message="预算执行状态总览"
                  description={
                    budgetSummary.actualData ? (
                      <div>
                        <p>整体预算执行偏差: {budgetActualService.formatPercentage(budgetSummary.actualData.overallVariancePercentage)}</p>
                        <p>预算执行评级: {
                          Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 5 ? '优秀 (Excellent)' :
                          Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 15 ? '良好 (Good)' :
                          Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 30 ? '需关注 (Attention Required)' : '严重偏差 (Critical Variance)'
                        }</p>
                        <p>实际净盈余: {budgetSummary.actualData.netActual.toLocaleString()} RM (预算: {budgetSummary.netSurplus.toLocaleString()} RM)</p>
                      </div>
                    ) : '正在加载实际数据...'
                  }
                  type={budgetSummary.actualData ? 
                    (Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 5 ? 'success' :
                     Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 15 ? 'info' :
                     Math.abs(budgetSummary.actualData.overallVariancePercentage) <= 30 ? 'warning' : 'error') : 'info'}
                  icon={<WarningOutlined />}
                  style={{ marginBottom: 16 }}
                />
              </Col>
            </Row>
            
            <Row gutter={[16, 16]}>
              {actualData.map((data, index) => (
                <Col span={8} key={index}>
                  <Card size="small" title={data.budgetSubCategory}>
                    <Statistic
                      title="预算金额"
                      value={data.budgetedAmount}
                      suffix="RM"
                      valueStyle={{ color: '#1890ff' }}
                    />
                    <Statistic
                      title={data.budgetCategory === 'income' ? '实际收入' : '实际支出'}
                      value={data.budgetCategory === 'income' ? data.actualIncome : data.actualExpense}
                      suffix="RM"
                      valueStyle={{ color: data.budgetCategory === 'income' ? '#52c41a' : '#ff4d4f' }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        偏差: {budgetActualService.formatAmount(data.variance, true)} RM
                      </Text>
                      <br />
                      <Text 
                        type="secondary" 
                        style={{ 
                          fontSize: '12px',
                          color: budgetActualService.getBudgetExecutionStatus(data.variancePercentage).color
                        }}
                      >
                        {budgetActualService.formatPercentage(data.variancePercentage)}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Panel>
        </Collapse>
      </Card>

      {/* BudgetModal */}
      <BudgetModal
        visible={isBudgetModalVisible}
        mode={budgetModalMode}
        budget={selectedBudget}
        onOk={handleBudgetModalOk}
        onCancel={handleBudgetModalCancel}
        loading={loading}
        selectedYear={selectedYear}
      />
    </div>
  );
};

export default JCIBudgetTable;
