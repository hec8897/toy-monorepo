import { LoginResponse } from '@toy-monorepo/types';

export class LoginResponseDto implements LoginResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: 'user' | 'admin';
  };

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
