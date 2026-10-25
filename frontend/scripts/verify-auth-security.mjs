import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import Module from 'node:module'
import os from 'node:os'
import path from 'node:path'
import test, { after, before, beforeEach } from 'node:test'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const frontendRoot = path.resolve(path.dirname(__filename), '..')
const tmpOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arustore-auth-test-'))

// Provide browser-compatible Web Storage before loading Zustand persist store
class MemoryStorage {
  constructor() {
    this.map = new Map()
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null
  }
  setItem(key, value) {
    this.map.set(key, String(value))
  }
  removeItem(key) {
    this.map.delete(key)
  }
  clear() {
    this.map.clear()
  }
}

const mockLocalStorage = new MemoryStorage()
globalThis.localStorage = mockLocalStorage
globalThis.window = {
  localStorage: mockLocalStorage,
  location: { search: '' },
}

let storeMod
let clientMod
let authErrorsMod

before(() => {
  const tscBin = path.join(frontendRoot, 'node_modules', 'typescript', 'bin', 'tsc')
  const tmpTsconfig = path.join(tmpOutDir, 'tsconfig.verify.json')
  fs.writeFileSync(
    tmpTsconfig,
    JSON.stringify({
      compilerOptions: {
        outDir: tmpOutDir,
        rootDir: frontendRoot,
        baseUrl: frontendRoot,
        typeRoots: [path.join(frontendRoot, 'node_modules/@types')],
        paths: { '@/*': ['./*'] },
        module: 'commonjs',
        target: 'es2020',
        moduleResolution: 'node',
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
      },
      files: [
        path.join(frontendRoot, 'types/index.ts'),
        path.join(frontendRoot, 'lib/data/catalog.ts'),
        path.join(frontendRoot, 'lib/api/client.ts'),
        path.join(frontendRoot, 'lib/authErrors.ts'),
        path.join(frontendRoot, 'lib/store/useStore.ts'),
      ],
    })
  )

  execFileSync(process.execPath, [tscBin, '-p', tmpTsconfig], {
    cwd: frontendRoot,
    stdio: 'inherit',
  })

  // Resolve `@/*` alias & frontend/node_modules for compiled CommonJS files
  const originalResolve = Module._resolveFilename
  Module._resolveFilename = function resolveWithAlias(request, parent, isMain, options) {
    if (request.startsWith('@/')) {
      const mapped = path.join(tmpOutDir, request.slice(2))
      return originalResolve.call(this, mapped, parent, isMain, options)
    }
    if (!request.startsWith('.') && !path.isAbsolute(request)) {
      return originalResolve.call(this, request, parent, isMain, {
        ...options,
        paths: [path.join(frontendRoot, 'node_modules'), ...(options?.paths || [])],
      })
    }
    return originalResolve.call(this, request, parent, isMain, options)
  }

  const req = Module.createRequire(import.meta.url)
  clientMod = req(path.join(tmpOutDir, 'lib/api/client.js'))
  authErrorsMod = req(path.join(tmpOutDir, 'lib/authErrors.js'))
  storeMod = req(path.join(tmpOutDir, 'lib/store/useStore.js'))
})

after(() => {
  fs.rmSync(tmpOutDir, { recursive: true, force: true })
})

beforeEach(() => {
  mockLocalStorage.clear()
  clientMod.clearInMemoryAccessToken()
  storeMod.useStore.setState({
    user: null,
    authStatus: 'idle',
    hasSessionHint: false,
    orders: [],
    locale: 'fa',
  })
})

test('1. Anonymous visitor starts with user === null, non-admin, no demo orders, and no loginDemoUser', () => {
  const state = storeMod.useStore.getState()
  assert.equal(state.user, null)
  assert.equal(Boolean(state.user?.is_admin), false)
  assert.deepEqual(state.orders, [])
  assert.equal('loginDemoUser' in state, false)
  assert.equal(clientMod.getInMemoryAccessToken(), null)
})

test('2. Legacy persisted demo admin session & demo orders are invalidated while preserving locale', async () => {
  const legacyPersistedPayload = {
    version: 0,
    state: {
      locale: 'en',
      user: {
        id: 1,
        full_name: 'آرین رادمهر',
        email: 'arian@arustore.io',
        is_admin: true,
      },
      orders: [
        { id: 'ord-1001', orderNumber: 'ARU-84920', customerName: 'مهتاب رضایی' },
        { id: 'ord-1002', orderNumber: 'ARU-85104', customerName: 'سارا محمدی' },
        { id: 'ord-real-500', orderNumber: 'ARU-90500', customerName: 'Real Buyer' },
      ],
      wishlistIds: [2],
    },
  }

  mockLocalStorage.setItem(
    'arustore-aluminum-v3',
    JSON.stringify(legacyPersistedPayload)
  )
  await storeMod.useStore.persist.rehydrate()

  const state = storeMod.useStore.getState()
  assert.equal(state.user, null, 'Legacy demo admin user must not survive rehydration')
  assert.equal(state.hasSessionHint, false)
  assert.equal(state.locale, 'en', 'Language preference must be preserved')
  assert.equal(state.orders.length, 1)
  assert.equal(state.orders[0].id, 'ord-real-500')

  // Even direct v2 localStorage tampering with `user: { is_admin: true }` is ignored by merge
  mockLocalStorage.setItem(
    'arustore-aluminum-v3',
    JSON.stringify({
      version: 2,
      state: {
        locale: 'fa',
        hasSessionHint: false,
        user: { id: 99, email: 'attacker@evil.test', is_admin: true },
        orders: [],
      },
    })
  )
  await storeMod.useStore.persist.rehydrate()
  assert.equal(storeMod.useStore.getState().user, null)
})

test('3. Login, Register, Cookie Refresh, and Logout never persist tokens in localStorage or Zustand', async () => {
  const calls = []

  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', body: init.body, credentials: init.credentials })

    if (String(url).endsWith('/auth/login/json')) {
      const parsed = JSON.parse(init.body)
      if (parsed.password !== 'CorrectPass123!') {
        return new Response(
          JSON.stringify({ detail: 'Incorrect email/username or password' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({
          access_token: 'mem-access-jwt-123',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: 42,
            email: parsed.email_or_username,
            username: 'realcustomer',
            full_name: 'کاربر واقعی',
            is_admin: false,
            is_verified: true,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (String(url).endsWith('/auth/register')) {
      const parsed = JSON.parse(init.body)
      return new Response(
        JSON.stringify({
          access_token: 'reg-access-jwt-789',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: 43,
            email: parsed.email,
            username: 'newuser',
            full_name: parsed.full_name,
            is_admin: false,
            is_verified: true,
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (String(url).endsWith('/auth/refresh')) {
      assert.equal(init.credentials, 'include')
      assert.equal(init.body, undefined)
      return new Response(
        JSON.stringify({
          access_token: 'rotated-access-jwt-555',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: 42,
            email: 'real@arustore.ir',
            username: 'realcustomer',
            full_name: 'کاربر واقعی',
            is_admin: false,
            is_verified: true,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (String(url).endsWith('/auth/logout')) {
      return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    throw new Error(`Unexpected fetch URL: ${url}`)
  }

  // Failed login must throw and keep user === null
  await assert.rejects(
    () => storeMod.useStore.getState().loginUser('real@arustore.ir', 'WrongPass'),
    (err) => err.status === 401
  )
  assert.equal(storeMod.useStore.getState().user, null)
  assert.equal(clientMod.getInMemoryAccessToken(), null)

  // Valid login sets user from backend and keeps access token strictly in closure memory
  const loggedIn = await storeMod.useStore
    .getState()
    .loginUser('real@arustore.ir', 'CorrectPass123!')
  assert.equal(loggedIn.email, 'real@arustore.ir')
  assert.equal(loggedIn.is_admin, false)
  assert.equal(clientMod.getInMemoryAccessToken(), 'mem-access-jwt-123')

  const rawPersisted = mockLocalStorage.getItem('arustore-aluminum-v3') || ''
  assert.equal(rawPersisted.includes('mem-access-jwt-123'), false)
  assert.equal(rawPersisted.includes('access_token'), false)
  assert.equal(rawPersisted.includes('refresh_token'), false)
  assert.equal(rawPersisted.includes('real@arustore.ir'), false)

  const zustandSnapshot = JSON.stringify(storeMod.useStore.getState())
  assert.equal(zustandSnapshot.includes('mem-access-jwt-123'), false)
  assert.equal(zustandSnapshot.includes('refresh_token'), false)

  // Cookie-only refresh rotates in-memory access token without JSON refresh_token
  const refreshedProfile = await clientMod.aruApi.auth.refresh()
  assert.equal(refreshedProfile?.email, 'real@arustore.ir')
  assert.equal(clientMod.getInMemoryAccessToken(), 'rotated-access-jwt-555')
  assert.equal(
    (mockLocalStorage.getItem('arustore-aluminum-v3') || '').includes(
      'rotated-access-jwt-555'
    ),
    false
  )

  // Logout calls /auth/logout and clears memory token + user
  await storeMod.useStore.getState().logoutUser()
  assert.equal(storeMod.useStore.getState().user, null)
  assert.equal(clientMod.getInMemoryAccessToken(), null)

  // Register calls /auth/register with exact schema and never persists tokens
  const registered = await storeMod.useStore.getState().registerUser({
    email: 'fresh@arustore.ir',
    full_name: 'مشتری جدید',
    password: 'StrongPassword123!',
  })
  assert.equal(registered.email, 'fresh@arustore.ir')
  assert.equal(registered.is_admin, false)
  assert.equal(calls.some((c) => c.url.endsWith('/auth/register')), true)
  assert.equal(
    (mockLocalStorage.getItem('arustore-aluminum-v3') || '').includes(
      'reg-access-jwt-789'
    ),
    false
  )
})

test('4. Admin route verification never trusts cached role state and enforces backend /users/me check', async () => {
  // Tamper with in-memory Zustand state to pretend user is admin without a valid server session
  storeMod.useStore.setState({
    user: {
      id: 1,
      full_name: 'Fake Cached Admin',
      email: 'fake@arustore.ir',
      is_admin: true,
      member_since: '2026',
      loyalty_tier: 'Silver',
      loyalty_points: 0,
    },
    authStatus: 'authenticated',
  })
  clientMod.clearInMemoryAccessToken()

  // Case A: Anonymous (refresh returns 401) -> must return 'unauthenticated' and wipe fake admin
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/auth/refresh')) {
      return new Response(JSON.stringify({ detail: 'Missing refresh token' }), {
        status: 401,
      })
    }
    throw new Error(`Unexpected URL ${url}`)
  }

  const anonCheck = await storeMod.useStore.getState().verifyAdminAccess()
  assert.equal(anonCheck, 'unauthenticated')
  assert.equal(storeMod.useStore.getState().user, null)

  // Case B: Authenticated customer (is_admin: false on server) despite tampered local is_admin: true
  clientMod.setInMemoryAccessToken('valid-customer-token')
  storeMod.useStore.setState({
    user: {
      id: 2,
      full_name: 'Tampered Role',
      email: 'customer@arustore.ir',
      is_admin: true,
      member_since: '2026',
      loyalty_tier: 'Silver',
      loyalty_points: 0,
    },
  })
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/users/me')) {
      return new Response(
        JSON.stringify({
          id: 2,
          email: 'customer@arustore.ir',
          username: 'customer',
          full_name: 'Real Customer',
          is_admin: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
    throw new Error(`Unexpected URL ${url}`)
  }

  const customerCheck = await storeMod.useStore.getState().verifyAdminAccess()
  assert.equal(customerCheck, 'forbidden')
  assert.equal(storeMod.useStore.getState().user?.is_admin, false)

  // Case C: Server-verified administrator -> returns 'authorized'
  clientMod.setInMemoryAccessToken('valid-admin-token')
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/users/me')) {
      return new Response(
        JSON.stringify({
          id: 1,
          email: 'admin@arustore.ir',
          username: 'admin',
          full_name: 'مدیر سیستم',
          is_admin: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
    throw new Error(`Unexpected URL ${url}`)
  }

  const adminCheck = await storeMod.useStore.getState().verifyAdminAccess()
  assert.equal(adminCheck, 'authorized')
  assert.equal(storeMod.useStore.getState().user?.is_admin, true)

  // Bonus check: redirect target sanitizer blocks open redirects
  assert.equal(
    authErrorsMod.sanitizeRedirectTarget('https://evil.example.com', '/profile'),
    '/profile'
  )
  assert.equal(
    authErrorsMod.sanitizeRedirectTarget('//evil.example.com', '/profile'),
    '/profile'
  )
  assert.equal(authErrorsMod.sanitizeRedirectTarget('/admin', '/profile'), '/admin')
})
