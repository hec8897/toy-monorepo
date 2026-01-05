import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { MemberResponseDto } from './dto/member-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async findAll(): Promise<MemberResponseDto[]> {
    return this.membersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MemberResponseDto> {
    return this.membersService.findById(id);
  }
}
