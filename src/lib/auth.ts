// ─── Types ────────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export interface AuthSession {
  userId: string
  name: string
  email: string
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const USERS_KEY = 'trainerize_users'
const SESSION_KEY = 'trainerize_session'

// ─── Password Hashing (SHA-256 via Web Crypto) ────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── User CRUD ────────────────────────────────────────────────────────────────

function loadUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveUsers(users: Record<string, StoredUser>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getUserByEmail(email: string): StoredUser | null {
  const users = loadUsers()
  return users[email.toLowerCase()] ?? null
}

export function emailExists(email: string): boolean {
  return !!getUserByEmail(email)
}

export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<StoredUser> {
  const users = loadUsers()
  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const passwordHash = await hashPassword(password)
  const user: StoredUser = {
    id,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  }
  users[user.email] = user
  saveUsers(users)
  return user
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<StoredUser | null> {
  const user = getUserByEmail(email)
  if (!user) return null
  const hash = await hashPassword(password)
  return hash === user.passwordHash ? user : null
}

// ─── Session Management ───────────────────────────────────────────────────────

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(user: StoredUser): AuthSession {
  const session: AuthSession = {
    userId: user.id,
    name: user.name,
    email: user.email,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

// ─── Per-user AppState key ────────────────────────────────────────────────────

export function userStateKey(userId: string): string {
  return `trainerize_state_${userId}`
}

// Migration: if there's legacy data (no userId), return it for the new user
export function migrateLegacyData(userId: string): void {
  const LEGACY_KEY = 'trainerize_state'
  const legacy = localStorage.getItem(LEGACY_KEY)
  const userKey = userStateKey(userId)
  if (legacy && !localStorage.getItem(userKey)) {
    localStorage.setItem(userKey, legacy)
    localStorage.removeItem(LEGACY_KEY)
  }
}
