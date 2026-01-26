import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../enums/role.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 마스터 토큰 체크 (개발/테스트용)
    const masterToken = process.env.MASTER_TOKEN;
    if (masterToken && authHeader === `Bearer ${masterToken}`) {
      request.user = {
        id: '0',
        username: 'master',
        name: 'Master User',
        role: Role.ADMIN,
      };
      return true;
    }

    return super.canActivate(context);
  }
}
