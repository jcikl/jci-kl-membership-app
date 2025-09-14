// 测试财务报告生成功能
import { simpleFinancialReportGenerator } from './simpleFinancialReportGenerator';

export const testReportGeneration = async () => {
  try {
    console.log('开始测试财务报告生成...');
    
    // 测试财务状况表
    console.log('测试财务状况表生成...');
    const statementOfFinancialPosition = await simpleFinancialReportGenerator.generateStatementOfFinancialPosition(2024);
    console.log('财务状况表生成成功:', statementOfFinancialPosition);
    
    // 测试损益表
    console.log('测试损益表生成...');
    const incomeStatement = await simpleFinancialReportGenerator.generateIncomeStatement(2024);
    console.log('损益表生成成功:', incomeStatement);
    
    // 测试详细损益表
    console.log('测试详细损益表生成...');
    const detailedIncomeStatement = await simpleFinancialReportGenerator.generateDetailedIncomeStatement(2024);
    console.log('详细损益表生成成功:', detailedIncomeStatement);
    
    // 测试财务报表附注
    console.log('测试财务报表附注生成...');
    const notesToFinancialStatements = await simpleFinancialReportGenerator.generateNotesToFinancialStatements(2024);
    console.log('财务报表附注生成成功:', notesToFinancialStatements);
    
    console.log('所有财务报告生成测试完成！');
    return true;
  } catch (error) {
    console.error('财务报告生成测试失败:', error);
    return false;
  }
};
