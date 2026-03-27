import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CompanyMemberService } from './company-member.service';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/company-member.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

interface RequestWithUser extends Request {
  user: { id: string };
}

@ApiTags('Company Members')
@ApiBearerAuth('access-token')
@Controller('companies/:companyId/members')
@UseGuards(AuthGuard)
export class CompanyMemberController {
  constructor(private readonly companyMemberService: CompanyMemberService) {}

  @Get()
  @ApiOperation({ summary: 'List all members of a company' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Members list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  listMembers(@Param('companyId') companyId: string) {
    return this.companyMemberService.listMembers(companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Invite a user to the company by email' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Member invited' })
  @ApiResponse({ status: 400, description: 'Invalid email or role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  inviteMember(
    @Param('companyId') companyId: string,
    @Body() dto: InviteMemberDto,
    @Request() req: RequestWithUser,
  ) {
    return this.companyMemberService.inviteMember(companyId, dto, req.user.id);
  }

  @Patch(':memberId')
  @ApiOperation({ summary: 'Update a member role' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 400, description: 'Cannot downgrade last OWNER' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  updateRole(
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.companyMemberService.updateRole(companyId, memberId, dto, req.user.id);
  }

  @Delete(':memberId')
  @ApiOperation({ summary: 'Remove a member from the company' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 400, description: 'Cannot remove last OWNER' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  removeMember(
    @Param('companyId') companyId: string,
    @Param('memberId') memberId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.companyMemberService.removeMember(companyId, memberId, req.user.id);
  }
}
