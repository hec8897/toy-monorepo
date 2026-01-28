# Frontend Authentication Implementation Plan

프론트엔드 인증 로직 구현 계획서

## 목표

- 로그인 페이지
- 토큰 저장 로직 (HttpOnly Cookie)
- 유저 리스트 대시보드 (인증 확인용)

---

## Phase 1: 공유 타입 정의

### 파일: `packages/types/src/lib/types.ts`

```typescript
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface Member {
  id: string;
  username: string;
  name: string;
  phone: string;
  role: Role;
  createdAt: string;
}
```

### 파일: `packages/types/src/index.ts`

```typescript
export * from './lib/types';
```

---

## Phase 2: API 클라이언트 설정

### 파일: `apps/frontend/src/lib/api.ts`

```typescript
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 쿠키 자동 전송
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
};

export const membersApi = {
  getAll: () => api.get('/members'),
  getById: (id: string) => api.get(`/members/${id}`),
};
```

---

## Phase 3: Auth Context

### 파일: `apps/frontend/src/contexts/AuthContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginResponse } from '@toy-monorepo/types';
import { authApi } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    const data: LoginResponse = response.data;
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## Phase 4: Root Layout 수정

### 파일: `apps/frontend/src/app/layout.tsx`

```typescript
import './global.css';
import { AuthProvider } from '../contexts/AuthContext';

export const metadata = {
  title: 'Toy Monorepo Frontend',
  description: 'Frontend for toy-monorepo project',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## Phase 5: 로그인 폼 컴포넌트

### 파일: `apps/frontend/src/components/auth/LoginForm.tsx`

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        />
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          cursor: isSubmitting ? 'not-allowed' : 'pointer'
        }}
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## Phase 6: 로그인 페이지

### 파일: `apps/frontend/src/app/login/page.tsx`

```typescript
import { LoginForm } from '../../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh'
    }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
        <h1>Login</h1>
        <LoginForm />
      </div>
    </div>
  );
}
```

---

## Phase 7: 대시보드 페이지

### 파일: `apps/frontend/src/app/dashboard/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Member } from '@toy-monorepo/types';
import { useAuth } from '../../contexts/AuthContext';
import { membersApi } from '../../lib/api';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState('');
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchMembers = async () => {
      try {
        const response = await membersApi.getAll();
        setMembers(response.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout();
          router.push('/login');
        } else {
          setError('Failed to load members');
        }
      } finally {
        setIsLoadingMembers(false);
      }
    };

    if (user) {
      fetchMembers();
    }
  }, [user, isLoading, router, logout]);

  if (isLoading || isLoadingMembers) {
    return <div>Loading...</div>;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div style={{ padding: '20px' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1>Dashboard</h1>
        <div>
          <span style={{ marginRight: '16px' }}>
            Welcome, {user?.name} ({user?.role})
          </span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      <h2>Members List</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Username</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Role</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Phone</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{member.name}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{member.username}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{member.role}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{member.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Phase 8: 백엔드 쿠키 설정 추가

### 파일: `apps/backend/src/auth/auth.controller.ts`

현재 코드:

```typescript
@Post('login')
@HttpCode(HttpStatus.OK)
async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
  return this.authService.login(loginDto);
}
```

수정 코드:

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';

@Post('login')
@HttpCode(HttpStatus.OK)
async login(
  @Body() loginDto: LoginDto,
  @Res({ passthrough: true }) response: Response,
): Promise<LoginResponseDto> {
  const result = await this.authService.login(loginDto);

  response.cookie('access_token', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24시간
  });

  return result;
}
```

---

## 검증 방법

1. 백엔드 실행: `npm run dev:backend`
2. 프론트엔드 실행: `npm run dev:frontend`
3. `http://localhost:3000/login` 접속
4. 로그인 → `/dashboard` 리다이렉트 확인
5. Members 목록 표시 확인
6. 로그아웃 → `/login` 이동 확인

---

## 파일 체크리스트

| Phase | 파일                                              | 작업 |
| ----- | ------------------------------------------------- | ---- |
| 1     | `packages/types/src/lib/types.ts`                 | 생성 |
| 1     | `packages/types/src/index.ts`                     | 수정 |
| 2     | `apps/frontend/src/lib/api.ts`                    | 생성 |
| 3     | `apps/frontend/src/contexts/AuthContext.tsx`      | 생성 |
| 4     | `apps/frontend/src/app/layout.tsx`                | 수정 |
| 5     | `apps/frontend/src/components/auth/LoginForm.tsx` | 생성 |
| 6     | `apps/frontend/src/app/login/page.tsx`            | 생성 |
| 7     | `apps/frontend/src/app/dashboard/page.tsx`        | 생성 |
| 8     | `apps/backend/src/auth/auth.controller.ts`        | 수정 |
