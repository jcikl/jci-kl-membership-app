import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  Space,
  message,
  Card,
  Row,
  Col,
  Typography,
  Switch,
  Tag,
  Input,
  Spin,
  Empty
} from 'antd';
import { 
  EditOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { positionService, PositionAssignmentOptions } from '@/services/positionService';
import { getMembers } from '@/services/memberService';
import { getChapterSettings } from '@/services/chapterSettingsService';
import { MemberPosition, JCIPosition } from '@/types/rbac';
import { JCI_POSITION_OPTIONS } from '@/types/rbac';
import { Member } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useIsAdmin } from '@/hooks/usePermissions';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// 理事职位顺序
const BOARD_POSITION_ORDER = [
  'president',                    // 会长
  'mentor',                      // 辅导会长
  'legal_advisor',               // 法律顾问
  'secretary',                   // 秘书
  'treasurer',                   // 财政
  'acting_president',            // 署理会长
  'vp_personal_development',     // 个人发展副会长
  'vp_business_development',     // 商业发展副会长
  'vp_community_development',    // 社区发展副会长
  'vp_international_development', // 国际发展副会长
  'vp_chapter_management'        // 分会管理副会长
];

// 干部职位顺序
const CADRE_POSITION_ORDER = [
  'president_cadre',                    // 会长干部
  'mentor_cadre',                      // 辅导会长干部
  'legal_advisor_cadre',               // 法律顾问干部
  'secretary_cadre',                   // 秘书干部
  'treasurer_cadre',                   // 财政干部
  'acting_president_cadre',            // 署理会长干部
  'vp_personal_development_cadre',     // 个人发展副会长干部
  'vp_business_development_cadre',     // 商业发展副会长干部
  'vp_community_development_cadre',    // 社区发展副会长干部
  'vp_international_development_cadre', // 国际发展副会长干部
  'vp_chapter_management_cadre'        // 分会管理副会长干部
];

const PositionManagement: React.FC = () => {
  const [positions, setPositions] = useState<MemberPosition[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [chapterSettings, setChapterSettings] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPosition, setEditingPosition] = useState<MemberPosition | null>(null);
  const [form] = Form.useForm();
  const [searchText] = useState('');
  
  // 理事团弹窗状态
  const [positionAssignModalVisible, setPositionAssignModalVisible] = useState(false);
  const [selectedYearForAssign, setSelectedYearForAssign] = useState<string>('');
  
  // 年份卡片状态管理
  const [editingYears, setEditingYears] = useState<Set<string>>(new Set());
  const [yearEditData, setYearEditData] = useState<Record<string, {
    boardPositions: Array<{
      memberId: string;
      position: JCIPosition;
      isActing?: boolean;
      actingFor?: JCIPosition;
    }>;
    cadrePositions: Array<{
      memberIds: string[];
      position: JCIPosition;
    }>;
  }>>({});
  
  const { member } = useAuthStore();
  const { isAdmin } = useIsAdmin();

  // 加载职位列表
  const loadPositions = async () => {
    setLoading(true);
    try {
      const data = await positionService.getAllPositions();
      setPositions(data);
      
    } catch (error) {
      message.error('加载职位列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载会员列表
  const loadMembers = async () => {
    try {
      const response = await getMembers({ page: 1, limit: 1000 }); // 获取所有会员
      setMembers(response.data);
    } catch (error) {
      console.error('加载会员列表失败:', error);
    }
  };

  // 加载分会设置
  const loadChapterSettings = async () => {
    try {
      const settings = await getChapterSettings();
      setChapterSettings(settings);
    } catch (error) {
      console.error('加载分会设置失败:', error);
    }
  };


  useEffect(() => {
    const loadData = async () => {
      await loadPositions();
      await loadMembers();
      await loadChapterSettings();
    };
    
    loadData();
  }, []);

  // 处理保存职位
  const handleSave = async (values: any) => {
    try {
      // 验证当前用户
      if (!member?.id) {
        message.error('请先登录');
        return;
      }

      // 验证必填字段
      if (!values.memberId || !values.position) {
        message.error('请填写所有必填字段');
        return;
      }

      // 验证日期
      if (values.endDate && values.startDate && values.endDate.isBefore(values.startDate)) {
        message.error('结束日期不能早于开始日期');
        return;
      }

      const options: PositionAssignmentOptions = {
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
        isActing: values.isActing || false,
        actingFor: values.actingFor,
        assignedBy: member.id
      };

      if (editingPosition) {
        // 更新现有职位
        await positionService.updatePosition(editingPosition.id, {
          endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
          isActing: values.isActing || false,
          actingFor: values.actingFor,
          status: 'active'
        });
        message.success('职位更新成功');
      } else {
        // 分配新职位
        await positionService.assignPosition(values.memberId, values.position, options);
        message.success('理事团分配成功');
      }
      
      // 关闭模态框并重置表单
      setModalVisible(false);
      form.resetFields();
      setEditingPosition(null);
      
      // 重新加载职位列表
      await loadPositions();
    } catch (error: any) {
      console.error('保存职位失败:', error);
      
      // 根据错误类型显示不同的错误信息
      if (error.message === '该会员已拥有此职位') {
        message.error('该会员已拥有此职位，请选择其他职位或先结束当前职位');
      } else if (error.message.includes('权限')) {
        message.error('权限不足，无法执行此操作');
      } else {
        message.error(error.message || '保存失败，请重试');
      }
    }
  };

  // 年份卡片管理函数

  const startYearEdit = (year: string) => {
    // 打开理事团弹窗
    setSelectedYearForAssign(year);
    setPositionAssignModalVisible(true);
    
    // 初始化编辑数据
    const yearPositions = positions.filter(position => 
      dayjs(position.startDate).format('YYYY') === year
    );
    
    // 按照指定顺序获取理事职位，未分配的设置为"未分配"
    const boardPositions = BOARD_POSITION_ORDER.map(position => {
      const existingPosition = yearPositions.find(p => p.position === position);
      return {
        memberId: existingPosition ? existingPosition.memberId : '未分配',
        position: position as JCIPosition,
        isActing: existingPosition ? existingPosition.isActing : false,
        actingFor: existingPosition ? existingPosition.actingFor : undefined
      };
    });
    
    // 按照指定顺序获取干部职位，未分配的设置为"未分配"
    const cadrePositions = CADRE_POSITION_ORDER.map(position => {
      const existingPositions = yearPositions.filter(p => p.position === position);
      return {
        memberIds: existingPositions.length > 0 ? existingPositions.map(p => p.memberId) : ['未分配'],
        position: position as JCIPosition
      };
    });

    setYearEditData(prev => ({
      ...prev,
      [year]: { boardPositions, cadrePositions }
    }));
  };

  const cancelYearEdit = (year: string) => {
    setEditingYears(prev => {
      const newSet = new Set(prev);
      newSet.delete(year);
      return newSet;
    });
    setYearEditData(prev => {
      const newData = { ...prev };
      delete newData[year];
      return newData;
    });
  };

  // 关闭理事团弹窗
  const closePositionAssignModal = () => {
    setPositionAssignModalVisible(false);
    setSelectedYearForAssign('');
  };

  // 保存理事团分配
  const savePositionAssignments = async () => {
    if (!selectedYearForAssign) return;
    
    if (!member?.id) {
      message.error('请先登录');
      return;
    }
    
    const year = selectedYearForAssign;
    const editData = yearEditData[year];
    
    if (!editData) {
      message.error('编辑数据不存在');
      return;
    }

    try {
      setLoading(true);

      // 验证同一会员不能担任多个理事职位
      const boardMemberIds = editData.boardPositions
        .filter(p => p.memberId && p.memberId !== '未分配')
        .map(p => p.memberId);
      
      const duplicateBoardMembers = boardMemberIds.filter((id, index) => 
        boardMemberIds.indexOf(id) !== index
      );
      
      if (duplicateBoardMembers.length > 0) {
        const duplicateMembers = duplicateBoardMembers.map(id => 
          members.find(m => m.id === id)?.name || id
        );
        message.error(`以下会员在同一年份不能担任多个理事职位：${duplicateMembers.join('、')}`);
        return;
      }

      // 验证同一会员不能担任多个干部职位
      const cadreMemberIds = editData.cadrePositions
        .flatMap(p => p.memberIds.filter(id => id !== '未分配'));
      
      const duplicateCadreMembers = cadreMemberIds.filter((id, index) => 
        cadreMemberIds.indexOf(id) !== index
      );
      
      if (duplicateCadreMembers.length > 0) {
        const duplicateMembers = duplicateCadreMembers.map(id => 
          members.find(m => m.id === id)?.name || id
        );
        message.error(`以下会员在同一年份不能担任多个干部职位：${duplicateMembers.join('、')}`);
        return;
      }

      // 验证同一会员不能同时担任理事和干部职位
      const allMemberIds = [...boardMemberIds, ...cadreMemberIds];
      const duplicateMembers = allMemberIds.filter((id, index) => 
        allMemberIds.indexOf(id) !== index
      );
      
      if (duplicateMembers.length > 0) {
        const duplicateMemberNames = duplicateMembers.map(id => 
          members.find(m => m.id === id)?.name || id
        );
        message.error(`以下会员不能同时担任理事和干部职位：${duplicateMemberNames.join('、')}`);
        return;
      }

      // 删除该年份的所有现有职位
      const yearPositions = positions.filter(position => 
        dayjs(position.startDate).format('YYYY') === year
      );
      
      for (const position of yearPositions) {
        await positionService.deletePosition(position.id);
      }

      // 添加新的理事团分配
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // 理事职位
      for (const assignment of editData.boardPositions) {
        if (assignment.memberId && assignment.memberId !== '未分配') {
          const options: PositionAssignmentOptions = {
            startDate,
            endDate,
            isActing: assignment.isActing || false,
            assignedBy: member.id
          };
          
          if (assignment.actingFor) {
            options.actingFor = assignment.actingFor;
          }

          await positionService.assignPosition(assignment.memberId, assignment.position, options);
        }
      }

      // 干部职位
      for (const assignment of editData.cadrePositions) {
        if (assignment.memberIds && assignment.memberIds.length > 0 && !assignment.memberIds.includes('未分配')) {
          for (const memberId of assignment.memberIds) {
            const options: PositionAssignmentOptions = {
              startDate,
              endDate,
              assignedBy: member.id
            };

            await positionService.assignPosition(memberId, assignment.position, options);
          }
        }
      }

      message.success('理事团分配保存成功');
      await loadPositions();
      closePositionAssignModal();
    } catch (error) {
      console.error('保存理事团分配失败:', error);
      message.error('保存理事团分配失败');
    } finally {
      setLoading(false);
    }
  };

  const saveYearEdit = async (year: string) => {
    try {
      if (!member?.id) {
        message.error('请先登录');
        return;
      }

      const editData = yearEditData[year];
      if (!editData) return;

      // 验证同一年份同一会员不能担任多个理事职位
      const boardMemberIds = editData.boardPositions
        .filter(pos => pos.memberId && pos.memberId !== '未分配')
        .map(pos => pos.memberId);
      
      const duplicateBoardMembers = boardMemberIds.filter((id, index) => 
        boardMemberIds.indexOf(id) !== index
      );
      
      if (duplicateBoardMembers.length > 0) {
        const duplicateMembers = duplicateBoardMembers.map(id => 
          members.find(m => m.id === id)?.name || id
        );
        message.error(`以下会员在同一年份不能担任多个理事职位：${duplicateMembers.join('、')}`);
        return;
      }

      // 验证同一年份同一会员不能担任多个干部职位
      const cadreMemberIds = editData.cadrePositions
        .flatMap(pos => pos.memberIds)
        .filter(id => id && id !== '未分配');
      
      const duplicateCadreMembers = cadreMemberIds.filter((id, index) => 
        cadreMemberIds.indexOf(id) !== index
      );
      
      if (duplicateCadreMembers.length > 0) {
        const duplicateMembers = duplicateCadreMembers.map(id => 
          members.find(m => m.id === id)?.name || id
        );
        message.error(`以下会员在同一年份不能担任多个干部职位：${duplicateMembers.join('、')}`);
        return;
      }

      // 验证同一会员不能同时担任理事和干部职位
      const allMemberIds = [...boardMemberIds, ...cadreMemberIds];
      const duplicateMembers = allMemberIds.filter((id, index) => 
        allMemberIds.indexOf(id) !== index
      );
      
      if (duplicateMembers.length > 0) {
        const duplicateMemberNames = duplicateMembers.map(id => 
          members.find(m => m.id === id)?.name || id
        );
        message.error(`以下会员不能同时担任理事和干部职位：${duplicateMemberNames.join('、')}`);
        return;
      }

      // 删除该年份的所有现有职位
      const yearPositions = positions.filter(position => 
        dayjs(position.startDate).format('YYYY') === year
      );
      
      for (const position of yearPositions) {
        await positionService.deletePosition(position.id);
      }

      // 添加新的理事团分配
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // 理事职位
      for (const assignment of editData.boardPositions) {
        if (assignment.memberId && assignment.memberId !== '未分配') {
          const options: PositionAssignmentOptions = {
            startDate,
            endDate,
            isActing: assignment.isActing || false,
            assignedBy: member.id
          };
          
          if (assignment.actingFor) {
            options.actingFor = assignment.actingFor;
          }
          
          await positionService.assignPosition(assignment.memberId, assignment.position, options);
        }
      }

      // 干部职位
      for (const assignment of editData.cadrePositions) {
        for (const memberId of assignment.memberIds) {
          if (memberId && memberId !== '未分配') {
            const options: PositionAssignmentOptions = {
              startDate,
              endDate,
              isActing: false,
              assignedBy: member.id
            };
            
            await positionService.assignPosition(memberId, assignment.position, options);
          }
        }
      }

      message.success(`${year}年理事团分配保存成功`);
      cancelYearEdit(year);
      loadPositions();
    } catch (error) {
      console.error('保存年份职位失败:', error);
      message.error('保存失败，请重试');
    }
  };

  const handleYearBoardPositionChange = (year: string, index: number, field: string, value: any) => {
    setYearEditData(prev => {
      const yearData = prev[year];
      if (!yearData) return prev;
      
      const newBoardPositions = [...yearData.boardPositions];
      newBoardPositions[index] = { ...newBoardPositions[index], [field]: value };
      
      return {
        ...prev,
        [year]: {
          ...yearData,
          boardPositions: newBoardPositions
        }
      };
    });
  };

  const handleYearCadrePositionChange = (year: string, index: number, field: string, value: any) => {
    setYearEditData(prev => {
      const yearData = prev[year];
      if (!yearData) return prev;
      
      const newCadrePositions = [...yearData.cadrePositions];
      
      // 如果选择了"未分配"，则清空其他选择
      if (value.includes('未分配')) {
        newCadrePositions[index] = { ...newCadrePositions[index], [field]: ['未分配'] };
      } else {
        // 如果选择了其他会员，则移除"未分配"选项
        const filteredValue = value.filter((v: string) => v !== '未分配');
        newCadrePositions[index] = { ...newCadrePositions[index], [field]: filteredValue };
      }
      
      return {
        ...prev,
        [year]: {
          ...yearData,
          cadrePositions: newCadrePositions
        }
      };
    });
  };

  // 验证函数已移除，现在在保存时进行验证


  // 获取会员当前职位信息
  const getMemberCurrentPosition = async (memberId: string) => {
    try {
      const currentPosition = await positionService.getCurrentPosition(memberId);
      return currentPosition;
    } catch (error) {
      console.error('获取会员当前职位失败:', error);
      return null;
    }
  };

  // 处理会员选择变化
  const handleMemberChange = async (memberId: string) => {
    if (memberId) {
      const currentPosition = await getMemberCurrentPosition(memberId);
      if (currentPosition) {
        message.info(`该会员当前职位：${JCI_POSITION_OPTIONS.find(opt => opt.value === currentPosition.position)?.label || currentPosition.position}`);
      }
    }
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingPosition(null);
  };

  // 获取所有年份 - 自动生成从当前年份到创建年份的所有年份
  const getAllYears = () => {
    const currentYear = new Date().getFullYear();
    const foundingYear = chapterSettings?.establishmentYear || 2005;
    
    // 生成从当前年份到创建年份的所有年份
    const allYears: string[] = [];
    for (let year = currentYear; year >= foundingYear; year--) {
      allYears.push(year.toString());
    }
    
    return allYears;
  };

  // 过滤职位
  const filteredPositions = positions.filter(position => {
    const matchesSearch = !searchText || 
      position.memberId.toLowerCase().includes(searchText.toLowerCase()) ||
      position.position.toLowerCase().includes(searchText.toLowerCase());
    
    return matchesSearch;
  });

  // 理事团职位配置






  // 表格列定义已移除，现在使用卡片式布局

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              职位管理
            </Title>
            <Text type="secondary">
              管理会员的JCI理事团分配和任期
            </Text>
          </Col>
        </Row>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div>
            {getAllYears().length > 0 ? (
              <div>
                {(() => {
                  const years = getAllYears().map(year => parseInt(year)).sort((a, b) => b - a);
                  const currentYear = new Date().getFullYear();
                  
                  // 从分会设置获取成立年份，如果没有分会设置则显示所有年份
                  const foundingYear = chapterSettings?.establishmentYear;
                  const yearGroups = [];
                  
                  // 如果有分会设置，过滤出从成立年份到当前年份的数据；否则显示所有年份
                  const filteredYears = foundingYear ? 
                    years.filter(year => year >= foundingYear && year <= currentYear) : 
                    years;
                  
                  // 第一行：当前年段
                  if (filteredYears.length > 0 && filteredYears[0] === currentYear) {
                    yearGroups.push({
                      title: '当前年段',
                      years: [currentYear],
                      isCurrentYear: true,
                      width: '100%'
                    });
                  }
                  
                  // 后续行：每10年一组
                  for (let i = 1; i < filteredYears.length; i += 10) {
                    const groupYears = filteredYears.slice(i, i + 10);
                    if (groupYears.length > 0) {
                      const startYear = groupYears[groupYears.length - 1];
                      const endYear = groupYears[0];
                      yearGroups.push({
                        title: `${endYear}-${startYear}`,
                        years: groupYears,
                        isCurrentYear: false,
                        width: '10%'
                      });
                    }
                  }
                  
                  return yearGroups.map((group, groupIndex) => (
                    <div key={groupIndex} style={{ marginBottom: 32 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: 16,
                        padding: '12px 16px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px'
                      }}>
                        <Text strong style={{ fontSize: 18, marginRight: 16 }}>
                          {group.title}
                        </Text>
                        <Text type="secondary">
                          {group.years.length} 个年份
                        </Text>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'nowrap', 
                        gap: '8px',
                        justifyContent: groupIndex === 0 ? 'flex-start' : 'flex-start'
                      }}>
                        {group.years.map(year => {
                          const yearPositions = filteredPositions.filter(position => 
                            dayjs(position.startDate).format('YYYY') === year.toString()
                          );
                          
                          // 分离理事职位和干部职位
                          const boardPositions = yearPositions.filter(pos => 
                            !pos.position.includes('_cadre')
                          );
                          const cadrePositions = yearPositions.filter(pos => 
                            pos.position.includes('_cadre')
                          );
                          
                          const isEditing = editingYears.has(year.toString());
                          const currentYearEditData = isEditing ? yearEditData[year.toString()] : null;

                          // 查找会长
                          const presidentPosition = boardPositions.find(pos => pos.position === 'president');
                          const presidentName = presidentPosition ? 
                            members.find(m => m.id === presidentPosition.memberId)?.name || '未分配' : 
                            '未分配';

                          return (
                            <div key={year} style={{
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '16px',
                              border: '1px solid #d9d9d9',
                              borderRadius: '8px',
                              backgroundColor: 'white',
                              flex: group.isCurrentYear ? 'none' : '1',
                              minWidth: group.isCurrentYear ? '100%' : '0'
                            }}>
                              {/* 标题和会长信息 */}
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center',
                                marginBottom: '12px'
                              }}>
                                <Text strong style={{ fontSize: group.isCurrentYear ? 18 : 16, marginBottom: '8px' }}>
                                  {year}年理事团
                                </Text>
                                
                                {/* 会长头像 - 蓝色圆圈 */}
                                <div style={{
                                  width: group.isCurrentYear ? '60px' : '50px',
                                  height: group.isCurrentYear ? '60px' : '50px',
                                  borderRadius: '50%',
                                  backgroundColor: '#1890ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: group.isCurrentYear ? '18px' : '14px',
                                  fontWeight: 'bold',
                                  position: 'relative',
                                  marginBottom: '8px'
                                }}>
                                  {presidentName !== '未分配' ? 
                                    presidentName.charAt(0) : 
                                    '未'
                                  }
                                  {/* 编辑按钮 */}
                                  <div style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-8px',
                                    zIndex: 10
                                  }}>
                                    {!isEditing ? (
                                      <Button
                                        type="primary"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => { if (!isAdmin) { message.error('您没有权限进行该操作'); return; } startYearEdit(year.toString()); }}
                                        style={{
                                          width: '24px',
                                          height: '24px',
                                          borderRadius: '50%',
                                          padding: 0,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                        disabled={!isAdmin}
                                      />
                                    ) : (
                                      <Space size="small">
                                        <Button
                                          type="primary"
                                          size="small"
                                          icon={<SaveOutlined />}
                                          onClick={() => { if (!isAdmin) { message.error('您没有权限进行该操作'); return; } saveYearEdit(year.toString()); }}
                                          style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                          disabled={!isAdmin}
                                        />
                                        <Button
                                          size="small"
                                          icon={<CloseOutlined />}
                                          onClick={() => cancelYearEdit(year.toString())}
                                          style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        />
                                      </Space>
                                    )}
                                  </div>
                                </div>
                                
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  会长: {presidentName}
                                </Text>
                              </div>
                              
                              {/* 职位信息 */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                
                                {/* 职位统计 */}
                                <div style={{ marginBottom: 8 }}>
                                  <Space size="small">
                                    <Tag color="blue">
                                      理事: {boardPositions.length}
                                    </Tag>
                                    <Tag color="green">
                                      干部: {cadrePositions.length}
                                    </Tag>
                                  </Space>
                                </div>
                                
                                {/* 详细职位信息 - 仅当前年段显示 */}
                                {group.isCurrentYear && (
                                  <div style={{ marginTop: 12 }}>
                                    {isEditing && currentYearEditData ? (
                                      // 编辑模式 - 参考图片布局
                                      <div>
                                        {/* 理事团职位 - 单行布局（包含会长） */}
                                        <div style={{ marginBottom: 12 }}>
                                          <div style={{ 
                                            display: 'flex', 
                                            flexWrap: 'nowrap',
                                            gap: '8px',
                                            paddingBottom: '8px',
                                            width: '100%'
                                          }}>
                                            {[
                                              { position: 'president', label: '会长' },
                                              { position: 'mentor', label: '辅导会长' },
                                              { position: 'legal_advisor', label: '法律顾问' },
                                              { position: 'secretary', label: '秘书' },
                                              { position: 'treasurer', label: '财政' },
                                              { position: 'acting_president', label: '署理会长' },
                                              { position: 'vp_personal_development', label: '个人发展副会长' },
                                              { position: 'vp_business_development', label: '商业发展副会长' },
                                              { position: 'vp_community_development', label: '社区发展副会长' },
                                              { position: 'vp_international_development', label: '国际发展副会长' },
                                              { position: 'vp_chapter_management', label: '分会管理副会长' }
                                            ].map((pos) => {
                                              const editPosition = currentYearEditData.boardPositions.find(p => p.position === pos.position);
                                              const index = currentYearEditData.boardPositions.findIndex(p => p.position === pos.position);
                                              return (
                                                <div key={pos.position} style={{ 
                                                  display: 'flex', 
                                                  flexDirection: 'column',
                                                  gap: '4px',
                                                  padding: '8px 12px',
                                                  backgroundColor: '#f0f8ff',
                                                  borderRadius: '6px',
                                                  border: '1px solid #e6f7ff',
                                                  flex: '1',
                                                  minWidth: '0'
                                                }}>
                                                  <Text style={{ fontSize: 12, textAlign: 'left' }}>{pos.label}</Text>
                                                  <Select
                                                    placeholder="选择会员"
                                                    value={editPosition?.memberId || ''}
                                                    onChange={(value) => handleYearBoardPositionChange(year.toString(), index, 'memberId', value)}
                                                    style={{ width: '100%' }}
                                                    size="small"
                                                    showSearch
                                                    optionFilterProp="children"
                                                    filterOption={(input, option) =>
                                                      String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                                                    }
                                                  >
                                                    <Option value="未分配">未分配</Option>
                                                    {members.map(member => (
                                                      <Option key={member.id} value={member.id}>
                                                        {member.name}
                                                      </Option>
                                                    ))}
                                                  </Select>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* 干部职位 - 单行布局 */}
                                        <div>
                                          <div style={{ 
                                            display: 'flex', 
                                            flexWrap: 'nowrap',
                                            gap: '8px',
                                            paddingBottom: '8px',
                                            width: '100%'
                                          }}>
                                            {[
                                              { position: 'president_cadre', label: '会长干部' },
                                              { position: 'mentor_cadre', label: '辅导会长干部' },
                                              { position: 'legal_advisor_cadre', label: '法律顾问干部' },
                                              { position: 'secretary_cadre', label: '秘书干部' },
                                              { position: 'treasurer_cadre', label: '财政干部' },
                                              { position: 'acting_president_cadre', label: '署理会长干部' },
                                              { position: 'vp_personal_development_cadre', label: '个人发展副会长干部' },
                                              { position: 'vp_business_development_cadre', label: '商业发展副会长干部' },
                                              { position: 'vp_community_development_cadre', label: '社区发展副会长干部' },
                                              { position: 'vp_international_development_cadre', label: '国际发展副会长干部' },
                                              { position: 'vp_chapter_management_cadre', label: '分会管理副会长干部' }
                                            ].map((pos) => {
                                              const editPosition = currentYearEditData.cadrePositions.find(p => p.position === pos.position);
                                              const index = currentYearEditData.cadrePositions.findIndex(p => p.position === pos.position);
                                              return (
                                                <div key={pos.position} style={{ 
                                                  display: 'flex', 
                                                  flexDirection: 'column',
                                                  gap: '4px',
                                                  padding: '8px 12px',
                                                  backgroundColor: '#f6ffed',
                                                  borderRadius: '6px',
                                                  border: '1px solid #d9f7be',
                                                  flex: '1',
                                                  minWidth: '0'
                                                }}>
                                                  <Text style={{ fontSize: 12, textAlign: 'left' }}>{pos.label}</Text>
                                                  <Select
                                                    mode="multiple"
                                                    placeholder="选择会员"
                                                    value={editPosition?.memberIds || []}
                                                    onChange={(value) => handleYearCadrePositionChange(year.toString(), index, 'memberIds', value)}
                                                    style={{ width: '100%' }}
                                                    size="small"
                                                    showSearch
                                                    optionFilterProp="children"
                                                    filterOption={(input, option) =>
                                                      String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                                                    }
                                                  >
                                                    <Option value="未分配">未分配</Option>
                                                    {members.map(member => (
                                                      <Option key={member.id} value={member.id}>
                                                        {member.name}
                                                      </Option>
                                                    ))}
                                                  </Select>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      // 查看模式 - 参考图片布局
                                      <div>

                                        {/* 理事团职位 - 单行布局 */}
                                        <div style={{ marginBottom: 12 }}>
                                          <div style={{ 
                                            display: 'flex', 
                                            flexWrap: 'nowrap',
                                            gap: '8px',
                                            paddingBottom: '8px',
                                            width: '100%'
                                          }}>
                                            {[
                                              { position: 'president', label: '会长' },
                                              { position: 'mentor', label: '辅导会长' },
                                              { position: 'legal_advisor', label: '法律顾问' },
                                              { position: 'secretary', label: '秘书' },
                                              { position: 'treasurer', label: '财政' },
                                              { position: 'acting_president', label: '署理会长' },
                                              { position: 'vp_personal_development', label: '个人发展副会长' },
                                              { position: 'vp_business_development', label: '商业发展副会长' },
                                              { position: 'vp_community_development', label: '社区发展副会长' },
                                              { position: 'vp_international_development', label: '国际发展副会长' },
                                              { position: 'vp_chapter_management', label: '分会管理副会长' }
                                            ].map((pos) => {
                                              const position = boardPositions.find(p => p.position === pos.position);
                                              const member = position ? members.find(m => m.id === position.memberId) : null;
                                              return (
                                                <div key={pos.position} style={{ 
                                                  display: 'flex', 
                                                  flexDirection: 'column',
                                                  gap: '4px',
                                                  padding: '8px 12px',
                                                  backgroundColor: '#f0f8ff',
                                                  borderRadius: '6px',
                                                  border: '1px solid #e6f7ff',
                                                  flex: '1',
                                                  minWidth: '0'
                                                }}>
                                                  <Text style={{ fontSize: 12, textAlign: 'left' }}>{pos.label}</Text>
                                                  <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'left' }}>{member?.name || '未分配'}</Text>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* 干部职位 - 单行布局 */}
                                        <div>
                                          <div style={{ 
                                            display: 'flex', 
                                            flexWrap: 'nowrap',
                                            gap: '8px',
                                            paddingBottom: '8px',
                                            width: '100%'
                                          }}>
                                            {[
                                              { position: 'president_cadre', label: '会长干部' },
                                              { position: 'mentor_cadre', label: '辅导会长干部' },
                                              { position: 'legal_advisor_cadre', label: '法律顾问干部' },
                                              { position: 'secretary_cadre', label: '秘书干部' },
                                              { position: 'treasurer_cadre', label: '财政干部' },
                                              { position: 'acting_president_cadre', label: '署理会长干部' },
                                              { position: 'vp_personal_development_cadre', label: '个人发展副会长干部' },
                                              { position: 'vp_business_development_cadre', label: '商业发展副会长干部' },
                                              { position: 'vp_community_development_cadre', label: '社区发展副会长干部' },
                                              { position: 'vp_international_development_cadre', label: '国际发展副会长干部' },
                                              { position: 'vp_chapter_management_cadre', label: '分会管理副会长干部' }
                                            ].map((pos) => {
                                              const position = cadrePositions.find(p => p.position === pos.position);
                                              const member = position ? members.find(m => m.id === position.memberId) : null;
                                              return (
                                                <div key={pos.position} style={{ 
                                                  display: 'flex', 
                                                  flexDirection: 'column',
                                                  gap: '4px',
                                                  padding: '8px 12px',
                                                  backgroundColor: '#f6ffed',
                                                  borderRadius: '6px',
                                                  border: '1px solid #d9f7be',
                                                  flex: '1',
                                                  minWidth: '0'
                                                }}>
                                                  <Text style={{ fontSize: 12, textAlign: 'left' }}>{pos.label}</Text>
                                                  <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'left' }}>{member?.name || '未分配'}</Text>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <Empty description="暂无理事团分配记录" />
            )}
          </div>
        )}
      </Card>

      <Modal
        title={editingPosition ? '编辑职位' : '分配职位'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          {!editingPosition && (
            <Form.Item
              name="memberId"
              label="选择会员"
              rules={[{ required: true, message: '请选择会员' }]}
            >
              <Select
                placeholder="选择会员"
                showSearch
                optionFilterProp="children"
                onChange={handleMemberChange}
                filterOption={(input, option) =>
                  String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {members.map(member => (
                  <Option key={member.id} value={member.id}>
                    {member.name} ({member.memberId}) - {member.email}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="position"
            label="JCI职位"
            rules={[{ required: true, message: '请选择职位' }]}
          >
            <Select placeholder="选择JCI职位">
              {JCI_POSITION_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>


          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="开始日期"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="结束日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isActing"
            label="是否为代理职位"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="actingFor"
            label="代理职位说明"
          >
            <Input placeholder="如：代理会长" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeModal}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
         </Form>
       </Modal>

       {/* 理事团弹窗 */}
       <Modal
         title={`${selectedYearForAssign}年理事团`}
         open={positionAssignModalVisible}
         onCancel={closePositionAssignModal}
         footer={null}
         width={800}
         destroyOnHidden
       >
         {selectedYearForAssign && yearEditData[selectedYearForAssign] && (
           <div>
              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ color: '#1890ff', fontSize: 16, marginBottom: 16, display: 'block' }}>
                  理事团分配
                </Text>
                
                {/* 理事团职位顺序定义 */}
                {[
                  { board: 'president', cadre: 'president_cadre', label: '会长' },
                  { board: 'mentor', cadre: 'mentor_cadre', label: '辅导会长' },
                  { board: 'legal_advisor', cadre: 'legal_advisor_cadre', label: '法律顾问' },
                  { board: 'secretary', cadre: 'secretary_cadre', label: '秘书' },
                  { board: 'treasurer', cadre: 'treasurer_cadre', label: '财政' },
                  { board: 'acting_president', cadre: 'acting_president_cadre', label: '署理会长' },
                  { board: 'vp_personal_development', cadre: 'vp_personal_development_cadre', label: '个人发展副会长' },
                  { board: 'vp_business_development', cadre: 'vp_business_development_cadre', label: '商业发展副会长' },
                  { board: 'vp_community_development', cadre: 'vp_community_development_cadre', label: '社区发展副会长' },
                  { board: 'vp_international_development', cadre: 'vp_international_development_cadre', label: '国际发展副会长' },
                  { board: 'vp_chapter_management', cadre: 'vp_chapter_management_cadre', label: '分会管理副会长' }
                ].map((positionGroup) => {
                  const boardPosition = yearEditData[selectedYearForAssign].boardPositions.find(pos => pos.position === positionGroup.board);
                  const cadrePosition = yearEditData[selectedYearForAssign].cadrePositions.find(pos => pos.position === positionGroup.cadre);
                  const boardIndex = yearEditData[selectedYearForAssign].boardPositions.findIndex(pos => pos.position === positionGroup.board);
                  const cadreIndex = yearEditData[selectedYearForAssign].cadrePositions.findIndex(pos => pos.position === positionGroup.cadre);
                  
                  return (
                    <div key={positionGroup.board} style={{ 
                      display: 'flex', 
                      marginBottom: 16,
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#fafafa'
                    }}>
                      {/* 左侧：理事团职位 */}
                      <div style={{ 
                        flex: 1, 
                        marginRight: 16,
                        paddingRight: 16,
                        borderRight: '1px solid #e8e8e8'
                      }}>
                        <Text strong style={{ color: '#1890ff', fontSize: 14, marginBottom: 8, display: 'block' }}>
                          {positionGroup.label}
                        </Text>
                        <Select
                          placeholder="选择会员"
                          value={boardPosition?.memberId || ''}
                          onChange={(value) => handleYearBoardPositionChange(selectedYearForAssign, boardIndex, 'memberId', value)}
                          style={{ width: '100%' }}
                          showSearch
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          <Option value="未分配">未分配</Option>
                          {members.map(member => (
                            <Option key={member.id} value={member.id}>
                              {member.name}
                            </Option>
                          ))}
                        </Select>
                      </div>
                      
                      {/* 右侧：对应干部职位 */}
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ color: '#52c41a', fontSize: 14, marginBottom: 8, display: 'block' }}>
                          {positionGroup.label}干部
                        </Text>
                        <Select
                          mode="multiple"
                          placeholder="选择会员（可多选）"
                          value={cadrePosition?.memberIds || []}
                          onChange={(value) => handleYearCadrePositionChange(selectedYearForAssign, cadreIndex, 'memberIds', value)}
                          style={{ width: '100%' }}
                          showSearch
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          <Option value="未分配">未分配</Option>
                          {members.map(member => (
                            <Option key={member.id} value={member.id}>
                              {member.name}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>

             <div style={{ textAlign: 'right', marginTop: 24 }}>
               <Space>
                 <Button onClick={closePositionAssignModal}>
                   取消
                 </Button>
                 <Button 
                   type="primary" 
                   onClick={savePositionAssignments}
                   loading={loading}
                 >
                   保存分配
                 </Button>
               </Space>
             </div>
           </div>
         )}
       </Modal>
     </div>
   );
 };
 
 export default PositionManagement;
