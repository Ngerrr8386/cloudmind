/* API client cho CloudMind backend — token + auto-refresh + envelope. */

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4100/api/v1'

const ACCESS_KEY = 'cm_access'
const REFRESH_KEY = 'cm_refresh'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}
export function setTokens(access?: string, refresh?: string): void {
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

interface ReqOpts {
  auth?: boolean // gắn Bearer (mặc định true)
  raw?: boolean // trả nguyên envelope { success, data, meta } thay vì chỉ data
}

// Single-flight: gộp mọi yêu cầu refresh đồng thời thành 1 lệnh gọi
// (refresh token xoay vòng — gọi song song sẽ làm hỏng token).
let refreshPromise: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (!refreshToken) return false
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const json = await res.json()
    setTokens(json.data?.accessToken, json.data?.refreshToken)
    return Boolean(json.data?.accessToken)
  } catch {
    return false
  }
}

function refreshAccess(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

async function request<T = any>(
  method: string,
  path: string,
  body?: unknown,
  opts: ReqOpts = {},
  _retried = false,
): Promise<T> {
  const headers: Record<string, string> = {}
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  if (body !== undefined && !isForm) headers['content-type'] = 'application/json'
  const token = opts.auth === false ? null : getAccessToken()
  if (token) headers.authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  })

  // 401 → thử refresh 1 lần rồi gọi lại (bỏ qua request không-auth & chính /auth/refresh)
  if (res.status === 401 && !_retried && opts.auth !== false && path !== '/auth/refresh') {
    if (await refreshAccess()) return request<T>(method, path, body, opts, true)
  }

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json?.success === false) {
    const err = json?.error ?? {}
    throw new ApiError(res.status, err.code ?? 'ERROR', err.message ?? `Lỗi ${res.status}`)
  }
  return (opts.raw ? json : json.data) as T
}

const get = <T = any>(p: string, opts?: ReqOpts) => request<T>('GET', p, undefined, opts)
const post = <T = any>(p: string, b?: unknown, opts?: ReqOpts) => request<T>('POST', p, b, opts)
const patch = <T = any>(p: string, b?: unknown) => request<T>('PATCH', p, b)
const del = <T = any>(p: string) => request<T>('DELETE', p)
const qs = (params: Record<string, unknown>) => {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && v !== null) s.set(k, String(v))
  const str = s.toString()
  return str ? `?${str}` : ''
}

export const api = {
  // ---------- Auth ----------
  register: (b: { email: string; password: string; name: string }) => post('/auth/register', b, { auth: false }),
  verifyEmail: (b: { email: string; code: string }) => post('/auth/verify-email', b, { auth: false }),
  resendOtp: (email: string) => post('/auth/resend-otp', { email }, { auth: false }),
  login: (b: { email: string; password: string }) => post('/auth/login', b, { auth: false }),
  google: (idToken: string) => post('/auth/google', { idToken }, { auth: false }),
  forgotPassword: (email: string) => post('/auth/forgot-password', { email }, { auth: false }),
  resetPassword: (b: { email: string; code: string; newPassword: string }) => post('/auth/reset-password', b, { auth: false }),
  logout: () => post('/auth/logout', {}),
  me: () => get('/auth/me'),
  changePassword: (b: { oldPassword: string; newPassword: string }) => post('/auth/change-password', b),

  // ---------- Hồ sơ & cài đặt ----------
  getProfile: () => get('/me/profile'),
  updateProfile: (b: Record<string, unknown>) => patch('/me/profile', b),
  getSettings: () => get('/me/settings'),
  updateAiSettings: (b: Record<string, unknown>) => patch('/me/settings/ai', b),
  updateAppearance: (b: Record<string, unknown>) => patch('/me/settings/appearance', b),
  listSessions: () => get('/me/sessions'),
  toggle2fa: (enabled: boolean) => post('/me/2fa', { enabled }),

  // ---------- Dashboard ----------
  dashboardStats: () => get('/dashboard/stats'),
  storageBreakdown: () => get('/dashboard/storage-breakdown'),
  activityChart: () => get('/dashboard/activity-chart'),

  // ---------- Hoạt động & thông báo ----------
  activity: () => get('/activity'),
  notifications: (unread?: boolean) => get(`/notifications${unread ? '?unread=true' : ''}`),
  readNotification: (id: string) => post(`/notifications/${id}/read`, {}),
  readAllNotifications: () => post('/notifications/read-all', {}),

  // ---------- Thư mục ----------
  folders: () => get('/folders'),
  folderTree: () => get('/folders/tree'),
  createFolder: (b: { name: string; icon?: string; tone?: string; parentId?: string | null }) => post('/folders', b),
  updateFolder: (id: string, b: Record<string, unknown>) => patch(`/folders/${id}`, b),
  deleteFolder: (id: string) => del(`/folders/${id}`),

  // ---------- Tệp tin ----------
  files: (params: Record<string, unknown> = {}) =>
    get<any>(`/files${qs(params)}`, { raw: true }).then((j) => ({ items: (j?.data ?? []) as any[], meta: j?.meta })),
  getFile: (id: string) => get(`/files/${id}`),
  downloadUrl: (id: string) => get(`/files/${id}/download`),
  patchFile: (id: string, b: Record<string, unknown>) => patch(`/files/${id}`, b),
  starFile: (id: string) => post(`/files/${id}/star`, {}),
  shareFile: (id: string, b: { permission?: string; expiresInDays?: number }) => post(`/files/${id}/share`, b),
  trashFile: (id: string) => del(`/files/${id}`),
  restoreFile: (id: string) => post(`/files/${id}/restore`, {}),
  permanentDelete: (id: string) => del(`/files/${id}/permanent`),
  bulkFiles: (b: { ids: string[]; action: string; folderId?: string | null }) => post('/files/bulk', b),

  /** Upload qua Firebase signed URL: tạo URL → PUT → confirm. */
  uploadFile: async (file: File, folderId?: string | null) => {
    const { file: rec, uploadUrl } = await post('/files/upload-url', {
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      folderId: folderId ?? undefined,
    })
    await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file })
    return post(`/files/${rec.id}/confirm`, { size: file.size })
  },

  // ---------- AI ----------
  aiSearch: (b: { query: string; mode?: string; type?: string; limit?: number }) => post('/ai/search', b),
  aiSuggestions: () => get('/ai/search/suggestions'),
  conversations: () => get('/ai/chat/conversations'),
  createConversation: (title?: string) => post('/ai/chat/conversations', { title }),
  getConversation: (id: string) => get(`/ai/chat/conversations/${id}`),
  sendMessage: (id: string, content: string) => post(`/ai/chat/conversations/${id}/messages`, { content }),
  deleteConversation: (id: string) => del(`/ai/chat/conversations/${id}`),
  summarize: (fileId: string, length?: string) => post(`/ai/summarize/${fileId}`, { length }),
  getSummary: (fileId: string, length?: string) => get(`/ai/summarize/${fileId}${length ? `?length=${length}` : ''}`),
  insights: () => get('/ai/insights'),
  insightClusters: () => get('/ai/insights/clusters'),
  insightConnections: () => get('/ai/insights/connections'),
  insightTrends: () => get('/ai/insights/trends'),
  suggestFolder: (b: { fileId?: string; fileName?: string; text?: string }) => post('/ai/suggest-folder', b),

  // ---------- Gói cước ----------
  plans: () => get('/plans', { auth: false }),
  subscription: () => get('/subscription'),
  checkout: (b: { planKey: string; seats?: number; months?: number }) => post('/subscription/checkout', b),
  cancelSubscription: () => post('/subscription/cancel', {}),
  invoices: () => get('/billing/invoices'),

  // ---------- Workspace ----------
  currentWorkspace: () => get('/workspaces/current'),
  workspaceMembers: () => get('/workspaces/current/members'),
}
