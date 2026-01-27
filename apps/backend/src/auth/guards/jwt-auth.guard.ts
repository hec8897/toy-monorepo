import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Role } from '../enums/role.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 마스터 토큰 체크 (개발/테스트용, localhost만 허용)
    const masterToken = process.env.MASTER_TOKEN;
    if (masterToken && authHeader === `Bearer ${masterToken}`) {
      const clientIp = this.getClientIp(request);

      if (!this.isLocalhost(clientIp)) {
        this.logger.warn(
          `Master token rejected from non-localhost IP: ${clientIp}`,
        );
        return super.canActivate(context);
      }

      this.logger.warn(`Master token used from ${clientIp}`);
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

  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwarded = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim();

    return forwarded || request.socket?.remoteAddress || request.ip || '';
  }

  private isLocalhost(ip: string): boolean {
    const localhostIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
    return localhostIps.includes(ip);
  }
}
