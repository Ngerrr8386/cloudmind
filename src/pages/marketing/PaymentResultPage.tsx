import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react'
import { Logo, Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/** Trang khách hàng đáp về sau khi thanh toán PayOS (returnUrl/cancelUrl). */
export function PaymentResultPage({ status }: { status: 'success' | 'cancel' }) {
  const [params] = useSearchParams()
  const orderCode = params.get('orderCode')
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const t = useT()
  const isSuccess = status === 'success'
  const [refreshing, setRefreshing] = useState(isSuccess)

  // Sau khi thanh toán thành công: ép đồng bộ đơn từ PayOS để KÍCH HOẠT gói ngay
  // (không phụ thuộc webhook), rồi tải lại user để cập nhật gói + dung lượng.
  useEffect(() => {
    if (!isSuccess) return
    let active = true
    ;(async () => {
      if (orderCode) {
        // Thử vài lần phòng khi PayOS chưa kịp cập nhật trạng thái PAID.
        for (let i = 0; i < 3; i++) {
          try {
            const r = await api.syncOrder(orderCode)
            if (r?.status === 'paid') break
          } catch {
            /* webhook có thể đã xử lý, hoặc lỗi tạm — bỏ qua, thử lại */
          }
          await new Promise((res) => setTimeout(res, 1500))
        }
      }
      try {
        await refreshUser()
      } catch {
        /* ignore */
      }
      if (active) setRefreshing(false)
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, orderCode])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white px-4">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-8 text-center shadow-card backdrop-blur-xl"
      >
        <Link to="/" className="mb-6 inline-flex">
          <Logo />
        </Link>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
          className={cn(
            'mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl',
            isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600',
          )}
        >
          {isSuccess ? <CheckCircle2 className="h-9 w-9" /> : <XCircle className="h-9 w-9" />}
        </motion.div>

        <h1 className="text-2xl font-extrabold text-slate-900">
          {isSuccess ? t('pay.successTitle') : t('pay.cancelTitle')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {isSuccess ? t('pay.successDesc') : t('pay.cancelDesc')}
        </p>

        {isSuccess && (
          <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            {refreshing ? (
              <span className="inline-flex items-center gap-2 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> {t('pay.updating')}
              </span>
            ) : (
              <span className="text-slate-600">
                {t('pay.currentPlan')} <b className="text-slate-900">{user?.plan ?? 'Free'}</b>
              </span>
            )}
          </div>
        )}

        {orderCode && <p className="mt-3 text-xs text-slate-400">{t('pay.orderCode')} {orderCode}</p>}

        <div className="mt-7 flex flex-col gap-2.5">
          {isSuccess ? (
            <>
              <Button onClick={() => navigate('/app')}>
                {t('nav.openApp')} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/settings')}>
                {t('pay.viewBilling')}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/pricing')}>{t('pay.choosePlan')}</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate(user ? '/app' : '/')}>
                {user ? t('pay.backApp') : t('common.backHome')}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </main>
  )
}
