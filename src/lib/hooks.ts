import { useOutletContext } from 'react-router-dom'

interface AppContext {
  openUpload: () => void
  /** Tăng mỗi khi có thay đổi dữ liệu (vd upload xong) — dùng làm dep để re-fetch. */
  dataNonce: number
  refreshData: () => void
}

/** Access app-shell actions (e.g. open the upload modal) from any routed page. */
export function useAppContext() {
  return useOutletContext<AppContext>()
}
