import { IsString, MinLength } from 'class-validator';

import { LoginRequest } from '@toy-monorepo/types';

export class LoginDto implements LoginRequest {
  @IsString()
  @MinLength(1)
  username: string;

  @IsString()
  @MinLength(1)
  password: string;
}
