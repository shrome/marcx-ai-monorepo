CREATE EXTENSION IF NOT EXISTS citext;
CREATE TYPE "public"."Category" AS ENUM('ACCOUNTING', 'MARKETING');--> statement-breakpoint
CREATE TYPE "public"."ChatRole" AS ENUM('USER', 'ASSISTANT');--> statement-breakpoint
CREATE TYPE "public"."CredentialType" AS ENUM('EMAIL', 'OAUTH');--> statement-breakpoint
CREATE TYPE "public"."ProviderType" AS ENUM('GOOGLE');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('ADMIN', 'COMPANY_USER', 'COMPANY_OWNER');--> statement-breakpoint
CREATE TYPE "public"."SessionType" AS ENUM('CHAT', 'CASE');--> statement-breakpoint
CREATE TYPE "public"."VerificationPurpose" AS ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN');--> statement-breakpoint
CREATE TABLE "CaseInfo" (
	"sessionId" uuid NOT NULL,
	"clientName" text NOT NULL,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ChatMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" "ChatRole" NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" text,
	"website" text,
	"description" text,
	"category" "Category" NOT NULL,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Credential" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" "CredentialType" NOT NULL,
	"identifier" "citext" NOT NULL,
	"secret" text NOT NULL,
	"provider" "ProviderType",
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "File" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"chatId" uuid,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"size" text NOT NULL,
	"type" text NOT NULL,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ChatSession" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "SessionType" DEFAULT 'CHAT' NOT NULL,
	"companyId" uuid NOT NULL,
	"creatorId" uuid NOT NULL,
	"title" text DEFAULT 'New Chat' NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"companyId" uuid,
	"name" text,
	"image" text,
	"emailVerified" boolean DEFAULT false,
	"role" "Role" DEFAULT 'COMPANY_USER' NOT NULL,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "VerificationToken" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credentialId" uuid NOT NULL,
	"purpose" "VerificationPurpose" NOT NULL,
	"tokenHash" text NOT NULL,
	"attempts" integer DEFAULT 0,
	"expiresAt" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "CaseInfo" ADD CONSTRAINT "CaseInfo_sessionId_ChatSession_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."ChatSession"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_ChatSession_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."ChatSession"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "File" ADD CONSTRAINT "File_sessionId_ChatSession_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."ChatSession"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "File" ADD CONSTRAINT "File_chatId_ChatMessage_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."ChatMessage"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_creatorId_User_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_credentialId_Credential_id_fk" FOREIGN KEY ("credentialId") REFERENCES "public"."Credential"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "Credential_userId_index" ON "Credential" USING btree ("userId");