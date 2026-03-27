import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { TopUpCreditDto, ListTransactionsQueryDto } from './dto/billing.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

interface RequestWithUser extends Request {
  user: { id: string; companyId: string };
}

@ApiTags('Billing')
@ApiBearerAuth('access-token')
@Controller('companies/:companyId/credit')
@UseGuards(AuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'Get credit balance for a company' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Credit balance returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getBalance(@Param('companyId') companyId: string) {
    return this.billingService.getBalance(companyId);
  }

  @Post('top-up')
  @ApiOperation({ summary: 'Top up company credit balance' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Credits added' })
  @ApiResponse({ status: 400, description: 'Invalid amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  topUp(
    @Param('companyId') companyId: string,
    @Body() dto: TopUpCreditDto,
    @Request() req: RequestWithUser,
  ) {
    return this.billingService.topUp(companyId, dto, req.user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List credit transactions for a company' })
  @ApiParam({ name: 'companyId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'Transactions list returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  listTransactions(
    @Param('companyId') companyId: string,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.billingService.listTransactions(companyId, query);
  }
}
