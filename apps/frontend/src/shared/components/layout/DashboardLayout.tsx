'use client';

import { useState } from 'react';

import { Layout } from 'antd';

import { AuthGuard } from '../AuthGuard';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

const { Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const siderWidth = collapsed ? 80 : 200;

  return (
    <AuthGuard>
      <Layout style={{ minHeight: '100vh' }}>
        <AppSidebar collapsed={collapsed} />
        <Layout
          style={{ marginLeft: siderWidth, transition: 'margin-left 0.2s' }}
        >
          <AppHeader
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
          <Content
            style={{
              margin: 24,
              padding: 24,
              background: '#fff',
              borderRadius: 8,
              minHeight: 'calc(100vh - 64px - 48px)',
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </AuthGuard>
  );
}
