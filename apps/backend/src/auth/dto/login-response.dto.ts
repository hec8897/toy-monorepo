export class LoginResponseDto {
  accessToken: string;
  user: {
    id: string;
    username: string;
    name: string;
  };

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
