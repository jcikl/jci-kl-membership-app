// 会员保存功能测试
import { updateMember } from '../services/memberService';
import { getCurrentUser } from '../services/authService';

export const testMemberSave = async () => {
  try {
    console.log('开始测试会员保存功能...');
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log('❌ 用户未登录');
      return;
    }
    
    console.log('✅ 当前用户:', {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName
    });
    
    // 测试更新会员信息 - 已清空
    const testMemberId = 'test-member-id'; // 替换为实际的会员ID
    const testUpdate = {
      name: '',
      phone: '',
      memberId: '',
      profile: {
        fullNameNric: '',
        company: ''
      }
    };
    
    console.log('尝试更新会员信息...');
    console.log('更新数据:', testUpdate);
    
    try {
      await updateMember(testMemberId, testUpdate);
      console.log('✅ 会员信息更新成功');
    } catch (error) {
      console.error('❌ 会员信息更新失败:', error);
      
      // 分析错误原因
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          console.log('🔍 权限错误：可能是 Firestore 规则限制');
        } else if (error.message.includes('not-found')) {
          console.log('🔍 文档不存在：会员ID可能不正确');
        } else {
          console.log('🔍 其他错误:', error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
};

// 检查 Firebase 令牌信息
export const checkFirebaseToken = async () => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log('❌ 用户未登录');
      return;
    }
    
    const tokenResult = await currentUser.getIdTokenResult();
    console.log('Firebase 令牌信息:', {
      email: tokenResult.claims.email,
      role: tokenResult.claims.role,
      admin: tokenResult.claims.admin,
      customClaims: tokenResult.claims
    });
    
  } catch (error) {
    console.error('❌ 获取令牌信息失败:', error);
  }
};

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以通过控制台调用
  (window as any).testMemberSave = testMemberSave;
  (window as any).checkFirebaseToken = checkFirebaseToken;
}
