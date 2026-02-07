ALTER TABLE "ChatSession" RENAME TO "Session";--> statement-breakpoint
ALTER TABLE "CaseInfo" DROP CONSTRAINT "CaseInfo_sessionId_ChatSession_id_fk";
--> statement-breakpoint
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_sessionId_ChatSession_id_fk";
--> statement-breakpoint
ALTER TABLE "File" DROP CONSTRAINT "File_sessionId_ChatSession_id_fk";
--> statement-breakpoint
ALTER TABLE "Session" DROP CONSTRAINT "ChatSession_companyId_Company_id_fk";
--> statement-breakpoint
ALTER TABLE "Session" DROP CONSTRAINT "ChatSession_creatorId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "CaseInfo" ADD CONSTRAINT "CaseInfo_sessionId_Session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_Session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "File" ADD CONSTRAINT "File_sessionId_Session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_creatorId_User_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;