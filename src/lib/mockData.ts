import type {
  StoredFile,
  Folder,
  ChatMessage,
  SearchResult,
  Insight,
  ActivityItem,
  PricingPlan,
  AppUser,
  FolderSuggestion,
} from './types'
import type { Tone } from './theme'

export const currentUser: AppUser = {
  name: 'Minh Anh',
  handle: '@minhanh',
  email: 'minhanh@cloudmind.vn',
  initials: 'MA',
  tone: 'violet',
  plan: 'Pro',
  storageUsed: 68_400_000_000, // ~63.7 GB
  storageTotal: 107_374_182_400, // 100 GB
}

export const folders: Folder[] = [
  { id: 'f-uni', name: 'Đại học', icon: 'GraduationCap', tone: 'indigo', fileCount: 48, size: 12_400_000_000, parentId: null },
  { id: 'f-work', name: 'Công việc', icon: 'Briefcase', tone: 'blue', fileCount: 73, size: 24_800_000_000, parentId: null },
  { id: 'f-side', name: 'Dự án cá nhân', icon: 'Rocket', tone: 'violet', fileCount: 31, size: 9_200_000_000, parentId: null },
  { id: 'f-media', name: 'Ảnh & Video', icon: 'Image', tone: 'emerald', fileCount: 156, size: 18_600_000_000, parentId: null },
  { id: 'f-money', name: 'Tài chính', icon: 'Wallet', tone: 'amber', fileCount: 22, size: 1_800_000_000, parentId: null },
  { id: 'f-read', name: 'Đọc sau', icon: 'BookMarked', tone: 'rose', fileCount: 19, size: 1_600_000_000, parentId: null },
]

export const files: StoredFile[] = [
  {
    id: 'doc-1', name: 'Đồ án tốt nghiệp - CloudMind.pdf', type: 'pdf', size: 8_400_000, folderId: 'f-uni',
    createdAt: '2026-05-12', updatedAt: '2026-06-26', owner: 'Minh Anh', starred: true, shared: true, aiProcessed: true,
    aiSummary: 'Đồ án xây dựng nền tảng lưu trữ đám mây tích hợp AI: kiến trúc microservice, embedding tài liệu cho tìm kiếm ngữ nghĩa, và pipeline RAG cho hỏi đáp.',
    tags: ['đồ án', 'AI', 'cloud'], tone: 'indigo',
  },
  {
    id: 'doc-2', name: 'Slide bảo vệ - v3 final FINAL.pptx', type: 'slide', size: 22_100_000, folderId: 'f-uni',
    createdAt: '2026-06-01', updatedAt: '2026-06-27', owner: 'Minh Anh', starred: true, shared: false, aiProcessed: true,
    aiSummary: '24 slide trình bày bài toán, giải pháp, demo và kết quả thực nghiệm của hệ thống CloudMind.',
    tags: ['slide', 'thuyết trình'], tone: 'amber',
  },
  {
    id: 'doc-3', name: 'Báo cáo doanh thu Q2-2026.xlsx', type: 'sheet', size: 1_240_000, folderId: 'f-work',
    createdAt: '2026-06-15', updatedAt: '2026-06-25', owner: 'Minh Anh', starred: false, shared: true, aiProcessed: true,
    aiSummary: 'Doanh thu Q2 tăng 23% so với Q1, dẫn đầu bởi gói Pro. Chi phí hạ tầng giảm 8%.',
    tags: ['tài chính', 'báo cáo'], tone: 'emerald',
  },
  {
    id: 'doc-4', name: 'Hợp đồng đối tác - VNG.pdf', type: 'pdf', size: 3_100_000, folderId: 'f-work',
    createdAt: '2026-04-20', updatedAt: '2026-06-10', owner: 'Minh Anh', starred: false, shared: false, aiProcessed: true,
    aiSummary: 'Hợp đồng hợp tác phân phối, thời hạn 24 tháng, điều khoản gia hạn tự động và NDA 2 chiều.',
    tags: ['hợp đồng', 'pháp lý'], tone: 'blue',
  },
  {
    id: 'doc-5', name: 'Moodboard app fitness.png', type: 'image', size: 6_700_000, folderId: 'f-side',
    createdAt: '2026-06-18', updatedAt: '2026-06-22', owner: 'Minh Anh', starred: true, shared: false, aiProcessed: true,
    aiSummary: 'Bảng cảm hứng thiết kế tông neon, glassmorphism cho ứng dụng theo dõi tập luyện.',
    tags: ['design', 'moodboard'], tone: 'rose',
  },
  {
    id: 'doc-6', name: 'main.tsx - CloudMind frontend.ts', type: 'code', size: 48_000, folderId: 'f-side',
    createdAt: '2026-06-10', updatedAt: '2026-06-28', owner: 'Minh Anh', starred: false, shared: false, aiProcessed: true,
    aiSummary: 'Điểm vào ứng dụng React, cấu hình router và provider theme.',
    tags: ['code', 'react'], tone: 'indigo',
  },
  {
    id: 'doc-7', name: 'Ghi chú meeting 26-06.note', type: 'note', size: 18_000, folderId: 'f-work',
    createdAt: '2026-06-26', updatedAt: '2026-06-26', owner: 'Minh Anh', starred: false, shared: false, aiProcessed: true,
    aiSummary: 'Chốt roadmap Q3: ưu tiên tính năng chia sẻ nhóm và xuất bản API công khai.',
    tags: ['họp', 'ghi chú'], tone: 'violet',
  },
  {
    id: 'doc-8', name: 'Demo sản phẩm.mp4', type: 'video', size: 184_000_000, folderId: 'f-media',
    createdAt: '2026-06-20', updatedAt: '2026-06-21', owner: 'Minh Anh', starred: true, shared: true, aiProcessed: true,
    aiSummary: 'Video demo 2 phút 14 giây giới thiệu luồng upload và hỏi đáp AI.',
    tags: ['video', 'demo'], tone: 'blue',
  },
  {
    id: 'doc-9', name: 'Podcast - Tương lai của AI.mp3', type: 'audio', size: 42_000_000, folderId: 'f-read',
    createdAt: '2026-06-05', updatedAt: '2026-06-05', owner: 'Minh Anh', starred: false, shared: false, aiProcessed: true,
    aiSummary: 'Tập podcast 38 phút bàn về AI tạo sinh và tác động tới ngành sáng tạo.',
    tags: ['podcast', 'AI'], tone: 'amber',
  },
  {
    id: 'doc-10', name: 'Sách - Atomic Habits.pdf', type: 'pdf', size: 5_600_000, folderId: 'f-read',
    createdAt: '2026-03-11', updatedAt: '2026-06-02', owner: 'Minh Anh', starred: true, shared: false, aiProcessed: true,
    aiSummary: 'Phương pháp xây dựng thói quen 1% mỗi ngày, vòng lặp tín hiệu – khao khát – phản hồi – phần thưởng.',
    tags: ['sách', 'phát triển bản thân'], tone: 'violet',
  },
  {
    id: 'doc-11', name: 'Ngân sách du lịch Đà Lạt.xlsx', type: 'sheet', size: 320_000, folderId: 'f-money',
    createdAt: '2026-06-12', updatedAt: '2026-06-19', owner: 'Minh Anh', starred: false, shared: true, aiProcessed: true,
    aiSummary: 'Kế hoạch chi tiêu 4 ngày 3 đêm, tổng 6.2 triệu/người, đã chia theo nhóm.',
    tags: ['du lịch', 'ngân sách'], tone: 'emerald',
  },
  {
    id: 'doc-12', name: 'CV - Minh Anh 2026.pdf', type: 'pdf', size: 890_000, folderId: 'f-work',
    createdAt: '2026-01-08', updatedAt: '2026-06-14', owner: 'Minh Anh', starred: true, shared: false, aiProcessed: true,
    aiSummary: 'Hồ sơ ứng tuyển vị trí Product Designer, nhấn mạnh kinh nghiệm design system.',
    tags: ['cv', 'cá nhân'], tone: 'indigo',
  },
]

export const folderSuggestions: FolderSuggestion[] = [
  { folderId: 'f-uni', folderName: 'Đại học', confidence: 0.94, reason: 'Nội dung học thuật, nhiều thuật ngữ liên quan đồ án và nghiên cứu.' },
  { folderId: 'f-work', folderName: 'Công việc', confidence: 0.61, reason: 'Có đề cập tới deadline và đối tác.' },
  { folderId: 'f-read', folderName: 'Đọc sau', confidence: 0.28, reason: 'Tài liệu dài, phù hợp lưu để đọc lại.' },
]

export const chatHistory: ChatMessage[] = [
  {
    id: 'm1', role: 'user', content: 'Tóm tắt giúp mình điểm chính của đồ án CloudMind và doanh thu Q2 nhé?',
    timestamp: '2026-06-28T09:12:00',
  },
  {
    id: 'm2', role: 'assistant',
    content:
      'Chắc chắn rồi! Mình đã đọc 2 tài liệu của bạn và đây là tổng hợp:\n\n**Đồ án CloudMind** đề xuất nền tảng lưu trữ tích hợp AI với 3 trụ cột: tìm kiếm ngữ nghĩa bằng embedding, hỏi đáp tài liệu theo kiến trúc RAG, và gợi ý sắp xếp thư mục tự động.\n\n**Doanh thu Q2-2026** tăng **23%** so với Q1, chủ yếu nhờ gói Pro; chi phí hạ tầng đồng thời giảm 8% — biên lợi nhuận đang được cải thiện rõ rệt. 🚀',
    timestamp: '2026-06-28T09:12:08',
    thinking: 'Truy xuất 2 tài liệu liên quan, đối chiếu số liệu doanh thu, tổng hợp đa nguồn.',
    sources: [
      { fileId: 'doc-1', fileName: 'Đồ án tốt nghiệp - CloudMind.pdf', fileType: 'pdf', snippet: '...kiến trúc gồm tầng embedding cho tìm kiếm ngữ nghĩa và pipeline RAG...', page: 12, relevance: 0.96 },
      { fileId: 'doc-3', fileName: 'Báo cáo doanh thu Q2-2026.xlsx', fileType: 'sheet', snippet: 'Tổng doanh thu Q2: +23% QoQ, gói Pro chiếm 64%...', relevance: 0.91 },
    ],
  },
]

export const suggestedPrompts: string[] = [
  'Tài liệu nào nói về kiến trúc RAG?',
  'So sánh doanh thu Q1 và Q2 giúp mình',
  'Liệt kê các hợp đồng sắp hết hạn',
  'Tóm tắt podcast về AI thành 5 ý',
  'Mình đã lưu gì về thiết kế UI?',
]

export const searchResults: SearchResult[] = [
  {
    file: files[0], relevance: 0.97,
    snippet: 'Hệ thống dùng mô hình embedding để biểu diễn tài liệu thành vector, cho phép tìm kiếm theo ý nghĩa thay vì từ khóa...',
    matchedConcepts: ['tìm kiếm ngữ nghĩa', 'embedding', 'vector'],
  },
  {
    file: files[5], relevance: 0.82,
    snippet: 'Cấu hình provider tìm kiếm và truyền truy vấn ngữ nghĩa xuống service backend...',
    matchedConcepts: ['tìm kiếm', 'frontend'],
  },
  {
    file: files[8], relevance: 0.74,
    snippet: 'Phần thảo luận về cách AI hiểu ngữ cảnh và truy xuất thông tin liên quan...',
    matchedConcepts: ['AI', 'ngữ cảnh'],
  },
]

export const insights: Insight[] = [
  { id: 'i1', title: 'Chủ đề nổi bật tháng này', description: 'AI & Machine Learning xuất hiện trong 42% tài liệu mới', icon: 'Sparkles', trend: 18, tone: 'violet' },
  { id: 'i2', title: 'Tài liệu cần dọn dẹp', description: '14 file trùng lặp & 6 bản nháp cũ có thể gộp', icon: 'Recycle', trend: -5, tone: 'emerald' },
  { id: 'i3', title: 'Kết nối tri thức', description: '3 cụm tài liệu liên quan vừa được phát hiện', icon: 'Network', trend: 12, tone: 'indigo' },
  { id: 'i4', title: 'Tài liệu ít truy cập', description: '23 file chưa mở trong 90 ngày', icon: 'Clock', trend: 7, tone: 'amber' },
]

export const knowledgeClusters = [
  { id: 'kc1', label: 'AI & Cloud', files: 18, color: '#7c3aed', x: 32, y: 30 },
  { id: 'kc2', label: 'Tài chính', files: 11, color: '#059669', x: 70, y: 28 },
  { id: 'kc3', label: 'Thiết kế', files: 14, color: '#e11d48', x: 28, y: 68 },
  { id: 'kc4', label: 'Pháp lý', files: 7, color: '#0284c7', x: 64, y: 66 },
  { id: 'kc5', label: 'Học tập', files: 22, color: '#4f46e5', x: 50, y: 48 },
]

export const activity: ActivityItem[] = [
  { id: 'a1', type: 'ai', title: 'AI đã tóm tắt 3 tài liệu', detail: 'Đồ án CloudMind, Báo cáo Q2, Hợp đồng VNG', timestamp: '2026-06-28T08:40:00' },
  { id: 'a2', type: 'upload', title: 'Tải lên 5 ảnh moodboard', detail: 'Vào thư mục Dự án cá nhân', timestamp: '2026-06-28T07:55:00' },
  { id: 'a3', type: 'summary', title: 'Tạo tóm tắt podcast', detail: 'Tương lai của AI · 38 phút → 5 ý', timestamp: '2026-06-27T21:10:00' },
  { id: 'a4', type: 'share', title: 'Chia sẻ Báo cáo doanh thu', detail: 'Với nhóm Tài chính (3 người)', timestamp: '2026-06-27T16:22:00' },
  { id: 'a5', type: 'search', title: 'Tìm kiếm ngữ nghĩa', detail: '"kiến trúc RAG" · 8 kết quả', timestamp: '2026-06-27T14:05:00' },
  { id: 'a6', type: 'edit', title: 'Cập nhật slide bảo vệ', detail: 'v3 final FINAL.pptx', timestamp: '2026-06-27T11:48:00' },
]

/** Storage usage breakdown for charts. */
export const storageBreakdown = [
  { name: 'Tài liệu', value: 18.2, color: '#4f46e5' },
  { name: 'Ảnh & Video', value: 28.6, color: '#e11d48' },
  { name: 'Âm thanh', value: 7.4, color: '#059669' },
  { name: 'Code & Khác', value: 9.5, color: '#f59e0b' },
]

/** Weekly upload activity for area chart. */
export const uploadActivity = [
  { day: 'T2', files: 8, ai: 5 },
  { day: 'T3', files: 14, ai: 11 },
  { day: 'T4', files: 6, ai: 4 },
  { day: 'T5', files: 19, ai: 16 },
  { day: 'T6', files: 23, ai: 20 },
  { day: 'T7', files: 11, ai: 9 },
  { day: 'CN', files: 5, ai: 3 },
]

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free', name: 'Free', tagline: 'Bắt đầu với AI', priceMonthly: 0, priceYearly: 0, storage: '15 GB',
    highlight: false, tone: 'slate', cta: 'Dùng miễn phí',
    features: [
      { text: '15 GB lưu trữ', included: true },
      { text: 'Tìm kiếm ngữ nghĩa cơ bản', included: true },
      { text: '20 lượt hỏi đáp AI / tháng', included: true },
      { text: 'Tóm tắt tài liệu', included: false },
      { text: 'Gợi ý thư mục thông minh', included: false },
      { text: 'Khai thác tri thức nâng cao', included: false },
    ],
  },
  {
    id: 'pro', name: 'Pro', tagline: 'Cho người làm thật', priceMonthly: 99000, priceYearly: 79000, storage: '500 GB',
    highlight: true, badge: 'Phổ biến nhất', tone: 'indigo', cta: 'Nâng cấp Pro',
    features: [
      { text: '500 GB lưu trữ', included: true },
      { text: 'Tìm kiếm ngữ nghĩa nâng cao', included: true },
      { text: 'Hỏi đáp AI không giới hạn', included: true },
      { text: 'Tóm tắt & trích xuất tự động', included: true },
      { text: 'Gợi ý thư mục thông minh', included: true },
      { text: 'Khai thác tri thức nâng cao', included: false },
    ],
  },
  {
    id: 'team', name: 'Team', tagline: 'Cả nhóm cùng thông minh', priceMonthly: 249000, priceYearly: 199000, storage: '2 TB / người',
    highlight: false, badge: 'Mới', tone: 'blue', cta: 'Tạo workspace',
    features: [
      { text: '2 TB / thành viên', included: true },
      { text: 'Mọi tính năng gói Pro', included: true },
      { text: 'Không gian làm việc chung', included: true },
      { text: 'Phân quyền & nhật ký', included: true },
      { text: 'Khai thác tri thức nâng cao', included: true },
      { text: 'Hỗ trợ ưu tiên 24/7', included: true },
    ],
  },
]

export const testimonials: { id: string; name: string; role: string; initials: string; tone: Tone; quote: string }[] = [
  { id: 't1', name: 'Bảo Trân', role: 'Sinh viên UX', initials: 'BT', tone: 'violet', quote: 'Mình quăng hết tài liệu vào đây, hỏi cái gì nó cũng trả lời kèm nguồn. Đúng kiểu não thứ hai luôn 🤯' },
  { id: 't2', name: 'Quốc Huy', role: 'Founder startup', initials: 'QH', tone: 'emerald', quote: 'Gợi ý folder chuẩn không cần chỉnh. Team mình tiết kiệm cả tiếng mỗi ngày chỉ nhờ cái này.' },
  { id: 't3', name: 'Lan Vy', role: 'Content creator', initials: 'LV', tone: 'amber', quote: 'Tìm kiếm ngữ nghĩa hiểu ý mình hơn cả mình hiểu mình. Mê thật sự 💜' },
  { id: 't4', name: 'Đức Minh', role: 'Data analyst', initials: 'DM', tone: 'indigo', quote: 'Tóm tắt báo cáo 40 trang trong 3 giây. Sếp tưởng mình thức cả đêm đọc 😎' },
]

export const faqs = [
  { q: 'CloudMind có đọc trộm dữ liệu của mình không?', a: 'Không nhé. Dữ liệu được mã hóa end-to-end, AI chỉ xử lý khi bạn yêu cầu và không dùng để huấn luyện mô hình.' },
  { q: 'AI hỗ trợ tiếng Việt tốt không?', a: 'Cực tốt. Tìm kiếm ngữ nghĩa, tóm tắt và hỏi đáp đều tối ưu cho tiếng Việt, hiểu cả tiếng lóng GenZ.' },
  { q: 'Mình có thể đổi gói bất cứ lúc nào chứ?', a: 'Được hết. Nâng cấp, hạ cấp hay hủy đều trong 1 chạm, tính phí theo tỉ lệ ngày dùng.' },
  { q: 'Có giới hạn loại file không?', a: 'CloudMind hỗ trợ PDF, Office, ảnh, video, audio, code... AI sẽ xử lý hầu hết định dạng phổ biến.' },
  { q: 'Sinh viên có ưu đãi không?', a: 'Có! Giảm 50% gói Pro khi xác thực email trường. Học mà có AI thì còn gì bằng 🎓' },
]

export const heroStats = [
  { label: 'Tài liệu được xử lý', value: '2.4M+' },
  { label: 'Người dùng tin tưởng', value: '180K+' },
  { label: 'Độ chính xác tìm kiếm', value: '98.7%' },
  { label: 'Thời gian tiết kiệm', value: '6h/tuần' },
]
