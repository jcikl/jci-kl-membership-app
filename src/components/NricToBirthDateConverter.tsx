import React, { useState } from 'react';
import { Card, Input, Button, Space, message, Typography, Row, Col, Alert, Divider } from 'antd';
import { CalendarOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useMemberStore } from '@/store/memberStore';

const { Title, Text } = Typography;

interface NricToBirthDateConverterProps {
  onClose?: () => void;
}

const NricToBirthDateConverter: React.FC<NricToBirthDateConverterProps> = ({ onClose }) => {
  const [nricInput, setNricInput] = useState('');
  const [convertedDate, setConvertedDate] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { members, updateMemberById } = useMemberStore();

  // 转换NRIC前6位数字为日期
  const convertNricToDate = (nric: string): string | null => {
    if (!nric || nric.length < 6) {
      return null;
    }

    const firstSix = nric.substring(0, 6);
    
    // 检查是否为纯数字
    if (!/^\d{6}$/.test(firstSix)) {
      return null;
    }

    try {
      const year = parseInt(firstSix.substring(0, 2));
      const month = parseInt(firstSix.substring(2, 4));
      const day = parseInt(firstSix.substring(4, 6));

      // 验证日期有效性
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
      }

      // 处理年份：00-30为20XX年，31-99为19XX年
      const fullYear = year <= 30 ? 2000 + year : 1900 + year;

      // 创建日期对象验证
      const date = new Date(fullYear, month - 1, day);
      if (date.getFullYear() !== fullYear || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
      }

      // 格式化为 DD-MMM-YYYY 格式
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const formattedDay = day.toString().padStart(2, '0');
      const formattedMonth = months[month - 1];
      
      return `${formattedDay}-${formattedMonth}-${fullYear}`;
    } catch (error) {
      return null;
    }
  };

  // 处理NRIC转换
  const handleConvert = () => {
    const date = convertNricToDate(nricInput);
    if (date) {
      setConvertedDate(date);
      message.success('NRIC转换成功！');
    } else {
      setConvertedDate('');
      message.error('NRIC格式无效，请检查前6位是否为有效日期');
    }
  };

  // 更新会员生日
  const handleUpdateMember = async () => {
    if (!selectedMemberId || !convertedDate) {
      message.error('请选择会员并确认转换的日期');
      return;
    }

    setLoading(true);
    try {
      const member = members.find(m => m.id === selectedMemberId);
      if (!member) {
        message.error('未找到选中的会员');
        return;
      }

      await updateMemberById(selectedMemberId, {
        profile: {
          ...member.profile,
          birthDate: convertedDate
        }
      });

      message.success(`已成功更新 ${member.name} 的生日为 ${convertedDate}`);
      
      // 清空表单
      setNricInput('');
      setConvertedDate('');
      setSelectedMemberId('');
    } catch (error) {
      message.error('更新失败，请重试');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 批量更新所有会员
  const handleBatchUpdate = async () => {
    if (!convertedDate) {
      message.error('请先转换NRIC为有效日期');
      return;
    }

    const membersToUpdate = members.filter(member => 
      member.profile?.nricOrPassport && 
      !member.profile?.birthDate && // 只更新没有生日日期的会员
      member.profile.nricOrPassport.length >= 6
    );

    if (membersToUpdate.length === 0) {
      message.info('没有找到需要更新的会员');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const member of membersToUpdate) {
        try {
          const memberDate = convertNricToDate(member.profile.nricOrPassport!);
          if (memberDate) {
            await updateMemberById(member.id, {
              profile: {
                ...member.profile,
                birthDate: memberDate
              }
            });
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error(`Failed to update member ${member.name}:`, error);
        }
      }

      message.success(`批量更新完成：成功 ${successCount} 个，失败 ${failCount} 个`);
    } catch (error) {
      message.error('批量更新过程中出现错误');
      console.error('Batch update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={3}>
          <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          NRIC/Passport 转生日日期工具
        </Title>

        <Alert
          message="使用说明"
          description={
            <div>
              <p>此工具用于将NRIC/Passport号码的前6位数字转换为生日日期：</p>
              <ul>
                <li>前2位：年份（00-30为20XX年，31-99为19XX年）</li>
                <li>第3-4位：月份（01-12）</li>
                <li>第5-6位：日期（01-31）</li>
              </ul>
              <p><strong>示例：</strong> 930815 → 15-Aug-1993</p>
            </div>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '24px' }}
        />

        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="单次转换" size="small">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>输入NRIC/Passport号码：</Text>
                  <Input
                    placeholder="输入完整的NRIC或Passport号码"
                    value={nricInput}
                    onChange={(e) => setNricInput(e.target.value)}
                    style={{ marginTop: '8px' }}
                    maxLength={20}
                  />
                </div>

                <Button 
                  type="primary" 
                  onClick={handleConvert}
                  disabled={!nricInput || nricInput.length < 6}
                  icon={<CalendarOutlined />}
                >
                  转换日期
                </Button>

                {convertedDate && (
                  <Alert
                    message={`转换结果：${convertedDate}`}
                    type="success"
                    showIcon
                  />
                )}
              </Space>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="会员选择" size="small">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>选择要更新的会员：</Text>
                  <Input
                    placeholder="输入会员ID或姓名搜索"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    style={{ marginTop: '8px' }}
                  />
                </div>

                <Button 
                  type="primary" 
                  onClick={handleUpdateMember}
                  disabled={!selectedMemberId || !convertedDate}
                  loading={loading}
                  icon={<UserOutlined />}
                >
                  更新会员生日
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={24}>
            <Divider />
            <Card title="批量更新" size="small" style={{ border: '2px dashed #ff7875' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Alert
                  message="批量更新警告"
                  description="此操作将自动为所有没有生日日期的会员从NRIC转换生日日期。请谨慎操作！"
                  type="warning"
                  showIcon
                />

                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">
                    将更新 {members.filter(m => m.profile?.nricOrPassport && !m.profile?.birthDate).length} 个会员
                  </Text>
                </div>

                <Button 
                  type="primary" 
                  danger
                  onClick={handleBatchUpdate}
                  loading={loading}
                  size="large"
                  style={{ width: '100%' }}
                >
                  批量更新所有会员生日
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Button onClick={onClose}>
            关闭工具
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NricToBirthDateConverter;
