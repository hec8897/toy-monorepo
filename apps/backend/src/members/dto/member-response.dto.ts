export class MemberResponseDto {
  id: string;
  username: string;
  name: string;
  phone: string;
  createdAt: Date;

  constructor(partial: Partial<MemberResponseDto>) {
    Object.assign(this, partial);
  }
}
