import {
  Controller,
  Get,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { MembersService } from './members.service';

@Controller('members')
@UseInterceptors(ClassSerializerInterceptor)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async findAll() {
    return this.membersService.findAll();
  }
}
