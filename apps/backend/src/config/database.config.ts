import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Member } from '../entities/member.entity';
import { User } from '../entities/user.entity';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  // DATABASE_URL이 있으면 우선 사용
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Member, User],
      synchronize: process.env.NODE_ENV === 'development',
      ssl: { rejectUnauthorized: false }, // Supabase는 SSL 필수
      logging: process.env.NODE_ENV === 'development',
    };
  }

  // DATABASE_URL이 없으면 개별 환경 변수 사용 (기존 방식)
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'postgres',
    entities: [Member, User],
    synchronize: process.env.NODE_ENV === 'development',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    logging: process.env.NODE_ENV === 'development',
  };
};
