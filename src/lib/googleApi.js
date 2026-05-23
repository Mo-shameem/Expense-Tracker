const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file'
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

// ─── Token management ─────────────────────────────────────────────────────────

let _tokenClient = null
let _accessToken = null
let _tokenExpiry = 0

function isTokenValid() {
  return _accessToken && Date.now() < _tokenExpiry - 60_000
}

export function getAccessToken() {
  return _accessToken
}

export function setAccessToken(token, expiresIn = 3600) {
  _accessToken = token
  _tokenExpiry = Date.now() + expiresIn * 1000
  sessionStorage.setItem('gsi_token', JSON.stringify({ token, expiry: _tokenExpiry }))
}

export function clearAccessToken() {
  _accessToken = null
  _tokenExpiry = 0
  sessionStorage.removeItem('gsi_token')
}

export function loadTokenFromSession() {
  try {
    const stored = sessionStorage.getItem('gsi_token')
    if (!stored) return false
    const { token, expiry } = JSON.parse(stored)
    if (Date.now() < expiry - 60_000) {
      _accessToken = token
      _tokenExpiry = expiry
      return true
    }
  } catch {}
  return false
}

export function signOut() {
  if (_accessToken) window.google?.accounts.oauth2.revoke(_accessToken, () => {})
  clearAccessToken()
}

// ─── Google Identity Services ─────────────────────────────────────────────────

export function loadGsiScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) { resolve(); return }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]')
    if (existing) { existing.addEventListener('load', resolve); return }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = resolve
    s.onerror = () => reject(new Error('Failed to load Google Sign-In'))
    document.head.appendChild(s)
  })
}

export function initTokenClient() {
  if (_tokenClient) return Promise.resolve(_tokenClient)
  return new Promise((resolve) => {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {} // set per-request in requestAccessToken
    })
    resolve(_tokenClient)
  })
}

// Must be called synchronously within a user gesture handler
export function requestAccessToken() {
  return new Promise((resolve, reject) => {
    if (!_tokenClient) { reject(new Error('Sign-in not ready, please try again')); return }
    _tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error)); return }
      setAccessToken(resp.access_token, resp.expires_in)
      resolve(resp.access_token)
    }
    _tokenClient.requestAccessToken({ prompt: isTokenValid() ? '' : 'consent' })
  })
}

// ─── Auto-refresh expired token silently ─────────────────────────────────────

export async function ensureValidToken() {
  if (isTokenValid()) return _accessToken
  const token = await requestAccessToken()
  return token
}

// ─── Authenticated fetch ──────────────────────────────────────────────────────

async function authFetch(url, options = {}) {
  if (!isTokenValid()) await ensureValidToken()
  const resp = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${_accessToken}`, 'Content-Type': 'application/json' }
  })
  if (resp.status === 401) {
    await requestAccessToken()
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${_accessToken}`, 'Content-Type': 'application/json' }
    })
  }
  return resp
}

async function sheetsRequest(path, options = {}) {
  const resp = await authFetch(`${SHEETS_BASE}${path}`, options)
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.error?.message || `Sheets API error ${resp.status}`)
  }
  return resp.json()
}

// ─── Spreadsheet setup ────────────────────────────────────────────────────────

const EXPENSE_HEADERS = ['Date', 'Amount', 'Category', 'Note', 'Timestamp']
const CATEGORY_SHEET = 'Categories'
const DEFAULT_CATEGORIES = ['Fuel', 'Grocery', 'Food', 'Travel', 'Rent']

export async function findOrCreateSpreadsheet(userEmail) {
  const stored = localStorage.getItem(`spreadsheetId_${userEmail}`)
  if (stored) {
    try { await sheetsRequest(`/${stored}?fields=spreadsheetId`); return stored }
    catch { localStorage.removeItem(`spreadsheetId_${userEmail}`) }
  }

  const searchResp = await authFetch(
    `https://www.googleapis.com/drive/v3/files?q=name%3D'ExpenseTracker-${userEmail}'%20and%20mimeType%3D'application%2Fvnd.google-apps.spreadsheet'%20and%20trashed%3Dfalse&fields=files(id)`
  )
  if (searchResp.ok) {
    const { files } = await searchResp.json()
    if (files?.length) {
      localStorage.setItem(`spreadsheetId_${userEmail}`, files[0].id)
      return files[0].id
    }
  }

  const created = await sheetsRequest('', {
    method: 'POST',
    body: JSON.stringify({
      properties: { title: `ExpenseTracker-${userEmail}` },
      sheets: [
        {
          properties: { title: 'Expenses', sheetId: 0 },
          data: [{ rowData: [{ values: EXPENSE_HEADERS.map(v => ({ userEnteredValue: { stringValue: v } })) }] }]
        },
        {
          properties: { title: CATEGORY_SHEET, sheetId: 1 },
          data: [{ rowData: DEFAULT_CATEGORIES.map(c => ({ values: [{ userEnteredValue: { stringValue: c } }] })) }]
        }
      ]
    })
  })

  localStorage.setItem(`spreadsheetId_${userEmail}`, created.spreadsheetId)
  return created.spreadsheetId
}

// ─── Expenses CRUD ────────────────────────────────────────────────────────────

export async function fetchExpenses(spreadsheetId) {
  const data = await sheetsRequest(`/${spreadsheetId}/values/Expenses!A2:E`)
  return (data.values || []).map(r => ({
    date: r[0] || '', amount: parseFloat(r[1]) || 0,
    category: r[2] || '', note: r[3] || '', timestamp: r[4] || ''
  })).filter(e => e.date)
}

export async function appendExpense(spreadsheetId, { date, amount, category, note }) {
  const timestamp = new Date().toISOString()
  await sheetsRequest(`/${spreadsheetId}/values/Expenses!A:E:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values: [[date, amount, category, note || '', timestamp]] })
  })
}

export async function deleteExpense(spreadsheetId, rowIndex) {
  const sheetRowIndex = rowIndex + 1
  await sheetsRequest(`/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{ deleteDimension: { range: { sheetId: 0, dimension: 'ROWS', startIndex: sheetRowIndex, endIndex: sheetRowIndex + 1 } } }]
    })
  })
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function fetchCategories(spreadsheetId) {
  try {
    const data = await sheetsRequest(`/${spreadsheetId}/values/${CATEGORY_SHEET}!A:A`)
    return (data.values || []).flat().filter(Boolean)
  } catch {
    return [...DEFAULT_CATEGORIES]
  }
}

export async function appendCategory(spreadsheetId, category) {
  await sheetsRequest(`/${spreadsheetId}/values/${CATEGORY_SHEET}!A:A:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values: [[category]] })
  })
}

// ─── Offline queue ────────────────────────────────────────────────────────────

const QUEUE_KEY = 'offline_expense_queue'

export function queueOfflineExpense(spreadsheetId, expense) {
  const queue = getOfflineQueue()
  queue.push({ spreadsheetId, expense, queuedAt: Date.now() })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function getOfflineQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') }
  catch { return [] }
}

export async function flushOfflineQueue() {
  const queue = getOfflineQueue()
  if (!queue.length) return 0
  const failed = []
  for (const item of queue) {
    try { await appendExpense(item.spreadsheetId, item.expense) }
    catch { failed.push(item) }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(failed))
  return queue.length - failed.length
}
