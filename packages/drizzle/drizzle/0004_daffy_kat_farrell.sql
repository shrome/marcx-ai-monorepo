CREATE TYPE "public"."InvitationStatus" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TABLE "Invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companyId" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "MemberRole" DEFAULT 'VIEWER' NOT NULL,
	"invitedBy" uuid NOT NULL,
	"token" text NOT NULL,
	"status" "InvitationStatus" DEFAULT 'PENDING' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"acceptedAt" timestamp,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_companyId_Company_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedBy_User_id_fk" FOREIGN KEY ("invitedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_company_email_pending_idx" ON "Invitation" USING btree ("companyId","email");--> statement-breakpoint
CREATE INDEX "Invitation_token_index" ON "Invitation" USING btree ("token");--> statement-breakpoint
CREATE INDEX "Invitation_companyId_index" ON "Invitation" USING btree ("companyId");