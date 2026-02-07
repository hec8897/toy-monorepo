'use client';

import { usePathname, useRouter } from 'next/navigation';

import { DashboardOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Layout, Menu } from 'antd';

import { ROUTES } from '@/shared/config/navigation';

import type { MenuProps } from 'antd';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

/**
 * 사이드바 메뉴 아이템 정의
 * - key: 라우트 경로 (클릭 시 해당 경로로 이동)
 * - children: 하위 메뉴
 */
const menuItems: MenuItem[] = [
  {
    key: ROUTES.DASHBOARD.ROOT,
    icon: <DashboardOutlined />,
    label: '대시보드',
    children: [
      {
        key: ROUTES.DASHBOARD.OLIVEYOUNG,
        icon: <ShoppingOutlined />,
        label: '올리브영',
      },
    ],
  },
];

/**
 * 현재 경로를 기반으로 선택된 메뉴 키 반환
 * @example '/dashboard/oliveyoung' → ['/dashboard/oliveyoung']
 */
const getSelectedKeys = (pathname: string): string[] => [pathname];

/**
 * 현재 경로를 기반으로 펼쳐질 상위 메뉴 키 반환
 * @example '/dashboard/oliveyoung' → ['/dashboard']
 */
const getOpenKeys = (pathname: string): string[] => {
  const parts = pathname.split('/').filter(Boolean);
  return parts.length >= 1 ? [`/${parts[0]}`] : [];
};

interface AppSidebarProps {
  collapsed: boolean;
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div className="h-16 flex items-center justify-center text-white font-bold">
        <span className={collapsed ? 'text-base' : 'text-lg'}>
          {collapsed ? 'TM' : 'Toy Monorepo'}
        </span>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={getSelectedKeys(pathname)}
        defaultOpenKeys={getOpenKeys(pathname)}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
}
