import { useCallback, useEffect, useState } from 'react'

/** Gọi 1 hàm async (thường là api.*) với trạng thái loading/error + reload. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoFn = useCallback(fn, deps)

  const run = useCallback(() => {
    let active = true
    setLoading(true)
    setError(null)
    memoFn()
      .then((d) => { if (active) setData(d) })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'Có lỗi xảy ra') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [memoFn])

  useEffect(() => run(), [run])

  return { data, loading, error, reload: run, setData }
}
