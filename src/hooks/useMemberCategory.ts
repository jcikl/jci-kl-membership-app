import { useState, useEffect } from 'react';
import { categoryService } from '@/services/categoryService';
import { MemberCategory } from '@/types/rbac';

export interface UseMemberCategoryResult {
  category: MemberCategory | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useMemberCategory = (memberId: string | undefined): UseMemberCategoryResult => {
  const [category, setCategory] = useState<MemberCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = async () => {
    if (!memberId) {
      setCategory(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await categoryService.getMemberCategory(memberId);
      setCategory(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取会员分类失败');
      console.error('获取会员分类失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, [memberId]);

  return {
    category,
    loading,
    error,
    refetch: fetchCategory
  };
};

export const useAccountType = (memberId: string | undefined) => {
  const { category, loading, error, refetch } = useMemberCategory(memberId);
  
  return {
    accountType: category?.accountType || 'member',
    membershipCategory: category?.membershipCategory,
    loading,
    error,
    refetch
  };
};
