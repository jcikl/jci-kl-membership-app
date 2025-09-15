import { awardDataMigration } from './awardDataMigration';
import { dataValidator } from '@/utils/dataValidator';
import { awardIndicatorService } from '@/services/awardIndicatorService';

interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  duration: number;
  details?: any;
}

class MigrationTester {
  private results: TestResult[] = [];

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('开始运行迁移测试...');
    this.results = [];

    try {
      // 1. 测试数据迁移
      await this.testDataMigration();
      
      // 2. 测试数据验证
      await this.testDataValidation();
      
      // 3. 测试数据完整性
      await this.testDataIntegrity();
      
      // 4. 测试回滚功能
      await this.testRollback();
      
      // 5. 测试性能
      await this.testPerformance();

      console.log('所有测试完成');
      return this.results;

    } catch (error) {
      console.error('测试过程中发生错误:', error);
      this.addResult('测试执行', false, `测试执行失败: ${error}`, 0);
      return this.results;
    }
  }

  /**
   * 测试数据迁移
   */
  private async testDataMigration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 使用测试年份
      const sourceYear = 2023;
      const targetYear = 2024;

      console.log(`测试数据迁移: ${sourceYear} -> ${targetYear}`);
      
      const result = await awardDataMigration.migrateAllData(sourceYear, targetYear);
      
      const duration = Date.now() - startTime;
      
      if (result.success) {
        this.addResult(
          '数据迁移',
          true,
          `成功迁移 ${result.migratedCount} 个奖励指标`,
          duration,
          { migratedCount: result.migratedCount, errors: result.errors }
        );
      } else {
        this.addResult(
          '数据迁移',
          false,
          `迁移失败: ${result.message}`,
          duration,
          { errors: result.errors }
        );
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        '数据迁移',
        false,
        `迁移测试失败: ${error}`,
        duration
      );
    }
  }

  /**
   * 测试数据验证
   */
  private async testDataValidation(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const targetYear = 2024;
      console.log(`测试数据验证: ${targetYear}`);

      // 获取迁移后的数据
      const awardIndicators = await awardIndicatorService.getAllAwardIndicators(targetYear);
      
      if (awardIndicators.length === 0) {
        this.addResult(
          '数据验证',
          false,
          '没有找到迁移后的数据',
          Date.now() - startTime
        );
        return;
      }

      // 验证数据完整性
      const report = await dataValidator.validateDataIntegrity(awardIndicators);
      
      const duration = Date.now() - startTime;
      
      const hasIssues = report.issues.missingData.length > 0 || 
                       report.issues.invalidData.length > 0 || 
                       report.issues.inconsistentData.length > 0;

      this.addResult(
        '数据验证',
        !hasIssues,
        hasIssues ? '数据验证发现问题' : '数据验证通过',
        duration,
        {
          totalAwardIndicators: report.totalAwardIndicators,
          totalIndicators: report.totalIndicators,
          issues: report.issues,
          recommendations: report.recommendations
        }
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        '数据验证',
        false,
        `验证测试失败: ${error}`,
        duration
      );
    }
  }

  /**
   * 测试数据完整性
   */
  private async testDataIntegrity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const targetYear = 2024;
      console.log(`测试数据完整性: ${targetYear}`);

      const awardIndicators = await awardIndicatorService.getAllAwardIndicators(targetYear);
      
      if (awardIndicators.length === 0) {
        this.addResult(
          '数据完整性',
          false,
          '没有找到数据',
          Date.now() - startTime
        );
        return;
      }

      // 检查数据完整性
      const integrityChecks = {
        hasValidIds: true,
        hasValidTitles: true,
        hasValidYears: true,
        hasValidStatuses: true,
        hasIndicators: true,
        hasSequentialNumbers: true
      };

      let totalIndicators = 0;
      let validIndicators = 0;

      for (const awardIndicator of awardIndicators) {
        // 检查奖励指标完整性
        if (!awardIndicator.id) integrityChecks.hasValidIds = false;
        if (!awardIndicator.title) integrityChecks.hasValidTitles = false;
        if (!awardIndicator.year || awardIndicator.year !== targetYear) integrityChecks.hasValidYears = false;
        if (!awardIndicator.status) integrityChecks.hasValidStatuses = false;
        if (awardIndicator.indicators.length === 0) integrityChecks.hasIndicators = false;

        // 检查指标序号连续性
        const numbers = awardIndicator.indicators.map(ind => ind.no).sort((a, b) => a - b);
        for (let i = 1; i < numbers.length; i++) {
          if (numbers[i] !== numbers[i - 1] + 1) {
            integrityChecks.hasSequentialNumbers = false;
            break;
          }
        }

        totalIndicators += awardIndicator.indicators.length;
        validIndicators += awardIndicator.indicators.filter(ind => 
          ind.id && ind.title && ind.description
        ).length;
      }

      const duration = Date.now() - startTime;
      const allChecksPassed = Object.values(integrityChecks).every(check => check);
      const completenessRate = totalIndicators > 0 ? (validIndicators / totalIndicators) * 100 : 0;

      this.addResult(
        '数据完整性',
        allChecksPassed && completenessRate >= 90,
        `完整性检查${allChecksPassed ? '通过' : '失败'}，完整率: ${completenessRate.toFixed(1)}%`,
        duration,
        {
          integrityChecks,
          totalIndicators,
          validIndicators,
          completenessRate
        }
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        '数据完整性',
        false,
        `完整性测试失败: ${error}`,
        duration
      );
    }
  }

  /**
   * 测试回滚功能
   */
  private async testRollback(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const targetYear = 2024;
      console.log(`测试回滚功能: ${targetYear}`);

      // 先检查是否有数据
      const beforeRollback = await awardIndicatorService.getAllAwardIndicators(targetYear);
      
      if (beforeRollback.length === 0) {
        this.addResult(
          '回滚功能',
          true,
          '没有数据需要回滚',
          Date.now() - startTime
        );
        return;
      }

      // 执行回滚
      const rollbackResult = await awardDataMigration.rollbackMigration(targetYear);
      
      // 检查回滚结果
      const afterRollback = await awardIndicatorService.getAllAwardIndicators(targetYear);
      
      const duration = Date.now() - startTime;
      
      if (rollbackResult.success && afterRollback.length === 0) {
        this.addResult(
          '回滚功能',
          true,
          `成功回滚 ${beforeRollback.length} 个奖励指标`,
          duration,
          { 
            beforeCount: beforeRollback.length, 
            afterCount: afterRollback.length 
          }
        );
      } else {
        this.addResult(
          '回滚功能',
          false,
          `回滚失败: ${rollbackResult.message}`,
          duration,
          { 
            beforeCount: beforeRollback.length, 
            afterCount: afterRollback.length 
          }
        );
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        '回滚功能',
        false,
        `回滚测试失败: ${error}`,
        duration
      );
    }
  }

  /**
   * 测试性能
   */
  private async testPerformance(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('测试性能...');

      const targetYear = 2024;
      
      // 测试数据加载性能
      const loadStartTime = Date.now();
      const awardIndicators = await awardIndicatorService.getAllAwardIndicators(targetYear);
      const loadDuration = Date.now() - loadStartTime;

      // 测试统计计算性能
      const statsStartTime = Date.now();
      const stats = await awardIndicatorService.getAwardIndicatorStats(targetYear);
      const statsDuration = Date.now() - statsStartTime;

      const duration = Date.now() - startTime;

      // 性能基准：加载时间 < 2秒，统计计算 < 1秒
      const loadPerformance = loadDuration < 2000;
      const statsPerformance = statsDuration < 1000;

      this.addResult(
        '性能测试',
        loadPerformance && statsPerformance,
        `加载: ${loadDuration}ms, 统计: ${statsDuration}ms`,
        duration,
        {
          loadDuration,
          statsDuration,
          dataCount: awardIndicators.length,
          totalIndicators: stats.totalIndicators
        }
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult(
        '性能测试',
        false,
        `性能测试失败: ${error}`,
        duration
      );
    }
  }

  /**
   * 添加测试结果
   */
  private addResult(testName: string, success: boolean, message: string, duration: number, details?: any): void {
    const result: TestResult = {
      testName,
      success,
      message,
      duration,
      details
    };
    
    this.results.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message} (${duration}ms)`);
  }

  /**
   * 生成测试报告
   */
  generateReport(): string {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    let report = `
# 迁移测试报告

## 概览
- 总测试数: ${totalTests}
- 通过: ${passedTests}
- 失败: ${failedTests}
- 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%
- 总耗时: ${totalDuration}ms

## 详细结果
`;

    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      report += `
### ${status} ${result.testName}
- 结果: ${result.message}
- 耗时: ${result.duration}ms
`;
      
      if (result.details) {
        report += `- 详情: ${JSON.stringify(result.details, null, 2)}\n`;
      }
    });

    return report;
  }
}

// 导出测试器
export const migrationTester = new MigrationTester();

// 如果直接运行此文件，执行测试
if (typeof window === 'undefined') {
  migrationTester.runAllTests().then(_results => {
    console.log('\n' + migrationTester.generateReport());
  });
}
