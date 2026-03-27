---
name: api-docs
description: Add OpenAPI/Swagger decorators to NestJS controllers and DTOs in the marcx-ai-monorepo backend. Use this skill when the user asks to document API endpoints, add Swagger decorators, generate OpenAPI specs, or set up Scalar API reference docs.
license: MIT
---

This skill guides adding clean, complete OpenAPI documentation to the NestJS backend using `@nestjs/swagger` decorators. The docs are rendered via Scalar (not Swagger UI) at `/api/docs`.

## Project Context

- **Backend**: `apps/backend/` — NestJS 11
- **OpenAPI package**: `@nestjs/swagger`
- **Docs renderer**: `@scalar/nestjs-api-reference` at `/api/docs`
- **Auth**: Bearer token (JWT in cookies, but Swagger uses `Authorization: Bearer`)
- **Global prefix**: `/api`
- **12 modules**: auth, user, company, company-member, session, chat, document, billing, activity-log, ai-proxy, case (deprecated), shared services

## Scalar Setup in `main.ts`

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

const config = new DocumentBuilder()
  .setTitle('Marcx AI API')
  .setDescription('AI-powered accounting ledger platform')
  .setVersion('1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'access-token',
  )
  .build()

const document = SwaggerModule.createDocument(app, config)

// Serve raw OpenAPI JSON for tooling
SwaggerModule.setup('api/docs/swagger', app, document)

// Scalar UI — beautiful, interactive, free
app.use('/api/docs', apiReference({ content: document, theme: 'kepler' }))
```

## Controller Decorators

```typescript
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger'

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentController {

  @Post()
  @ApiOperation({ summary: 'Upload a document file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document created successfully' })
  @ApiResponse({ status: 400, description: 'No file attached or invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file'))
  create(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateDocumentDto) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Document found' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  findOne(@Param('id') id: string) {}
}
```

## Tag Names by Module

| Module | `@ApiTags` value |
|--------|------------------|
| auth | `'Authentication'` |
| user | `'Users'` |
| company | `'Companies'` |
| company-member | `'Company Members'` |
| session | `'Sessions'` |
| chat | `'Chat'` |
| document | `'Documents'` |
| billing | `'Billing'` |
| activity-log | `'Activity Logs'` |
| ai-proxy | `'AI Proxy'` |

## DTO Decorators

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsEmail, IsEnum, IsOptional, IsUUID, IsNumber, Min } from 'class-validator'

export class CreateDocumentDto {
  @ApiProperty({
    description: 'The session this document belongs to',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  sessionId: string

  @ApiPropertyOptional({
    description: 'Type of document',
    enum: DocumentType,
    example: DocumentType.INVOICE,
  })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType
}

export class TopUpCreditDto {
  @ApiProperty({
    description: 'Amount to top up in USD',
    minimum: 0.01,
    example: 50.00,
  })
  @IsNumber()
  @Min(0.01)
  amount: number

  @ApiPropertyOptional({
    description: 'Payment reference number',
    example: 'PAY-2024-001',
  })
  @IsOptional()
  @IsString()
  reference?: string
}
```

## File Upload Body Documentation

```typescript
// For multipart/form-data endpoints, document the body schema explicitly
class UploadDocumentBody {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Document file (PDF, image, etc.)' })
  file: Express.Multer.File

  @ApiProperty({ type: 'string', format: 'uuid' })
  sessionId: string
}

@Post()
@ApiConsumes('multipart/form-data')
@ApiBody({ type: UploadDocumentBody })
```

## Query Parameter Documentation

```typescript
@Get()
@ApiOperation({ summary: 'List documents with filters' })
@ApiQuery({ name: 'sessionId', required: false, type: 'string', format: 'uuid' })
@ApiQuery({ name: 'documentType', required: false, enum: DocumentType })
@ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
@ApiQuery({ name: 'limit', required: false, type: 'number', example: 20 })
findAll(@Query() query: ListDocumentsQueryDto) {}
```

## Standard HTTP Response Codes to Document

Always document these for every endpoint:

| Scenario | Status | When |
|----------|--------|------|
| Success (read) | 200 | GET, PATCH, DELETE returning data |
| Created | 201 | POST that creates a resource |
| Bad input | 400 | DTO validation fails, missing file |
| Unauthorized | 401 | Missing/invalid/expired JWT |
| Forbidden | 403 | Valid JWT but wrong company/role |
| Not found | 404 | Resource with given ID doesn't exist |

## Key Rules

- `@ApiTags` and `@ApiBearerAuth('access-token')` go at the **class level**, not method level
- Always use `@ApiOperation({ summary: '...' })` — keep summaries short (under 10 words)
- Always document ALL possible response codes per endpoint
- For `@IsEnum` fields, pass `enum: TheEnum` to `@ApiProperty` so Scalar shows a dropdown
- Do NOT add `@ApiResponse` for 500 — that's implicit
- Never skip DTO decorators — Scalar only shows request body fields that have `@ApiProperty`
