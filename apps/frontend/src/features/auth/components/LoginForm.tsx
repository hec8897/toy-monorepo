'use client';

import { Controller } from 'react-hook-form';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';

import { useLoginForm } from '../hooks/useLoginForm';

const { Title } = Typography;

export function LoginForm() {
  const {
    control,
    onSubmit,
    isSubmitting,
    formState: { errors },
  } = useLoginForm();

  return (
    <Card style={{ width: 400 }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
        Login
      </Title>

      <Form layout="vertical" onFinish={onSubmit}>
        {errors.root && (
          <Form.Item>
            <Alert
              title={errors.root.message}
              type="error"
              showIcon
              style={{ marginBottom: 0 }}
            />
          </Form.Item>
        )}

        <Form.Item
          label="ID"
          validateStatus={errors.username ? 'error' : ''}
          help={errors.username?.message}
        >
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                prefix={<UserOutlined />}
                placeholder="Enter your ID"
                size="large"
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Password"
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
                placeholder="Enter your password"
                size="large"
              />
            )}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            block
            size="large"
          >
            Login
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
