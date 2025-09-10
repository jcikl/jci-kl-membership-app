import React from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { registerUser } from '@/services/authService';
import { RegisterForm } from '@/types';

const { Title, Text } = Typography;

const schema = yup.object({
  email: yup.string().email('请输入有效的邮箱地址').required('请输入邮箱'),
  password: yup.string().min(6, '密码至少6位').required('请输入密码'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], '两次输入的密码不一致')
    .required('请确认密码'),
  name: yup.string().min(2, '姓名至少2个字符').required('请输入姓名'),
  // 允许以 + 开头的国际格式或本地 01 开头（8-11位）
  phone: yup
    .string()
    .matches(/^(\+\d{6,15}|0\d{8,11})$/, '请输入有效的手机号码')
    .required('请输入手机号'),
  memberId: yup.string().min(3, '会员编号至少3位').required('请输入会员编号'),
});

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser(data);
      message.success('注册成功！请登录');
      navigate('/login');
    } catch (error: any) {
      message.error(error.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px 0'
    }}>
      <Card style={{ width: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
            会员注册
          </Title>
          <Text type="secondary">加入超级国际青年商会</Text>
        </div>

        <Form onSubmitCapture={handleSubmit(onSubmit)} layout="vertical">
          <Form.Item
            label="邮箱"
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email?.message}
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<UserOutlined />}
                  placeholder="请输入邮箱"
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="姓名"
            validateStatus={errors.name ? 'error' : ''}
            help={errors.name?.message}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<UserOutlined />}
                  placeholder="请输入真实姓名"
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="手机号"
            validateStatus={errors.phone ? 'error' : ''}
            help={errors.phone?.message}
          >
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<PhoneOutlined />}
                  placeholder="请输入手机号码"
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="会员编号"
            validateStatus={errors.memberId ? 'error' : ''}
            help={errors.memberId?.message}
          >
            <Controller
              name="memberId"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<IdcardOutlined />}
                  placeholder="请输入会员编号"
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="密码"
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password?.message}
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder="请输入密码（至少6位）"
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label="确认密码"
            validateStatus={errors.confirmPassword ? 'error' : ''}
            help={errors.confirmPassword?.message}
          >
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder="请再次输入密码"
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Space>
              <Text>已有账号？</Text>
              <Link to="/login">
                <Button type="link" style={{ padding: 0 }}>
                  立即登录
                </Button>
              </Link>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
