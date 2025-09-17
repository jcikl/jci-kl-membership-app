import { 
  Award, 
  EfficientStarAward, 
  StarPointAward, 
  StarPointManagement,
  StarCategoryType,
  NationalAreaIncentiveAward, 
  EAward,
  EAwardCategory,
  EAwardSubmission,
  AwardScoreRecord,
  AwardStatistics,
  AwardConfiguration,
  AwardCategory,
  Standard
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

  /**
   * 移除对象中的undefined字段 - 安全版本，防止循环引用
   */
  private removeUndefinedFields(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // 对于基本类型，直接返回
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // 对于数组，只过滤undefined元素，不递归
    if (Array.isArray(obj)) {
      return obj.filter(item => item !== undefined);
    }
    
    // 对于对象，只做顶层过滤，不递归处理嵌套对象
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
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
      
      // 清理undefined值
      const cleanAward = this.removeUndefinedFields(award);
      
      if (existingAward) {
        // 更新现有奖励
        const awardRef = doc(db, 'awards', existingAward.id);
        await updateDoc(awardRef, {
          ...cleanAward,
          updatedAt: Timestamp.now()
        });
        return existingAward.id;
      } else {
        // 创建新奖励
        const docRef = await addDoc(collection(db, 'awards'), {
          ...cleanAward,
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
   * 获取指定Star类别的奖励配置
   */
  async getStarPointAward(starType: StarCategoryType, year: number = new Date().getFullYear()): Promise<StarPointAward | null> {
    try {
      const q = query(
        collection(db, 'awards'),
        where('starType', '==', starType),
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
      console.error(`获取${starType}奖励失败:`, error);
      throw error;
    }
  }

  /**
   * 获取指定年份的所有Star Point奖励
   */
  async getAllStarPointAwards(year: number = new Date().getFullYear()): Promise<StarPointAward[]> {
    try {
      const q = query(
        collection(db, 'awards'),
        where('starType', 'in', ['network_star', 'experience_star', 'social_star', 'outreach_star']),
        where('year', '==', year)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StarPointAward));
    } catch (error) {
      console.error('获取所有Star Point奖励失败:', error);
      throw error;
    }
  }

  /**
   * 创建或更新指定Star类别的奖励
   */
  async saveStarPointAward(award: Omit<StarPointAward, 'id'>): Promise<string> {
    try {
      const existingAward = await this.getStarPointAward(award.starType, award.year);
      
      // 清理undefined值
      const cleanAward = this.removeUndefinedFields(award);
      
      if (existingAward) {
        const awardRef = doc(db, 'awards', existingAward.id);
        await updateDoc(awardRef, {
          ...cleanAward,
          updatedAt: Timestamp.now()
        });
        return existingAward.id;
      } else {
        const docRef = await addDoc(collection(db, 'awards'), {
          ...cleanAward,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error(`保存${award.starType}奖励失败:`, error);
      throw error;
    }
  }

  /**
   * 创建或更新Star Point管理配置
   */
  async saveStarPointManagement(management: Omit<StarPointManagement, 'id'>): Promise<string> {
    try {
      const q = query(
        collection(db, 'star_point_management'),
        where('year', '==', management.year),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // 创建新的管理配置
        const docRef = await addDoc(collection(db, 'star_point_management'), {
          ...management,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return docRef.id;
      } else {
        // 更新现有管理配置
        const docRef = doc(db, 'star_point_management', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          ...management,
          updatedAt: Timestamp.now()
        });
        return querySnapshot.docs[0].id;
      }
    } catch (error) {
      console.error('保存Star Point管理配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取Star Point管理配置
   */
  async getStarPointManagement(year: number = new Date().getFullYear()): Promise<StarPointManagement | null> {
    try {
      const q = query(
        collection(db, 'star_point_management'),
        where('year', '==', year),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as unknown as StarPointManagement;
    } catch (error) {
      console.error('获取Star Point管理配置失败:', error);
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
      
      // 清理undefined值
      const cleanAward = this.removeUndefinedFields(award);
      
      if (existingAward) {
        const awardRef = doc(db, 'awards', existingAward.id);
        await updateDoc(awardRef, {
          ...cleanAward,
          updatedAt: Timestamp.now()
        });
        return existingAward.id;
      } else {
        const docRef = await addDoc(collection(db, 'awards'), {
          ...cleanAward,
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
      // 清理undefined值
      const cleanAward = this.removeUndefinedFields(award);
      const docRef = await addDoc(collection(db, 'e_awards'), {
        ...cleanAward,
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
      // 清理undefined值
      const cleanAward = this.removeUndefinedFields(award);
      await updateDoc(awardRef, {
        ...cleanAward,
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
      
      // 清理undefined值
      const cleanAward = this.removeUndefinedFields(award);
      
      if (existingAward) {
        const awardRef = doc(db, 'awards', existingAward.id);
        await updateDoc(awardRef, {
          ...cleanAward,
          updatedAt: Timestamp.now()
        });
        return existingAward.id;
      } else {
        const docRef = await addDoc(collection(db, 'awards'), {
          ...cleanAward,
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

  // ========== 统一的Standards管理 ==========

  /**
   * 获取指定类别和年份的所有standards
   */
  async getStandardsByCategoryAndYear(
    category: StarCategoryType, 
    year: number = new Date().getFullYear()
  ): Promise<Standard[]> {
    try {
      const q = query(
        collection(db, 'standards'),
        where('category', '==', category),
        where('year', '==', year),
        orderBy('no', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Standard));
    } catch (error) {
      console.error('获取standards失败:', error);
      throw error;
    }
  }

  /**
   * 通过document ID获取单个standard
   */
  async getStandardById(standardId: string): Promise<Standard | null> {
    try {
      const docRef = doc(db, 'standards', standardId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Standard;
      } else {
        return null;
      }
    } catch (error) {
      console.error('获取standard失败:', error);
      throw error;
    }
  }

  /**
   * 保存单个standard
   */
  async saveStandard(standard: Omit<Standard, 'id'>): Promise<string> {
    try {
      // 清理undefined值
      const cleanStandard = this.removeUndefinedFields(standard);
      
      const docRef = await addDoc(collection(db, 'standards'), {
        ...cleanStandard,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('保存standard失败:', error);
      throw error;
    }
  }

  /**
   * 更新单个standard
   */
  async updateStandard(standardId: string, updates: Partial<Standard>): Promise<void> {
    try {
      // 清理undefined值
      const cleanUpdates = this.removeUndefinedFields(updates);
      
      const docRef = doc(db, 'standards', standardId);
      await updateDoc(docRef, {
        ...cleanUpdates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('更新standard失败:', error);
      throw error;
    }
  }

  /**
   * 创建或更新standard (upsert)
   */
  async upsertStandard(standard: Standard): Promise<string> {
    try {
      // 清理undefined值
      const cleanStandard = this.removeUndefinedFields(standard);
      
      const docRef = doc(db, 'standards', standard.id);
      
      // 先尝试获取文档
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // 文档存在，更新
        await updateDoc(docRef, {
          ...cleanStandard,
          updatedAt: Timestamp.now()
        });
        return standard.id;
      } else {
        // 文档不存在，创建
        await setDoc(docRef, {
          ...cleanStandard,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return standard.id;
      }
    } catch (error) {
      console.error('upsert standard失败:', error);
      throw error;
    }
  }

  /**
   * 删除单个standard
   */
  async deleteStandard(standardId: string): Promise<void> {
    try {
      const docRef = doc(db, 'standards', standardId);
      await updateDoc(docRef, {
        status: 'deleted',
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('删除standard失败:', error);
      throw error;
    }
  }

  /**
   * 批量保存standards
   */
  async saveStandards(standards: Omit<Standard, 'id'>[]): Promise<string[]> {
    try {
      const batch = [];
      const docRefs = [];
      
      for (const standard of standards) {
        const cleanStandard = this.removeUndefinedFields(standard);
        const docRef = doc(collection(db, 'standards'));
        docRefs.push(docRef.id);
        batch.push({
          ref: docRef,
          data: {
            ...cleanStandard,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          }
        });
      }
      
      // 批量写入
      const promises = batch.map(item => setDoc(item.ref, item.data));
      await Promise.all(promises);
      
      return docRefs;
    } catch (error) {
      console.error('批量保存standards失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有支持的categories
   */
  async getSupportedCategories(): Promise<string[]> {
    try {
      const q = query(
        collection(db, 'standards'),
        orderBy('category', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const categories = new Set<string>();
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });
      
      return Array.from(categories);
    } catch (error) {
      console.error('获取支持的categories失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有可用的年份
   */
  async getAvailableYears(): Promise<number[]> {
    try {
      const q = query(
        collection(db, 'awards'),
        orderBy('year', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const years = new Set<number>();
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.year) {
          years.add(data.year);
        }
      });
      
      return Array.from(years).sort((a, b) => b - a);
    } catch (error) {
      console.error('获取可用年份失败:', error);
      throw error;
    }
  }

  /**
   * 根据指定年份复制创建新年份的奖励数据
   */
  async initializeAwardsFromYear(sourceYear: number, targetYear: number): Promise<void> {
    try {
      // 获取源年份的所有奖励数据
      const sourceAwards = await this.getAllAwardsByYear(sourceYear);
      
      if (sourceAwards.length === 0) {
        throw new Error(`源年份 ${sourceYear} 没有找到奖励数据`);
      }

      // 为每个奖励类型创建新年份的数据
      for (const award of sourceAwards) {
        const baseAward = {
          year: targetYear,
          title: award.title.replace(sourceYear.toString(), targetYear.toString()),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active' as const
        };

        // 根据奖励类型保存
        switch (award.category) {
          case 'efficient_star':
            const efficientStarAward = {
              ...award,
              ...baseAward,
              standards: (award as any).standards || [],
              totalScore: (award as any).totalScore || 0,
              currentScore: 0,
              deadline: (award as any).deadline || '2025-12-31',
              criteria: (award as any).criteria || { tiers: [] }
            };
            await this.saveEfficientStarAward(efficientStarAward as any);
            break;
          case 'star_point':
            // 为每个Star类别创建独立的奖励文档
            const starTypes: StarCategoryType[] = ['network_star', 'experience_star', 'social_star', 'outreach_star'];
            
            for (const starType of starTypes) {
              const starPointAward = {
                ...award,
                ...baseAward,
                category: starType,
                starType: starType,
                standards: (award as any).standards?.filter((s: any) => s.category === starType) || [],
                totalScore: (award as any).totalScore || 0,
                currentScore: 0,
                deadline: (award as any).deadline || '2025-12-31',
                terms: (award as any).terms || []
              };
              await this.saveStarPointAward(starPointAward as any);
            }
            
            // 创建Star Point管理配置
            const starPointManagement = {
              year: targetYear,
              starCategories: starTypes,
              totalStarScore: (award as any).totalScore || 0,
              currentStarScore: 0,
              deadline: (award as any).deadline || '2025-12-31',
              terms: (award as any).terms || [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await this.saveStarPointManagement(starPointManagement);
            break;
          case 'national_area_incentive':
            const nationalAward = {
              ...award,
              ...baseAward,
              awardCategories: (award as any).awardCategories || []
            };
            await this.saveNationalAreaIncentiveAward(nationalAward as any);
            break;
          case 'e_awards':
            const eAward = {
              ...award,
              ...baseAward,
              submissionPeriod: (award as any).submissionPeriod || { start: '', end: '' },
              requirements: (award as any).requirements || [],
              criteria: (award as any).criteria || [],
              maxScore: (award as any).maxScore || 100,
              minScore: (award as any).minScore || 0,
              categories: (award as any).categories || [],
              createdBy: '',
              updatedBy: ''
            };
            await this.saveEAward(eAward as any);
            break;
        }
      }

      // 复制standards数据
      await this.copyStandardsFromYear(sourceYear, targetYear);

    } catch (error) {
      console.error('从指定年份初始化奖励失败:', error);
      throw error;
    }
  }

  /**
   * 复制指定年份的standards到新年份
   */
  async copyStandardsFromYear(sourceYear: number, targetYear: number): Promise<void> {
    try {
      const q = query(
        collection(db, 'standards'),
        where('year', '==', sourceYear)
      );
      
      const querySnapshot = await getDocs(q);
      const standardsToCopy = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: undefined, // 移除ID
          year: targetYear,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        } as any;
      });

      if (standardsToCopy.length > 0) {
        await this.saveStandards(standardsToCopy);
      }
    } catch (error) {
      console.error('复制standards失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定年份的所有奖励数据
   */
  async getAllAwardsByYear(year: number): Promise<Award[]> {
    try {
      const q = query(
        collection(db, 'awards'),
        where('year', '==', year)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Award));
    } catch (error) {
      console.error('获取指定年份奖励数据失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const awardService = AwardService.getInstance();
