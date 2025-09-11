import { executeAllAutoRules, RuleExecutionResult } from './autoRulesService';

// 定时任务配置
interface SchedulerConfig {
  enabled: boolean;
  interval: number; // 毫秒
  lastExecution?: string;
  nextExecution?: string;
}

// 默认配置
const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: true,
  interval: 24 * 60 * 60 * 1000, // 24小时
};

class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private config: SchedulerConfig = DEFAULT_CONFIG;
  private isRunning = false;

  // 启动定时任务
  start(): void {
    if (this.isRunning) {
      console.log('定时任务已在运行中');
      return;
    }

    if (!this.config.enabled) {
      console.log('定时任务已禁用');
      return;
    }

    this.isRunning = true;
    console.log(`定时任务已启动，间隔: ${this.config.interval / 1000 / 60} 分钟`);

    // 立即执行一次
    this.executeRules();

    // 设置定时器
    this.intervalId = setInterval(() => {
      this.executeRules();
    }, this.config.interval);
  }

  // 停止定时任务
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('定时任务已停止');
  }

  // 执行规则
  private async executeRules(): Promise<void> {
    try {
      console.log('开始执行自动化规则...');
      const results = await executeAllAutoRules();
      
      // 记录执行结果
      this.logExecutionResults(results);
      
      // 更新配置
      this.config.lastExecution = new Date().toISOString();
      this.config.nextExecution = new Date(Date.now() + this.config.interval).toISOString();
      
      console.log('自动化规则执行完成');
    } catch (error) {
      console.error('执行自动化规则失败:', error);
    }
  }

  // 记录执行结果
  private logExecutionResults(results: RuleExecutionResult[]): void {
    const totalAffected = results.reduce((sum, result) => sum + result.affectedMembers, 0);
    const totalSuccess = results.reduce((sum, result) => sum + result.successCount, 0);
    const totalFailed = results.reduce((sum, result) => sum + result.failedCount, 0);

    console.log('=== 自动化规则执行结果 ===');
    console.log(`总影响会员数: ${totalAffected}`);
    console.log(`成功处理: ${totalSuccess}`);
    console.log(`失败处理: ${totalFailed}`);
    
    results.forEach(result => {
      console.log(`- ${result.ruleName}: 影响 ${result.affectedMembers} 个会员，成功 ${result.successCount} 个，失败 ${result.failedCount} 个`);
      if (result.errors.length > 0) {
        console.log(`  错误: ${result.errors.join(', ')}`);
      }
    });
    console.log('========================');
  }

  // 手动执行规则
  async executeNow(): Promise<RuleExecutionResult[]> {
    console.log('手动执行自动化规则...');
    return await executeAllAutoRules();
  }

  // 更新配置
  updateConfig(config: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('定时任务配置已更新:', this.config);
  }

  // 获取当前状态
  getStatus(): {
    isRunning: boolean;
    config: SchedulerConfig;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config
    };
  }

  // 设置执行间隔
  setInterval(interval: number): void {
    this.config.interval = interval;
    console.log(`执行间隔已设置为: ${interval / 1000 / 60} 分钟`);
  }

  // 启用/禁用定时任务
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (enabled && !this.isRunning) {
      this.start();
    } else if (!enabled && this.isRunning) {
      this.stop();
    }
    console.log(`定时任务已${enabled ? '启用' : '禁用'}`);
  }
}

// 创建单例实例
export const schedulerService = new SchedulerService();

// 在应用启动时自动启动定时任务
if (typeof window !== 'undefined') {
  // 浏览器环境
  schedulerService.start();
}

// 导出服务
export default schedulerService;
