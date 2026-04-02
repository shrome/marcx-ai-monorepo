CREATE TYPE "public"."LedgerStatus" AS ENUM('ACTIVE', 'CLOSED', 'ARCHIVED');--> statement-breakpoint
ALTER TYPE "public"."ChatRole" ADD VALUE 'SYSTEM';--> statement-breakpoint
ALTER TYPE "public"."ChatRole" ADD VALUE 'TOOL';--> statement-breakpoint
CREATE TABLE "Ledger" (
"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
"companyId" uuid NOT NULL,
"creatorId" uuid NOT NULL,
"name" varchar(255) NOT NULL,
"fiscalYear" integer NOT NULL,
"status" "LedgerStatus" DEFAULT 'ACTIVE' NOT NULL,
"description" text,
"deletedAt" timestamp,
"updatedAt" timestamp,
"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_fileId_File_id_fk";--> statement-breakpoint
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_fileId_unique";--> statement-breakpoint
ALTER TABLE "File" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "File" CASCADE;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "ledgerId" uuid;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "chatId" uuid;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "size" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "mimeType" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "uploadSource" varchar(32);--> statement-breakpoint
ALTER TABLE "Session" ADD COLUMN "ledgerId" uuid;--> statement-breakpoint
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_creatorId_User_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_company_fiscal_year_idx" ON "Ledger" USING btree ("companyId","fiscalYear");--> statement-breakpoint
CREATE INDEX "Ledger_companyId_index" ON "Ledger" USING btree ("companyId");--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_ledgerId_Ledger_id_fk" FOREIGN KEY ("ledgerId") REFERENCES "public"."Ledger"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Document" ADD CONSTRAINT "Document_chatId_ChatMessage_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."ChatMessage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_ledgerId_Ledger_id_fk" FOREIGN KEY ("ledgerId") REFERENCES "public"."Ledger"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Document_ledgerId_index" ON "Document" USING btree ("ledgerId");--> statement-breakpoint
ALTER TABLE "Document" DROP COLUMN "fileId";--> statement-breakpoint
ALTER TABLE "Session" DROP COLUMN "fiscalYear";
