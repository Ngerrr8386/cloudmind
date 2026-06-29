import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Đã cấu hình Firebase web chưa (cần apiKey + appId). */
export const firebaseConfigured = Boolean(config.apiKey && config.appId)

let app: FirebaseApp | null = null
let auth: Auth | null = null

function ensureAuth(): Auth {
  if (!firebaseConfigured) {
    throw new Error('Đăng nhập Google chưa được bật — thiếu cấu hình Firebase web (VITE_FIREBASE_API_KEY / VITE_FIREBASE_APP_ID).')
  }
  if (!app) {
    app = initializeApp(config)
    auth = getAuth(app)
  }
  return auth as Auth
}

/** Mở popup đăng nhập Google → trả về Firebase ID token để gửi cho backend. */
export async function signInWithGoogle(): Promise<string> {
  const a = ensureAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(a, provider)
  return result.user.getIdToken()
}
