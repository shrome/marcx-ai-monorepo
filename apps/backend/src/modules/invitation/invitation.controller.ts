import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/invitation.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

interface RequestWithUser {
  user: { id: string };
}

@ApiTags('Invitations')
@Controller()
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  // ── Company-scoped routes (auth required) ────────────────────────────────

  @Post('companies/:companyId/invitations')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create and send a company invitation' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Invitation created and email sent' })
  @ApiResponse({ status: 403, description: 'Must be OWNER or ADMIN' })
  @ApiResponse({ status: 409, description: 'Pending invitation already exists' })
  create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateInvitationDto,
    @Request() req: RequestWithUser,
  ) {
    return this.invitationService.create(companyId, dto.email, dto.role, req.user.id);
  }

  @Get('companies/:companyId/invitations')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending invitations for a company' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of pending invitations' })
  list(@Param('companyId') companyId: string) {
    return this.invitationService.list(companyId);
  }

  @Delete('companies/:companyId/invitations/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  @ApiResponse({ status: 403, description: 'Must be OWNER or ADMIN' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  revoke(
    @Param('companyId') companyId: string,
    @Param('id') invitationId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.invitationService.revoke(invitationId, companyId, req.user.id);
  }

  // ── Token-based public routes ────────────────────────────────────────────

  @Get('invitations/:token')
  @ApiOperation({ summary: 'Get invitation details by token (public)' })
  @ApiParam({ name: 'token', type: 'string' })
  @ApiResponse({ status: 200, description: 'Invitation details returned' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 400, description: 'Invitation expired or already used' })
  getByToken(@Param('token') token: string) {
    return this.invitationService.getByToken(token);
  }

  @Post('invitations/:token/accept')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept an invitation (must be logged in)' })
  @ApiParam({ name: 'token', type: 'string' })
  @ApiResponse({ status: 201, description: 'Invitation accepted, company membership created' })
  @ApiResponse({ status: 400, description: 'Invitation expired or already used' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  accept(@Param('token') token: string, @Request() req: RequestWithUser) {
    return this.invitationService.accept(token, req.user.id);
  }
}
