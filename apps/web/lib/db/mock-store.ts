// In-memory mock store for demo purposes
// Replace with real Drizzle queries when database is connected

import type { User, ChatSession, ChatMessage, File, Folder } from "@marcx/db"

interface MockStore {
  users: Map<string, User & { passwordHash?: string }>
  otpCodes: Map<string, { email: string; code: string; expiresAt: Date }>
  sessions: Map<string, ChatSession>
  messages: Map<string, ChatMessage[]>
  files: Map<string, File>
  folders: Map<string, Folder>
  currentUser: (User & { passwordHash?: string }) | null
}

export const mockStore: MockStore = {
  users: new Map(),
  otpCodes: new Map(),
  sessions: new Map(),
  messages: new Map(),
  files: new Map(),
  folders: new Map(),
  currentUser: null,
}

// Demo user for testing
const demoUserId = "demo-user-123"
mockStore.users.set(demoUserId, {
  id: demoUserId,
  email: "demo@example.com",
  name: "Demo User",
  image: null,
  passwordHash: "demo",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
})

// Helper to generate IDs
export function generateId() {
  return crypto.randomUUID()
}
