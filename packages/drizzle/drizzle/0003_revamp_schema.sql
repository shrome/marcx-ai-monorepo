CREATE TYPE "public"."ChatFeedback" AS ENUM('HELPFUL', 'UNHELPFUL');--> statement-breakpoint
CREATE TYPE "public"."CreditTransactionType" AS ENUM('TOP_UP', 'USAGE', 'REFUND', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."DocumentStatus" AS ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'POSTED', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."DocumentType" AS ENUM('INVOICE', 'RECEIPT', 'BANK_STATEMENT', 'CONTRACT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."ExtractionStatus" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."MemberRole" AS ENUM('OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER');--> statement-breakpoint
CREATE TABLE "ActivityLog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companyId" uuid NOT NULL,
	"userId" uuid,
	"sessionId" uuid,
	"action" varchar(100) NOT NULL,
	"entityType" varchar(50) NOT NULL,
	"entityId" uuid NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CompanyCredit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companyId" uuid NOT NULL,
	"balance" numeric(19, 4) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "CompanyCredit_companyId_unique" UNIQUE("companyId")
);
--> statement-breakpoint
CREATE TABLE "CompanyMember" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"companyId" uuid NOT NULL,
	"role" "MemberRole" DEFAULT 'VIEWER' NOT NULL,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CreditTransaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companyCreditId" uuid NOT NULL,
	"type" "CreditTransactionType" NOT NULL,
	"amount" numeric(19, 4) NOT NULL,
	"balanceAfter" numeric(19, 4) NOT NULL,
	"description" text,
	"reference" varchar(255),
	"metadata" jsonb,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fileId" uuid NOT NULL,
	"companyId" uuid NOT NULL,
	"sessionId" uuid NOT NULL,
	"uploadedBy" uuid NOT NULL,
	"documentType" "DocumentType" DEFAULT 'OTHER' NOT NULL,
	"extractionStatus" "ExtractionStatus" DEFAULT 'PENDING' NOT NULL,
	"extractedBy" text,
	"confidenceScore" numeric(4, 3),
	"errorMessage" text,
	"extractedAt" timestamp,
	"rawData" jsonb,
	"draftData" jsonb,
	"approvedData" jsonb,
	"documentStatus" "DocumentStatus" DEFAULT 'DRAFT' NOT NULL,
	"notes" text,
	"postedAt" timestamp,
	"postedBy" uuid,
	"deletedAt" timestamp,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Document_fileId_unique" UNIQUE("fileId")
);
--> statement-breakpoint
ALTER TABLE "CaseInfo" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "CaseInfo" CASCADE;--> statement-breakpoint
ALTER TABLE "File" RENAME COLUMN "type" TO "mimeType";--> statement-breakpoint
ALTER TABLE "User" DROP CONSTRAINT "User_companyId_Company_id_fk";
--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD COLUMN "feedback" "ChatFeedback";--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD COLUMN "feedbackNote" text;--> statement-breakpoint
ALTER TABLE "Company" ADD COLUMN "parentId" uuid;--> statement-breakpoint
ALTER TABLE "Session" ADD COLUMN "fiscalYear" integer;--> statement-breakpoint
ALTER TABLE "Session" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_sessionId_Session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CompanyCredit" ADD CONSTRAINT "CompanyCredit_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_companyCreditId_CompanyCredit_id_fk" FOREIGN KEY ("companyCreditId") REFERENCES "public"."CompanyCredit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_createdBy_User_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_fileId_File_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_sessionId_Session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedBy_User_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_postedBy_User_id_fk" FOREIGN KEY ("postedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ActivityLog_companyId_createdAt_index" ON "ActivityLog" USING btree ("companyId","createdAt");--> statement-breakpoint
CREATE INDEX "ActivityLog_entityType_entityId_index" ON "ActivityLog" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE INDEX "ActivityLog_userId_index" ON "ActivityLog" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "CompanyMember_userId_companyId_index" ON "CompanyMember" USING btree ("userId","companyId");--> statement-breakpoint
CREATE INDEX "CompanyMember_companyId_index" ON "CompanyMember" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "CreditTransaction_companyCreditId_index" ON "CreditTransaction" USING btree ("companyCreditId");--> statement-breakpoint
CREATE INDEX "CreditTransaction_companyCreditId_type_index" ON "CreditTransaction" USING btree ("companyCreditId","type");--> statement-breakpoint
CREATE INDEX "Document_companyId_documentStatus_index" ON "Document" USING btree ("companyId","documentStatus");--> statement-breakpoint
CREATE INDEX "Document_sessionId_index" ON "Document" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "Document_extractionStatus_index" ON "Document" USING btree ("extractionStatus");--> statement-breakpoint
ALTER TABLE "Company" ADD CONSTRAINT "Company_parentId_Company_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."Company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Session" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "Session" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "companyId";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN "role";--> statement-breakpoint
DROP TYPE "public"."Role";--> statement-breakpoint
DROP TYPE "public"."SessionType";