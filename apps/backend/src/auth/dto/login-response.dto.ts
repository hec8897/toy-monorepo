import { Role } from '../enums/role.enum';

export class LoginResponseDto {
  accessToken: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: Role;
  };

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
