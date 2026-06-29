import { Twitter, Github, Instagram, Youtube } from 'lucide-react'
import { Logo } from '@/components/ui'

const cols = [
  { title: 'Sản phẩm', links: ['Tính năng', 'Bảng giá', 'Tải xuống', 'Cập nhật'] },
  { title: 'Công ty', links: ['Về chúng tôi', 'Tuyển dụng', 'Blog', 'Liên hệ'] },
  { title: 'Tài nguyên', links: ['Hướng dẫn', 'API', 'Cộng đồng', 'Trạng thái'] },
  { title: 'Pháp lý', links: ['Điều khoản', 'Bảo mật', 'Cookie', 'Giấy phép'] },
]

const socials = [Twitter, Instagram, Github, Youtube]

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-500">
              Cloud lưu trữ thông minh với AI. Lưu mọi thứ, hỏi bất cứ điều gì, tìm thấy ngay.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((Icon, i) => (
                <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:text-ink-600 hover:bg-slate-200">
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-bold text-slate-900">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-900">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-400 md:flex-row">
          <p>© 2026 CloudMind. Made with 💜 in Vietnam.</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Tất cả hệ thống đang hoạt động
          </div>
        </div>
      </div>
    </footer>
  )
}

/** Wrapper layout for marketing pages. */
export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface-0">
      {children}
    </div>
  )
}
