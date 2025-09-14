import { 
  Award, 
  EfficientStarAward, 
  StarPointAward, 
  NationalAreaIncentiveAward, 
  EAward,
  EAwardCategory,
  EAwardSubmission,
  AwardScoreRecord,
  AwardStatistics,
  AwardConfiguration,
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
  setDoc,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';

// 奖励管理服务类
export class AwardService {
  private static instance: AwardService;
  
  public static getInstance(): AwardService {
    if (!AwardService.instance) {
      AwardService.instance = new AwardService();
    }
    return AwardService.instance;
  }

  // ========== Efficient Star 管理 ==========

  /**
   * 获取Efficient Star奖励配置
   */
  async getEfficientStarAward(year: number = new Date().getFullYear()): Promise<EfficientStarAward | null> {
    try {
      const q = query(
        collection(db, 'awards'),
        where('category', '==', 'efficient_star'),
        where('year', '==', year),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as EfficientStarAward;
    } catch (error) {
      console.error('获取Efficient Star奖励失败:', error);
      throw error;
    }
  }

  /**
   * 创建或更新Efficient Star奖励
   */
  async saveEfficientStarAward(award: Omit<EfficientStarAward, 'id'>): Promise<string> {
    try {
      const existingAward = await this.getEfficientStarAward(award.year);
      
      if (existingAward) {
        // 更新现有奖励
        const awardRef = doc(db, 'awards', existingAward.id);
        await updateDoc(awardRef, {
          ...award,
          updatedAt: Timestamp.now()
        });
        return existingAward.id;
      } else {
        // 创建新奖励
        const docRef = await addDoc(collection(db, 'awards'), {
          ...award,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('保存Efficient Star奖励失败:', error);
      throw error;
    }
  }

  /**
   * 更新Efficient Star标准分数
   */
  async updateEfficientStarScore(
    awardId: string, 
    memberId: string, 
    score: number,
    evidence?: string[]
  ): Promise<void> {
    try {
      const scoreRecord: Omit<AwardScoreRecord, 'id'> = {
        awardId,
        memberId,
        score,
        maxScore: 100, // 根据具体标准设定
        percentage: (score / 100) * 100,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        evidence: evidence || []
      };

      await addDoc(collection(db, 'award_scores'), {
        ...scoreRecord,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('更新Efficient Star分数失败:', error);
      throw error;
    }
  }

  // ========== Star Point 管理 ==========

  /**
   * 获取Star Point奖励配置
   */
  async getStarPointAward(year: number = new Date().getFullYear()): Promise<StarPointAward | null> {
    try {
      const q = query(
        collection(db, 'awards'),
        where('category', '==', 'star_point'),
        where('year', '==', year),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as StarPointAward;
    } catch (error) {
      console.error('获取Star Point奖励失败:', error);
      throw error;
    }
  }

  /**
   * 创建或更新Star Point奖励
   */
  async saveStarPointAward(award: Omit<StarPointAward, 'id'>): Promise<string> {
    try {
      const existingAward = await this.getStarPointAward(award.year);
      
      if (existingAward) {
        const awardRef = doc(db, 'awards', existingAward.id);
        await updateDoc(awardRef, {
          ...award,
          updatedAt: Timestamp.now()
        });
        return existingAward.id;
      } else {
        const docRef = await addDoc(collection(db, 'awards'), {
          ...award,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('保存Star Point奖励失败:', error);
      throw error;
    }
  }

  /**
   * 更新Star Point活动分数
   */
  async updateStarPointScore(
    awardId: string,
    memberId: string,
    score: number,
    evidence?: string[]
  ): Promise<void> {
    try {
      const scoreRecord: Omit<AwardScoreRecord, 'id'> = {
        awardId,
        memberId,
        score,
        maxScore: 100,
        percentage: (score / 100) * 100,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        evidence: evidence || []
      };

      await addDoc(collection(db, 'award_scores'), {
        ...scoreRecord,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('更新Star Point分数失败:', error);
      throw error;
    }
  }

  // ========== National & Area Incentive 管理 ==========

  /**
   * 获取National & Area Incentive奖励配置
   */
  async getNationalAreaIncentiveAward(year: number = new Date().getFullYear()): Promise<NationalAreaIncentiveAward | null> {
    try {
      const q = query(
        collection(db, 'awards'),
        where('category', '==', 'national_area_incentive'),
        where('year', '==', year),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as NationalAreaIncentiveAward;
    } catch (error) {
      console.error('获取National & Area Incentive奖励失败:', error);
      throw error;
    }
  }

  /**
   * 创建或更新National & Area Incentive奖励
   */
  async saveNationalAreaIncentiveAward(award: Omit<NationalAreaIncentiveAward, 'id'>): Promise<string> {
    try {
      const existingAward = await this.getNationalAreaIncentiveAward(award.year);
      
      if (existingAward) {
        const awardRef = doc(db, 'awards', existingAward.id);
        await updateDoc(awardRef, {
          ...award,
          updatedAt: Timestamp.now()
        });
        return existingAward.id;
      } else {
        const docRef = await addDoc(collection(db, 'awards'), {
          ...award,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('保存National & Area Incentive奖励失败:', error);
      throw error;
    }
  }

  // ========== E-Awards 管理 ==========

  /**
   * 获取E-Awards奖励配置
   */
  async getEAward(year: number = new Date().getFullYear()): Promise<EAward | null> {
    try {
      const q = query(
        collection(db, 'awards'),
        where('category', '==', 'e_awards'),
        where('year', '==', year),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as EAward;
    } catch (error) {
      console.error('获取E-Awards奖励失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有E-Awards奖励
   */
  async getEAwards(year: number = new Date().getFullYear(), category?: EAwardCategory): Promise<EAward[]> {
    try {
      let q = query(
        collection(db, 'e_awards'),
        where('year', '==', year),
        orderBy('createdAt', 'desc')
      );

      if (category) {
        q = query(q, where('category', '==', category));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EAward[];
    } catch (error) {
      console.error('获取E-Awards列表失败:', error);
      throw error;
    }
  }

  /**
   * 创建E-Award
   */
  async createEAward(award: Omit<EAward, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'e_awards'), {
        ...award,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('创建E-Award失败:', error);
      throw error;
    }
  }

  /**
   * 更新E-Award
   */
  async updateEAward(awardId: string, award: Omit<EAward, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const awardRef = doc(db, 'e_awards', awardId);
      await updateDoc(awardRef, {
        ...award,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('更新E-Award失败:', error);
      throw error;
    }
  }

  /**
   * 删除E-Award
   */
  async deleteEAward(awardId: string): Promise<void> {
    try {
      const awardRef = doc(db, 'e_awards', awardId);
      await updateDoc(awardRef, {
        status: 'deleted',
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('删除E-Award失败:', error);
      throw error;
    }
  }

  /**
   * 获取会员的E-Award提交记录
   */
  async getMemberEAwardSubmissions(memberId: string, year: number = new Date().getFullYear()): Promise<EAwardSubmission[]> {
    try {
      const q = query(
        collection(db, 'e_award_submissions'),
        where('memberId', '==', memberId),
        where('year', '==', year),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EAwardSubmission[];
    } catch (error) {
      console.error('获取会员E-Award提交记录失败:', error);
      throw error;
    }
  }

  /**
   * 创建E-Award提交
   */
  async createEAwardSubmission(submission: Omit<EAwardSubmission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'e_award_submissions'), {
        ...submission,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('创建E-Award提交失败:', error);
      throw error;
    }
  }

  /**
   * 创建或更新E-Awards奖励
   */
  async saveEAward(award: Omit<EAward, 'id'>): Promise<string> {
    try {
      const existingAward = await this.getEAward(award.year);
      
      if (existingAward) {
        const awardRef = doc(db, 'awards', existingAward.id);
        await updateDoc(awardRef, {
          ...award,
          updatedAt: Timestamp.now()
        });
        return existingAward.id;
      } else {
        const docRef = await addDoc(collection(db, 'awards'), {
          ...award,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('保存E-Awards奖励失败:', error);
      throw error;
    }
  }

  // ========== 通用奖励管理 ==========

  /**
   * 获取所有奖励
   */
  async getAllAwards(year?: number): Promise<Award[]> {
    try {
      let q = query(
        collection(db, 'awards'),
        orderBy('createdAt', 'desc')
      );

      if (year) {
        q = query(q, where('year', '==', year));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Award[];
    } catch (error) {
      console.error('获取所有奖励失败:', error);
      throw error;
    }
  }

  /**
   * 获取会员的奖励分数记录
   */
  async getMemberAwardScores(memberId: string): Promise<AwardScoreRecord[]> {
    try {
      let q = query(
        collection(db, 'award_scores'),
        where('memberId', '==', memberId),
        orderBy('submittedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AwardScoreRecord[];
    } catch (error) {
      console.error('获取会员奖励分数失败:', error);
      throw error;
    }
  }

  /**
   * 获取奖励统计信息
   */
  async getAwardStatistics(memberId: string, year?: number): Promise<AwardStatistics> {
    try {
      const scores = await this.getMemberAwardScores(memberId);
      const awards = await this.getAllAwards(year);

      const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
      const averageScore = scores.length > 0 ? totalScore / scores.length : 0;

      const categoryBreakdown = awards.reduce((acc, award) => {
        const categoryScores = scores.filter(score => score.awardId === award.id);
        const categoryScore = categoryScores.reduce((sum, score) => sum + score.score, 0);
        
        acc.push({
          category: award.category as AwardCategory,
          count: categoryScores.length,
          score: categoryScore
        });
        
        return acc;
      }, [] as { category: AwardCategory; count: number; score: number }[]);

      return {
        totalAwards: awards.length,
        activeAwards: awards.filter(award => award.status === 'active').length,
        completedAwards: awards.filter(award => award.status === 'completed').length,
        totalScore,
        averageScore,
        memberRanking: 0, // 需要根据所有会员分数计算排名
        categoryBreakdown
      };
    } catch (error) {
      console.error('获取奖励统计失败:', error);
      throw error;
    }
  }

  /**
   * 审核奖励分数
   */
  async reviewAwardScore(
    scoreId: string, 
    status: 'approved' | 'rejected', 
    reviewerId: string,
    notes?: string
  ): Promise<void> {
    try {
      const scoreRef = doc(db, 'award_scores', scoreId);
      await updateDoc(scoreRef, {
        status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewerId,
        notes: notes || null
      });
    } catch (error) {
      console.error('审核奖励分数失败:', error);
      throw error;
    }
  }

  /**
   * 获取奖励配置
   */
  async getAwardConfiguration(year: number = new Date().getFullYear()): Promise<AwardConfiguration | null> {
    try {
      const docRef = doc(db, 'award_configurations', year.toString());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { year, ...docSnap.data() } as AwardConfiguration;
      }
      
      return null;
    } catch (error) {
      console.error('获取奖励配置失败:', error);
      throw error;
    }
  }

  /**
   * 保存奖励配置
   */
  async saveAwardConfiguration(config: AwardConfiguration): Promise<void> {
    try {
      const docRef = doc(db, 'award_configurations', config.year.toString());
      await setDoc(docRef, config);
    } catch (error) {
      console.error('保存奖励配置失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const awardService = AwardService.getInstance();
