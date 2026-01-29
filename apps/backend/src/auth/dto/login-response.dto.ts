import { LoginResponse, Role } from '@toy-monorepo/types';

export class LoginResponseDto implements LoginResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    role: Role;
  };

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
