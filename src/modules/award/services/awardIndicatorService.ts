import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { 
  AwardIndicator, 
  Indicator, 
  CreateAwardIndicatorInput, 
  UpdateAwardIndicatorInput,
  CreateIndicatorInput,
  UpdateIndicatorInput,
  AwardLevel,
  AwardCategoryType,
  AwardIndicatorStats
} from '@/types/awardIndicators';

class AwardIndicatorService {
  private readonly COLLECTIONS = {
    AWARD_INDICATORS: 'award_indicators',
    INDICATORS: 'indicators'
  };

  /**
   * 清理undefined值
   */
  private removeUndefinedFields(obj: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const cleanedNested = this.removeUndefinedFields(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }

  // ========== Award Indicators 管理 ==========

  /**
   * 获取所有奖励指标
   */
  async getAllAwardIndicators(year: number): Promise<AwardIndicator[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.AWARD_INDICATORS),
        where('year', '==', year),
        orderBy('level', 'asc'),
        orderBy('category', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const awardIndicators: AwardIndicator[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const awardIndicatorData = docSnap.data();
        
        // 获取关联的指标
        const indicators = await this.getIndicatorsByAwardIndicatorId(docSnap.id);
        
        awardIndicators.push({
          id: docSnap.id,
          ...awardIndicatorData,
          indicators
        } as AwardIndicator);
      }
      
      return awardIndicators;
    } catch (error) {
      console.error('获取奖励指标失败:', error);
      throw error;
    }
  }

  /**
   * 根据层级获取指标
   */
  async getIndicatorsByLevel(level: AwardLevel, year: number): Promise<AwardIndicator[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.AWARD_INDICATORS),
        where('level', '==', level),
        where('year', '==', year),
        orderBy('category', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const awardIndicators: AwardIndicator[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const awardIndicatorData = docSnap.data();
        
        // 获取关联的指标
        const indicators = await this.getIndicatorsByAwardIndicatorId(docSnap.id);
        
        awardIndicators.push({
          id: docSnap.id,
          ...awardIndicatorData,
          indicators
        } as AwardIndicator);
      }
      
      return awardIndicators;
    } catch (error) {
      console.error(`获取${level}指标失败:`, error);
      throw error;
    }
  }

  /**
   * 根据类别获取指标
   */
  async getIndicatorsByCategory(
    level: AwardLevel, 
    category: AwardCategoryType, 
    year: number
  ): Promise<AwardIndicator | null> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.AWARD_INDICATORS),
        where('level', '==', level),
        where('category', '==', category),
        where('year', '==', year),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const docSnap = querySnapshot.docs[0];
      const awardIndicatorData = docSnap.data();
      
      // 获取关联的指标
      const indicators = await this.getIndicatorsByAwardIndicatorId(docSnap.id);
      
      return {
        id: docSnap.id,
        ...awardIndicatorData,
        indicators
      } as AwardIndicator;
    } catch (error) {
      console.error(`获取${level}-${category}指标失败:`, error);
      throw error;
    }
  }

  /**
   * 保存奖励指标
   */
  async saveAwardIndicator(input: CreateAwardIndicatorInput): Promise<string> {
    try {
      const cleanInput = this.removeUndefinedFields(input);
      
      const docRef = await addDoc(collection(db, this.COLLECTIONS.AWARD_INDICATORS), {
        ...cleanInput,
        indicators: [], // 初始化为空数组
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('保存奖励指标失败:', error);
      throw error;
    }
  }

  /**
   * 更新奖励指标
   */
  async updateAwardIndicator(id: string, input: UpdateAwardIndicatorInput): Promise<void> {
    try {
      const cleanInput = this.removeUndefinedFields(input);
      
      const docRef = doc(db, this.COLLECTIONS.AWARD_INDICATORS, id);
      await updateDoc(docRef, {
        ...cleanInput,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('更新奖励指标失败:', error);
      throw error;
    }
  }

  /**
   * 删除奖励指标
   */
  async deleteAwardIndicator(id: string): Promise<void> {
    try {
      // 先删除关联的指标
      const indicators = await this.getIndicatorsByAwardIndicatorId(id);
      for (const indicator of indicators) {
        await this.deleteIndicator(indicator.id);
      }
      
      // 删除奖励指标
      const docRef = doc(db, this.COLLECTIONS.AWARD_INDICATORS, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('删除奖励指标失败:', error);
      throw error;
    }
  }

  // ========== Indicators 管理 ==========

  /**
   * 根据奖励指标ID获取所有指标
   */
  async getIndicatorsByAwardIndicatorId(awardIndicatorId: string): Promise<Indicator[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.INDICATORS),
        where('awardIndicatorId', '==', awardIndicatorId),
        orderBy('no', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Indicator));
    } catch (error) {
      console.error('获取指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个指标
   */
  async getIndicatorById(id: string): Promise<Indicator | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.INDICATORS, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Indicator;
      } else {
        return null;
      }
    } catch (error) {
      console.error('获取指标失败:', error);
      throw error;
    }
  }

  /**
   * 保存指标
   */
  async saveIndicator(input: CreateIndicatorInput): Promise<string> {
    try {
      const cleanInput = this.removeUndefinedFields(input);
      
      const docRef = await addDoc(collection(db, this.COLLECTIONS.INDICATORS), {
        ...cleanInput,
        myScore: 0,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('保存指标失败:', error);
      throw error;
    }
  }

  /**
   * 更新指标
   */
  async updateIndicator(id: string, input: UpdateIndicatorInput): Promise<void> {
    try {
      const cleanInput = this.removeUndefinedFields(input);
      
      const docRef = doc(db, this.COLLECTIONS.INDICATORS, id);
      await updateDoc(docRef, {
        ...cleanInput,
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
  async deleteIndicator(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.INDICATORS, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('删除指标失败:', error);
      throw error;
    }
  }

  // ========== 统计和分析 ==========

  /**
   * 获取奖励指标统计
   */
  async getAwardIndicatorStats(year: number): Promise<AwardIndicatorStats> {
    try {
      const awardIndicators = await this.getAllAwardIndicators(year);
      
      let totalIndicators = 0;
      let activeIndicators = 0;
      let completedIndicators = 0;
      let totalScore = 0;
      let currentScore = 0;
      
      const categoryBreakdown: { [key: string]: { count: number; score: number } } = {};
      
      for (const awardIndicator of awardIndicators) {
        if (awardIndicator.status === 'active') {
          activeIndicators++;
        }
        
        for (const indicator of awardIndicator.indicators) {
          totalIndicators++;
          totalScore += indicator.score;
          currentScore += indicator.myScore || 0;
          
          if (indicator.status === 'completed') {
            completedIndicators++;
          }
          
          // 按类别统计
          if (!categoryBreakdown[awardIndicator.category]) {
            categoryBreakdown[awardIndicator.category] = { count: 0, score: 0 };
          }
          categoryBreakdown[awardIndicator.category].count++;
          categoryBreakdown[awardIndicator.category].score += indicator.score;
        }
      }
      
      const completionRate = totalIndicators > 0 ? (completedIndicators / totalIndicators) * 100 : 0;
      
      return {
        totalIndicators,
        activeIndicators,
        completedIndicators,
        totalScore,
        currentScore,
        completionRate,
        categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
          category: category as AwardCategoryType,
          count: data.count,
          score: data.score
        }))
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  // ========== 工具方法 ==========

  /**
   * 检查奖励指标是否存在
   */
  async checkAwardIndicatorExists(
    level: AwardLevel, 
    category: AwardCategoryType, 
    year: number
  ): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.AWARD_INDICATORS),
        where('level', '==', level),
        where('category', '==', category),
        where('year', '==', year),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('检查奖励指标存在性失败:', error);
      throw error;
    }
  }

  /**
   * 获取下一个指标序号
   */
  async getNextIndicatorNumber(awardIndicatorId: string): Promise<number> {
    try {
      const indicators = await this.getIndicatorsByAwardIndicatorId(awardIndicatorId);
      if (indicators.length === 0) {
        return 1;
      }
      
      const maxNo = Math.max(...indicators.map(indicator => indicator.no));
      return maxNo + 1;
    } catch (error) {
      console.error('获取下一个指标序号失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const awardIndicatorService = new AwardIndicatorService();
