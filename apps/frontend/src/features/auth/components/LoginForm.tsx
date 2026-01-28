'use client';

import { Form, Input, Button, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Controller } from 'react-hook-form';
import { useLoginForm } from '../hooks/useLoginForm';

const { Title } = Typography;

export function LoginForm() {
  const {
    control,
    onSubmit,
    formState: { errors, isSubmitting },
  } = useLoginForm();

  return (
    <Card style={{ width: 400 }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
        Login
      </Title>

      <Form layout="vertical" onFinish={onSubmit}>
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
