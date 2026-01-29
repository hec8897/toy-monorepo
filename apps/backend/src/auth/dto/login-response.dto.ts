import { LoginResponse } from '@toy-monorepo/types';
import { Role } from '../enums/role.enum';

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
