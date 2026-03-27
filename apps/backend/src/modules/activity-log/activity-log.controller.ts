import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { ListActivityQueryDto } from './dto/activity-log.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

interface RequestWithUser extends Request {
  user: { id: string; companyId: string };
}

@ApiTags('Activity Logs')
@ApiBearerAuth('access-token')
@Controller('companies/:companyId/activity')
@UseGuards(AuthGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @ApiOperation({ summary: 'List activity logs for a company' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'userId', required: false, type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'Activity logs returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  list(
    @Param('companyId') companyId: string,
    @Query() query: ListActivityQueryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.activityLogService.list(companyId, query);
  }
}
