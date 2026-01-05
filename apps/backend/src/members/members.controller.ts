import { Controller, Get, Param } from '@nestjs/common';
import { MembersService } from './members.service';
import { MemberResponseDto } from './dto/member-response.dto';

@Controller('members')
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
