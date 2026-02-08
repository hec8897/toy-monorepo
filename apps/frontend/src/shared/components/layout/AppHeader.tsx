'use client';

import { useRouter } from 'next/navigation';

import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Layout, Space, Typography } from 'antd';

import { ROUTES } from '@/shared/config/navigation';
import { useAuthStore } from '@/shared/stores/authStore';

const { Header } = Layout;

interface AppHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AppHeader({ collapsed, onToggleCollapse }: AppHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.LOGIN);
  };

  const dropdownItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Space>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
        />
        <Typography.Title level={4} style={{ margin: 0 }}>
          Toy Monorepo
        </Typography.Title>
      </Space>

      {user && (
        <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <UserOutlined />
            <Typography.Text>{user.name}</Typography.Text>
          </Space>
        </Dropdown>
      )}
    </Header>
  );
}
