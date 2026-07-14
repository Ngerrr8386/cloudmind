import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { vi, type TranslationKey } from './locales/vi'
import { en } from './locales/en'

export type Lang = 'vi' | 'en'
export type { TranslationKey }

const DICTS: Record<Lang, Record<TranslationKey, string>> = { vi, en }
const STORAGE_KEY = 'cloudmind.lang'

/** Lấy ngôn ngữ ban đầu: ưu tiên lựa chọn đã lưu, rồi đoán theo trình duyệt, mặc định vi. */
function initialLang(): Lang {
  if (typeof window === 'undefined') return 'vi'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'vi' || saved === 'en') return saved
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'vi'
}

/** Thay {ten} trong chuỗi bằng giá trị trong `vars`. */
function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`))
}

export type TFunc = (key: TranslationKey, vars?: Record<string, string | number>) => string

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: TFunc
}

const I18nContext = createContext<I18nValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<I18nValue>(() => {
    const dict = DICTS[lang]
    return {
      lang,
      setLang,
      // Thiếu khoá ở ngôn ngữ hiện tại → lùi về vi → cuối cùng trả chính khoá (dễ phát hiện).
      t: (key, vars) => format(dict[key] ?? vi[key] ?? key, vars),
    }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n phải được dùng bên trong <LanguageProvider>')
  return ctx
}

/** Hook tiện lợi khi chỉ cần hàm dịch: `const t = useT()`. */
export function useT(): TFunc {
  return useI18n().t
}
