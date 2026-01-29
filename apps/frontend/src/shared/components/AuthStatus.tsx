'use client';

import Link from 'next/link';
import { Button, Card, Spin, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'next/navigation';

const { Text, Title } = Typography;

/**
 * 인증 상태를 표시하는 컴포넌트
 * @returns
 */

export function AuthStatus() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Spin size="small" />
          <Text>로그인 상태 확인 중...</Text>
        </Space>
      </Card>
    );
  }

  if (isAuthenticated && user) {
    return (
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <UserOutlined style={{ fontSize: 20 }} />
            <Title level={5} style={{ margin: 0 }}>
              {user.name}님, 환영합니다!
            </Title>
          </Space>
          <Text type="secondary">
            @{user.username} | {user.role}
          </Text>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 24 }}>
      <Space direction="vertical" size="small">
        <Text>로그인이 필요합니다.</Text>
        <Link href="/login">
          <Button type="primary" icon={<LoginOutlined />}>
            로그인
          </Button>
        </Link>
      </Space>
    </Card>
  );
}
