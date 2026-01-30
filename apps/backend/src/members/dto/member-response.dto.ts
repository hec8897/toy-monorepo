import { Role } from '@toy-monorepo/types';

export class MemberResponseDto {
  id: string;
  username: string;
  name: string;
  phone: string;
  role: Role;
  createdAt: Date;

  constructor(partial: Partial<MemberResponseDto>) {
    Object.assign(this, partial);
  }
}
