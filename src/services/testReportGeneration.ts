// 测试财务报告生成功能
import { simpleFinancialReportGenerator } from '@/modules/finance/services/simpleFinancialReportGenerator';

export const testReportGeneration = async () => {
  try {
    // 测试财务状况表
    const statementOfFinancialPosition = await simpleFinancialReportGenerator.generateStatementOfFinancialPosition(2024);
    
    // 测试损益表
    const incomeStatement = await simpleFinancialReportGenerator.generateIncomeStatement(2024);
    
    // 测试详细损益表
    const detailedIncomeStatement = await simpleFinancialReportGenerator.generateDetailedIncomeStatement(2024);
    
    // 测试财务报表附注
    const notesToFinancialStatements = await simpleFinancialReportGenerator.generateNotesToFinancialStatements(2024);
    
    return {
      statementOfFinancialPosition,
      incomeStatement,
      detailedIncomeStatement,
      notesToFinancialStatements
    };
  } catch (error) {
    throw error;
  }
};
