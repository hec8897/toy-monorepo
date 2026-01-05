import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../entities/member.entity';
import { MemberResponseDto } from './dto/member-response.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  async findAll(): Promise<MemberResponseDto[]> {
    const members = await this.memberRepository.find({
      select: ['id', 'username', 'name', 'phone', 'createdAt'],
    });

    return members.map(
      (member) =>
        new MemberResponseDto({
          id: member.id,
          username: member.username,
          name: member.name,
          phone: member.phone,
          createdAt: member.createdAt,
        }),
    );
  }

  async findById(id: string): Promise<MemberResponseDto> {
    const member = await this.memberRepository.findOne({
      where: { id },
      select: ['id', 'username', 'name', 'phone', 'createdAt'],
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return new MemberResponseDto({
      id: member.id,
      username: member.username,
      name: member.name,
      phone: member.phone,
      createdAt: member.createdAt,
    });
  }
}
