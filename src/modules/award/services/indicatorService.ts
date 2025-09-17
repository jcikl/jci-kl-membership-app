import { 
  Indicator, 
  IndicatorCompletion, 
  HistoricalIndicatorComparison,
  CompetitorScoreTracking,
  ActivityParticipationRecord,
  AwardCategory
} from '@/types/awards';
import { db } from '@/services/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

// 指标管理服务类
export class IndicatorService {
  private static instance: IndicatorService;
  
  public static getInstance(): IndicatorService {
    if (!IndicatorService.instance) {
      IndicatorService.instance = new IndicatorService();
    }
    return IndicatorService.instance;
  }

  // ========== 指标管理 ==========

  /**
   * 创建新指标
   */
  async createIndicator(indicator: Omit<Indicator, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'indicators'), {
        ...indicator,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('创建指标失败:', error);
      throw error;
    }
  }

  /**
   * 更新指标
   */
  async updateIndicator(indicatorId: string, updates: Partial<Indicator>): Promise<void> {
    try {
      const indicatorRef = doc(db, 'indicators', indicatorId);
      await updateDoc(indicatorRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('更新指标失败:', error);
      throw error;
    }
  }

  /**
   * 删除指标
   */
  async deleteIndicator(indicatorId: string): Promise<void> {
    try {
      const indicatorRef = doc(db, 'indicators', indicatorId);
      await deleteDoc(indicatorRef);
    } catch (error) {
      console.error('删除指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定年份的指标
   */
  async getIndicatorsByYear(year: number, category?: AwardCategory): Promise<Indicator[]> {
    try {
      let q = query(
        collection(db, 'indicators'),
        where('year', '==', year),
        orderBy('level', 'asc'),
        orderBy('createdAt', 'asc')
      );

      if (category) {
        q = query(q, where('category', '==', category));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Indicator[];
    } catch (error) {
      console.error('获取指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取指标层级结构
   */
  async getIndicatorHierarchy(year: number, category?: AwardCategory): Promise<Indicator[]> {
    try {
      const indicators = await this.getIndicatorsByYear(year, category);
      
      // 构建层级结构
      const hierarchy: Indicator[] = [];
      const indicatorMap = new Map<string, Indicator>();
      
      // 创建指标映射
      indicators.forEach(indicator => {
        indicatorMap.set(indicator.id, { ...indicator, children: [] });
      });
      
      // 构建层级关系
      indicators.forEach(indicator => {
        if (indicator.parentId && indicatorMap.has(indicator.parentId)) {
          const parent = indicatorMap.get(indicator.parentId)!;
          parent.children!.push(indicatorMap.get(indicator.id)!);
        } else {
          hierarchy.push(indicatorMap.get(indicator.id)!);
        }
      });
      
      return hierarchy;
    } catch (error) {
      console.error('获取指标层级失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个指标详情
   */
  async getIndicatorById(indicatorId: string): Promise<Indicator | null> {
    try {
      const indicatorRef = doc(db, 'indicators', indicatorId);
      const indicatorSnap = await getDoc(indicatorRef);
      
      if (indicatorSnap.exists()) {
        return { id: indicatorSnap.id, ...indicatorSnap.data() } as Indicator;
      }
      
      return null;
    } catch (error) {
      console.error('获取指标详情失败:', error);
      throw error;
    }
  }

  // ========== 指标完成记录管理 ==========

  /**
   * 创建指标完成记录
   */
  async createIndicatorCompletion(completion: Omit<IndicatorCompletion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'indicator_completions'), {
        ...completion,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('创建指标完成记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新指标完成记录
   */
  async updateIndicatorCompletion(completionId: string, updates: Partial<IndicatorCompletion>): Promise<void> {
    try {
      const completionRef = doc(db, 'indicator_completions', completionId);
      await updateDoc(completionRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('更新指标完成记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取会员的指标完成情况
   */
  async getMemberIndicatorCompletions(memberId: string, year: number): Promise<IndicatorCompletion[]> {
    try {
      const q = query(
        collection(db, 'indicator_completions'),
        where('memberId', '==', memberId),
        where('year', '==', year),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IndicatorCompletion[];
    } catch (error) {
      console.error('获取会员指标完成情况失败:', error);
      throw error;
    }
  }

  /**
   * 获取指标完成统计
   */
  async getIndicatorCompletionStats(indicatorId: string, year: number): Promise<{
    totalParticipants: number;
    completedParticipants: number;
    averageScore: number;
    completionRate: number;
  }> {
    try {
      const q = query(
        collection(db, 'indicator_completions'),
        where('indicatorId', '==', indicatorId),
        where('year', '==', year)
      );

      const querySnapshot = await getDocs(q);
      const completions = querySnapshot.docs.map(doc => doc.data()) as IndicatorCompletion[];

      const totalParticipants = completions.length;
      const completedParticipants = completions.filter(c => c.status === 'completed').length;
      const averageScore = completions.length > 0 
        ? completions.reduce((sum, c) => sum + c.actualScore, 0) / completions.length 
        : 0;
      const completionRate = totalParticipants > 0 ? (completedParticipants / totalParticipants) * 100 : 0;

      return {
        totalParticipants,
        completedParticipants,
        averageScore,
        completionRate
      };
    } catch (error) {
      console.error('获取指标完成统计失败:', error);
      throw error;
    }
  }

  // ========== 历史指标对比 ==========

  /**
   * 获取历史指标对比数据
   */
  async getHistoricalIndicatorComparison(indicatorId: string, years: number[]): Promise<HistoricalIndicatorComparison | null> {
    try {
      const indicator = await this.getIndicatorById(indicatorId);
      if (!indicator) return null;

      const comparison: HistoricalIndicatorComparison = {
        indicatorId,
        title: indicator.title,
        years: []
      };

      for (const year of years) {
        const stats = await this.getIndicatorCompletionStats(indicatorId, year);
        comparison.years.push({
          year,
          targetScore: indicator.targetScore,
          averageScore: stats.averageScore,
          completionRate: stats.completionRate,
          participantCount: stats.totalParticipants
        });
      }

      return comparison;
    } catch (error) {
      console.error('获取历史指标对比失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有年份的指标列表
   */
  async getAvailableYears(): Promise<number[]> {
    try {
      const q = query(
        collection(db, 'indicators'),
        orderBy('year', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const years = new Set<number>();
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        years.add(data.year);
      });

      return Array.from(years).sort((a, b) => b - a);
    } catch (error) {
      console.error('获取可用年份失败:', error);
      throw error;
    }
  }

  // ========== 竞争对手分数追踪 ==========

  /**
   * 创建竞争对手分数追踪记录
   */
  async createCompetitorTracking(tracking: Omit<CompetitorScoreTracking, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'competitor_tracking'), {
        ...tracking,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('创建竞争对手追踪失败:', error);
      throw error;
    }
  }

  /**
   * 更新竞争对手分数
   */
  async updateCompetitorScore(trackingId: string, updates: Partial<CompetitorScoreTracking>): Promise<void> {
    try {
      const trackingRef = doc(db, 'competitor_tracking', trackingId);
      await updateDoc(trackingRef, {
        ...updates,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('更新竞争对手分数失败:', error);
      throw error;
    }
  }

  /**
   * 获取竞争对手追踪列表
   */
  async getCompetitorTrackingList(year: number, category?: AwardCategory): Promise<CompetitorScoreTracking[]> {
    try {
      let q = query(
        collection(db, 'competitor_tracking'),
        where('year', '==', year),
        orderBy('totalScore', 'desc')
      );

      if (category) {
        q = query(q, where('category', '==', category));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompetitorScoreTracking[];
    } catch (error) {
      console.error('获取竞争对手追踪列表失败:', error);
      throw error;
    }
  }

  // ========== 活动参与记录管理 ==========

  /**
   * 创建活动参与记录
   */
  async createActivityParticipation(participation: Omit<ActivityParticipationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'activity_participations'), {
        ...participation,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('创建活动参与记录失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建活动参与记录
   */
  async createBulkActivityParticipation(participations: Omit<ActivityParticipationRecord, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    try {
      const batch = participations.map(participation => 
        addDoc(collection(db, 'activity_participations'), {
          ...participation,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      );

      const results = await Promise.all(batch);
      return results.map(result => result.id);
    } catch (error) {
      console.error('批量创建活动参与记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取会员的活动参与记录
   */
  async getMemberActivityParticipations(memberId: string, year: number): Promise<ActivityParticipationRecord[]> {
    try {
      const q = query(
        collection(db, 'activity_participations'),
        where('memberId', '==', memberId),
        where('year', '==', year),
        orderBy('participationDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityParticipationRecord[];
    } catch (error) {
      console.error('获取会员活动参与记录失败:', error);
      throw error;
    }
  }

  /**
   * 自动更新指标分数（基于活动参与记录）
   */
  async autoUpdateIndicatorScores(memberId: string, year: number): Promise<void> {
    try {
      const participations = await this.getMemberActivityParticipations(memberId, year);
      const indicators = await this.getIndicatorsByYear(year);
      
      // 按指标分组参与记录
      const participationByIndicator = new Map<string, ActivityParticipationRecord[]>();
      participations.forEach(participation => {
        const existing = participationByIndicator.get(participation.indicatorId) || [];
        existing.push(participation);
        participationByIndicator.set(participation.indicatorId, existing);
      });

      // 更新每个指标的完成情况
      for (const [indicatorId, records] of participationByIndicator) {
        const indicator = indicators.find(i => i.id === indicatorId);
        if (!indicator) continue;

        const totalScore = records.reduce((sum, record) => sum + record.score + (record.bonusScore || 0), 0);
        const participationCount = records.length;
        const attendanceCount = records.filter(r => r.participationType === 'attended').length;

        // 检查是否已存在完成记录
        const existingCompletions = await this.getMemberIndicatorCompletions(memberId, year);
        const existingCompletion = existingCompletions.find(c => c.indicatorId === indicatorId);

        if (existingCompletion) {
          // 更新现有记录
          await this.updateIndicatorCompletion(existingCompletion.id, {
            actualScore: totalScore,
            participationCount,
            attendanceCount,
            status: totalScore >= indicator.targetScore ? 'completed' : 'in_progress'
          });
        } else {
          // 创建新记录
          await this.createIndicatorCompletion({
            indicatorId,
            memberId,
            year,
            actualScore: totalScore,
            participationCount,
            attendanceCount,
            status: totalScore >= indicator.targetScore ? 'completed' : 'in_progress',
            evidence: records.flatMap(r => r.evidence || [])
          });
        }
      }
    } catch (error) {
      console.error('自动更新指标分数失败:', error);
      throw error;
    }
  }

  /**
   * 手动更新指标分数（开发者专用）
   */
  async manualUpdateIndicatorScore(
    memberId: string, 
    indicatorId: string, 
    year: number, 
    score: number, 
    notes?: string,
    updatedBy?: string
  ): Promise<void> {
    try {
      const existingCompletions = await this.getMemberIndicatorCompletions(memberId, year);
      const existingCompletion = existingCompletions.find(c => c.indicatorId === indicatorId);

      const indicator = await this.getIndicatorById(indicatorId);
      if (!indicator) throw new Error('指标不存在');

      if (existingCompletion) {
        await this.updateIndicatorCompletion(existingCompletion.id, {
          actualScore: score,
          status: score >= indicator.targetScore ? 'completed' : 'in_progress',
          notes: notes || existingCompletion.notes,
          reviewedBy: updatedBy,
          reviewedAt: new Date().toISOString()
        });
      } else {
        await this.createIndicatorCompletion({
          indicatorId,
          memberId,
          year,
          actualScore: score,
          participationCount: 0,
          attendanceCount: 0,
          status: score >= indicator.targetScore ? 'completed' : 'in_progress',
          notes,
          reviewedBy: updatedBy,
          reviewedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('手动更新指标分数失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const indicatorService = IndicatorService.getInstance();
