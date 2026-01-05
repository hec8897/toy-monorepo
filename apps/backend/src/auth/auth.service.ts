import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Member } from '../entities/member.entity';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;

    // 사용자 조회
    const member = await this.memberRepository.findOne({
      where: { username },
    });

    if (!member) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, member.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // JWT 페이로드 생성
    const payload = {
      sub: member.id,
      username: member.username,
      name: member.name,
    };

    // JWT 토큰 생성
    const accessToken = await this.jwtService.signAsync(payload);

    return new LoginResponseDto({
      accessToken,
      user: {
        id: member.id,
        username: member.username,
        name: member.name,
      },
    });
  }

  async validateUser(userId: string): Promise<Member | null> {
    return this.memberRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'name', 'phone', 'createdAt'],
    });
  }
}
