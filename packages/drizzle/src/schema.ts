// Database schema using Drizzle ORM
// This is ready to connect to a real PostgreSQL database when available

import { pgTable, text, timestamp, uuid, boolean, jsonb, pgEnum, customType, varchar, index, uniqueIndex, integer, numeric } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm";


export const timestamps = {
  updatedAt: timestamp().$onUpdate(() => new Date()),
  createdAt: timestamp().defaultNow().notNull(),
};

const citext = customType<{ data: string }>({ dataType: () => "citext" });

// ── Enums ─────────────────────────────────────────────────────────────────────

// Auth & Identity
export const memberRoleEnum = pgEnum("MemberRole", ["OWNER", "ADMIN", "ACCOUNTANT", "VIEWER"]);
export const credentialTypeEnum = pgEnum("CredentialType", ["EMAIL", "OAUTH"]);
export const providerTypeEnum = pgEnum("ProviderType", ["GOOGLE"]);
export const categoryEnum = pgEnum("Category", ["ACCOUNTING", "MARKETING"]);
export const verificationPurposeEnum = pgEnum("VerificationPurpose", [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
  "LOGIN"
]);

// Workspace
export const chatRoleEnum = pgEnum("ChatRole", ["USER", "ASSISTANT"]);
export const chatFeedbackEnum = pgEnum("ChatFeedback", ["HELPFUL", "UNHELPFUL"]);

// Document
export const documentTypeEnum = pgEnum("DocumentType", [
  "INVOICE",
  "RECEIPT",
  "BANK_STATEMENT",
  "CONTRACT",
  "OTHER"
]);
export const extractionStatusEnum = pgEnum("ExtractionStatus", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED"
]);
export const documentStatusEnum = pgEnum("DocumentStatus", [
  "DRAFT",
  "UNDER_REVIEW",
  "APPROVED",
  "POSTED",
  "VOID"
]);

// Billing
export const creditTransactionTypeEnum = pgEnum("CreditTransactionType", [
  "TOP_UP",
  "USAGE",
  "REFUND",
  "ADJUSTMENT"
]);

// ── Auth & Identity ───────────────────────────────────────────────────────────

export const company = pgTable("Company", {
  id: uuid("id").primaryKey().defaultRandom(),
  // null = top-level / holding company; set = subsidiary
  parentId: uuid("parentId").references((): any => company.id),
  name: varchar("name", { length: 255 }).notNull(),
  image: text("image"),
  website: text("website"),
  description: text("description"),
  category: categoryEnum("category").notNull(),
  ...timestamps,
});

export const user = pgTable("User", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  emailVerified: boolean("emailVerified").default(false),
  ...timestamps,
});

// User ↔ Company membership with role. Schema supports multi-company;
// backend currently enforces one membership per user.
export const companyMember = pgTable(
  "CompanyMember",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").references(() => user.id).notNull(),
    companyId: uuid("companyId").references(() => company.id).notNull(),
    role: memberRoleEnum("role").notNull().default("VIEWER"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(table.userId, table.companyId),
    index().on(table.companyId),
  ]
);

export const credential = pgTable(
  "Credential",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId").references(() => user.id).notNull(),
    type: credentialTypeEnum("type").notNull(),
    identifier: citext("identifier").notNull(),
    secret: text("secret"),
    provider: providerTypeEnum("provider"),
    ...timestamps,
  },
  (table) => [index().on(table.userId)]
);

export const verificationToken = pgTable("VerificationToken", {
  id: uuid("id").primaryKey().defaultRandom(),
  credentialId: uuid("credentialId").references(() => credential.id).notNull(),
  purpose: verificationPurposeEnum("purpose").notNull(),
  tokenHash: text("tokenHash").notNull(),
  attempts: integer("attempts").default(0),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Workspace ─────────────────────────────────────────────────────────────────

export const session = pgTable("Session", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("companyId").references(() => company.id).notNull(),
  creatorId: uuid("creatorId").references(() => user.id).notNull(),
  title: text("title").notNull().default("New Chat"),
  description: text("description"),
  status: text("status").notNull().default("open"),
  // fiscal year for GL sessions e.g. 2024
  fiscalYear: integer("fiscalYear"),
  // AI-maintained compressed context to reduce token usage in long sessions
  summary: text("summary"),
  ...timestamps,
});

export const chatMessage = pgTable("ChatMessage", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("sessionId").references(() => session.id).notNull(),
  userId: uuid("userId").references(() => user.id).notNull(),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  // AI response metadata: model name, token counts, tool calls, processing status
  metadata: jsonb("metadata"),
  // nullable; user thumbs up/down on AI response
  feedback: chatFeedbackEnum("feedback"),
  // nullable; freeform user comment on AI response
  feedbackNote: text("feedbackNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const file = pgTable("File", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("sessionId").references(() => session.id).notNull(),
  // nullable; message that triggered the upload
  chatId: uuid("chatId").references(() => chatMessage.id),
  name: text("name").notNull(),
  url: text("url").notNull(),
  size: text("size").notNull(),
  mimeType: text("mimeType").notNull(),
  ...timestamps,
});

// ── Document ──────────────────────────────────────────────────────────────────

export const document = pgTable(
  "Document",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // 1:1 with File; created immediately on upload
    fileId: uuid("fileId").references(() => file.id).notNull().unique(),
    companyId: uuid("companyId").references(() => company.id).notNull(),
    sessionId: uuid("sessionId").references(() => session.id).notNull(),
    uploadedBy: uuid("uploadedBy").references(() => user.id).notNull(),
    documentType: documentTypeEnum("documentType").notNull().default("OTHER"),
    extractionStatus: extractionStatusEnum("extractionStatus").notNull().default("PENDING"),
    // AI model that performed extraction e.g. "claude-3-5-sonnet"
    extractedBy: text("extractedBy"),
    // 0.000–1.000; AI confidence in the extraction
    confidenceScore: numeric("confidenceScore", { precision: 4, scale: 3 }),
    // populated on FAILED extraction
    errorMessage: text("errorMessage"),
    extractedAt: timestamp("extractedAt"),
    // IMMUTABLE: raw AI output; written once, never overwritten
    rawData: jsonb("rawData"),
    // MUTABLE: copy of rawData; user reviews and corrects this
    draftData: jsonb("draftData"),
    // IMMUTABLE: snapshot of draftData written once on approval
    approvedData: jsonb("approvedData"),
    documentStatus: documentStatusEnum("documentStatus").notNull().default("DRAFT"),
    notes: text("notes"),
    postedAt: timestamp("postedAt"),
    postedBy: uuid("postedBy").references(() => user.id),
    // soft-delete; financial documents must never be hard-deleted
    deletedAt: timestamp("deletedAt"),
    ...timestamps,
  },
  (table) => [
    index().on(table.companyId, table.documentStatus),
    index().on(table.sessionId),
    index().on(table.extractionStatus),
  ]
);

// ── Billing ───────────────────────────────────────────────────────────────────

// One credit wallet per company
export const companyCredit = pgTable("CompanyCredit", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("companyId").references(() => company.id).notNull().unique(),
  // cached balance; updated transactionally on every CreditTransaction insert
  balance: numeric("balance", { precision: 19, scale: 4 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  ...timestamps,
});

// Append-only ledger of all credit movements
export const creditTransaction = pgTable(
  "CreditTransaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyCreditId: uuid("companyCreditId").references(() => companyCredit.id).notNull(),
    type: creditTransactionTypeEnum("type").notNull(),
    // positive = credit in (TOP_UP/REFUND), negative = credit out (USAGE)
    amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
    // snapshot of balance after this transaction for reconciliation
    balanceAfter: numeric("balanceAfter", { precision: 19, scale: 4 }).notNull(),
    description: text("description"),
    reference: varchar("reference", { length: 255 }),
    // USAGE: { model, tokens, cost } | TOP_UP: { paymentMethod, invoiceId }
    metadata: jsonb("metadata"),
    // nullable; null = system-generated transaction
    createdBy: uuid("createdBy").references(() => user.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index().on(table.companyCreditId),
    index().on(table.companyCreditId, table.type),
  ]
);

// ── Platform ──────────────────────────────────────────────────────────────────

// Append-only event stream for observability across all entities
export const activityLog = pgTable(
  "ActivityLog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("companyId").references(() => company.id).notNull(),
    // nullable; null = system event
    userId: uuid("userId").references(() => user.id),
    // nullable; not all events are session-scoped
    sessionId: uuid("sessionId").references(() => session.id),
    // namespaced event string e.g. "document.uploaded", "credit.topped_up"
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entityType", { length: 50 }).notNull(),
    entityId: uuid("entityId").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index().on(table.companyId, table.createdAt),
    index().on(table.entityType, table.entityId),
    index().on(table.userId),
  ]
);

// ── Type exports ──────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Company = typeof company.$inferSelect
export type NewCompany = typeof company.$inferInsert
export type CompanyMember = typeof companyMember.$inferSelect
export type NewCompanyMember = typeof companyMember.$inferInsert
export type Credential = typeof credential.$inferSelect
export type NewCredential = typeof credential.$inferInsert
export type VerificationToken = typeof verificationToken.$inferSelect
export type NewVerificationToken = typeof verificationToken.$inferInsert
export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert
export type ChatMessage = typeof chatMessage.$inferSelect
export type NewChatMessage = typeof chatMessage.$inferInsert
export type File = typeof file.$inferSelect
export type NewFile = typeof file.$inferInsert
export type Document = typeof document.$inferSelect
export type NewDocument = typeof document.$inferInsert
export type CompanyCredit = typeof companyCredit.$inferSelect
export type NewCompanyCredit = typeof companyCredit.$inferInsert
export type CreditTransaction = typeof creditTransaction.$inferSelect
export type NewCreditTransaction = typeof creditTransaction.$inferInsert
export type ActivityLog = typeof activityLog.$inferSelect
export type NewActivityLog = typeof activityLog.$inferInsert

// ── Relations ─────────────────────────────────────────────────────────────────

export const companyRelations = relations(company, ({ one, many }) => ({
  parent: one(company, {
    fields: [company.parentId],
    references: [company.id],
    relationName: "subsidiaries",
  }),
  subsidiaries: many(company, { relationName: "subsidiaries" }),
  users: many(user),
  members: many(companyMember),
  sessions: many(session),
  documents: many(document),
  credit: one(companyCredit),
  activityLogs: many(activityLog),
}));

export const userRelations = relations(user, ({ many }) => ({
  memberships: many(companyMember),
  credentials: many(credential),
  createdSessions: many(session),
  chatMessages: many(chatMessage),
  uploadedDocuments: many(document, { relationName: "uploadedDocuments" }),
  postedDocuments: many(document, { relationName: "postedDocuments" }),
  creditTransactions: many(creditTransaction),
  activityLogs: many(activityLog),
}));

export const companyMemberRelations = relations(companyMember, ({ one }) => ({
  user: one(user, {
    fields: [companyMember.userId],
    references: [user.id],
  }),
  company: one(company, {
    fields: [companyMember.companyId],
    references: [company.id],
  }),
}));

export const credentialRelations = relations(credential, ({ one, many }) => ({
  user: one(user, {
    fields: [credential.userId],
    references: [user.id],
  }),
  verificationTokens: many(verificationToken),
}));

export const verificationTokenRelations = relations(verificationToken, ({ one }) => ({
  credential: one(credential, {
    fields: [verificationToken.credentialId],
    references: [credential.id],
  }),
}));

export const sessionRelations = relations(session, ({ one, many }) => ({
  company: one(company, {
    fields: [session.companyId],
    references: [company.id],
  }),
  creator: one(user, {
    fields: [session.creatorId],
    references: [user.id],
  }),
  chatMessages: many(chatMessage),
  files: many(file),
  documents: many(document),
  activityLogs: many(activityLog),
}));

export const chatMessageRelations = relations(chatMessage, ({ one, many }) => ({
  session: one(session, {
    fields: [chatMessage.sessionId],
    references: [session.id],
  }),
  user: one(user, {
    fields: [chatMessage.userId],
    references: [user.id],
  }),
  files: many(file),
}));

export const fileRelations = relations(file, ({ one }) => ({
  session: one(session, {
    fields: [file.sessionId],
    references: [session.id],
  }),
  chatMessage: one(chatMessage, {
    fields: [file.chatId],
    references: [chatMessage.id],
  }),
  document: one(document),
}));

export const documentRelations = relations(document, ({ one }) => ({
  file: one(file, {
    fields: [document.fileId],
    references: [file.id],
  }),
  company: one(company, {
    fields: [document.companyId],
    references: [company.id],
  }),
  session: one(session, {
    fields: [document.sessionId],
    references: [session.id],
  }),
  uploadedBy: one(user, {
    fields: [document.uploadedBy],
    references: [user.id],
    relationName: "uploadedDocuments",
  }),
  postedBy: one(user, {
    fields: [document.postedBy],
    references: [user.id],
    relationName: "postedDocuments",
  }),
}));

export const companyCreditRelations = relations(companyCredit, ({ one, many }) => ({
  company: one(company, {
    fields: [companyCredit.companyId],
    references: [company.id],
  }),
  transactions: many(creditTransaction),
}));

export const creditTransactionRelations = relations(creditTransaction, ({ one }) => ({
  companyCredit: one(companyCredit, {
    fields: [creditTransaction.companyCreditId],
    references: [companyCredit.id],
  }),
  createdBy: one(user, {
    fields: [creditTransaction.createdBy],
    references: [user.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  company: one(company, {
    fields: [activityLog.companyId],
    references: [company.id],
  }),
  user: one(user, {
    fields: [activityLog.userId],
    references: [user.id],
  }),
  session: one(session, {
    fields: [activityLog.sessionId],
    references: [session.id],
  }),
}));
