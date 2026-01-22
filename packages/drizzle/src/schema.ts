// Database schema using Drizzle ORM
// This is ready to connect to a real PostgreSQL database when available

import { pgTable, text, timestamp, uuid, boolean, jsonb, pgEnum, customType, varchar, index, primaryKey, integer } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"


export const timestamps = {
  updatedAt: timestamp().$onUpdate(() => new Date()),
  createdAt: timestamp().defaultNow().notNull(),
};

const citext = customType<{ data: string }>({ dataType: () => "citext" });

const role = pgEnum("Role", ["ADMIN", "COMPANY_USER", "COMPANY_OWNER"]);

// Users table
export const user = pgTable("User", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  companyId: uuid("companyId").references(() => company.id),
  name: text("name"),
  image: text("image"),
  emailVerified: boolean("emailVerified").default(false),
  role: role("role").notNull().default("COMPANY_USER"),
  ...timestamps,
});

const credentialType = pgEnum("CredentialType", ["PASSWORD", "OAUTH"]);

export const credential = pgTable(
  "Credential",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .references(() => user.id)
      .notNull(),
    type: credentialType("type").notNull(),
    identifier: citext("identifier").notNull(),
    secret: text("secret").notNull(),
    ...timestamps,
  },
  (table) => [index().on(table.userId)]
);

const category = pgEnum("Category",[
  "ACCOUNTING",
  "MARKETING",
])

// Company table
export const company = pgTable("Company", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  image: text("image"),
  website: text("website"),
  description: text("description"),
  category: category("category").notNull(),
  ...timestamps,
});

const verificationPurpose = pgEnum("VerificationPurpose", [
  "EMAIL_VERIFICATION",
  "PASSWORD_RESET",
  "LOGIN",
]);

export const verificationToken = pgTable("VerificationToken", {
  id: uuid("id").primaryKey().defaultRandom(),
  credentialId: uuid("credentialId")
    .references(() => credential.id)
    .notNull(),
  purpose: verificationPurpose("purpose").notNull(),
  tokenHash: text("tokenHash").notNull(),
  attempts: integer("attempts").default(0),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sessionType = pgEnum("SessionType", ["CHAT", "CASE"]);

// Chat sessions
export const session = pgTable("ChatSession", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: sessionType("type").notNull().default("CHAT"),
  companyId: uuid("companyId")
    .references(() => company.id)
    .notNull(),
  creatorId: uuid("creatorId")
    .references(() => user.id)
    .notNull(),
  title: text("title").notNull().default("New Chat"),
  description: text("description"),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("medium"),
  ...timestamps,
});

export const caseInfo = pgTable("CaseInfo", {
  sessionId: uuid("sessionId")
    .references(() => session.id)
    .notNull(),
  clientName: text("clientName").notNull(),
  // more to come
  ...timestamps,
});

export const chatRoles = pgEnum("ChatRoles", ["USER", "ASSISTANT"]);

// Chat messages
export const chatMessage = pgTable("ChatMessage", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("sessionId")
    .references(() => session.id)
    .notNull(),
  userId: uuid("userId")
    .references(() => user.id)
    .notNull(),
  role: chatRoles("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Case files
export const file = pgTable("File", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("sessionId")
    .references(() => session.id)
    .notNull(),
  chatId: uuid("chatId").references(() => chatMessage.id), // optional 
  name: text("name").notNull(),
  url: text("url").notNull(),
  size: text("size").notNull(),
  type: text("type").notNull(),
  ...timestamps,
});

// Type exports for use in the app
export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Company = typeof company.$inferSelect
export type NewCompany = typeof company.$inferInsert
export type Credential = typeof credential.$inferSelect
export type NewCredential = typeof credential.$inferInsert
export type VerificationToken = typeof verificationToken.$inferSelect
export type NewVerificationToken = typeof verificationToken.$inferInsert
export type ChatSession = typeof session.$inferSelect
export type NewChatSession = typeof session.$inferInsert
export type CaseInfo = typeof caseInfo.$inferSelect
export type NewCaseInfo = typeof caseInfo.$inferInsert
export type ChatMessage = typeof chatMessage.$inferSelect
export type NewChatMessage = typeof chatMessage.$inferInsert
export type File = typeof file.$inferSelect
export type NewFile = typeof file.$inferInsert

// Relations
export const userRelations = relations(user, ({ one, many }) => ({
  company: one(company, {
    fields: [user.companyId],
    references: [company.id],
  }),
  credentials: many(credential),
  createdSessions: many(session),
  chatMessages: many(chatMessage),
}))

export const companyRelations = relations(company, ({ many }) => ({
  users: many(user),
  sessions: many(session),
}))

export const credentialRelations = relations(credential, ({ one, many }) => ({
  user: one(user, {
    fields: [credential.userId],
    references: [user.id],
  }),
  verificationTokens: many(verificationToken),
}))

export const verificationTokenRelations = relations(verificationToken, ({ one }) => ({
  credential: one(credential, {
    fields: [verificationToken.credentialId],
    references: [credential.id],
  }),
}))

export const sessionRelations = relations(session, ({ one, many }) => ({
  company: one(company, {
    fields: [session.companyId],
    references: [company.id],
  }),
  creator: one(user, {
    fields: [session.creatorId],
    references: [user.id],
  }),
  caseInfo: one(caseInfo),
  chatMessages: many(chatMessage),
  files: many(file),
}))

export const caseInfoRelations = relations(caseInfo, ({ one }) => ({
  session: one(session, {
    fields: [caseInfo.sessionId],
    references: [session.id],
  }),
}))

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
}))

export const fileRelations = relations(file, ({ one }) => ({
  session: one(session, {
    fields: [file.sessionId],
    references: [session.id],
  }),
  chatMessage: one(chatMessage, {
    fields: [file.chatId],
    references: [chatMessage.id],
  }),
}))
