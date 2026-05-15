<template>
  <div class="auth-card">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-sky-300">{{ copy.eyebrow }}</p>
        <h2 class="mt-2 text-3xl font-bold text-white">{{ copy.title }}</h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          {{ copy.subtitle }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="group flex h-10 items-center gap-2 rounded-xl border border-sky-300/30 bg-gradient-to-r from-sky-500 to-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-sky-950/30 transition-all hover:-translate-y-0.5 hover:from-sky-400 hover:to-indigo-500 hover:shadow-sky-900/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
          @click="downloadVietnameseGuide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 19h14" />
          </svg>
          Tải file Word
        </button>

        <div class="flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            v-for="option in languageOptions"
            :key="option.value"
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
            :class="language === option.value ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'"
            @click="language = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <RouterLink
          to="/auth/login"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          :aria-label="copy.backToLogin"
          :title="copy.backToLogin"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </RouterLink>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <section
        v-for="item in quickStart"
        :key="item.title"
        class="rounded-xl border border-white/10 bg-white/[0.04] p-4"
      >
        <div class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
        </div>
        <h3 class="text-sm font-bold text-white">{{ item.title }}</h3>
        <p class="mt-1 text-xs leading-5 text-slate-400">{{ item.text }}</p>
      </section>
    </div>

    <div class="mt-8 grid gap-5 lg:grid-cols-[260px_1fr]">
      <nav class="h-fit rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <button
          v-for="section in guideSections"
          :key="section.id"
          type="button"
          class="mb-1 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all last:mb-0"
          :class="section.id === activeSectionId
            ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-950/30'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'"
          @click="activeSectionId = section.id"
        >
          <span>{{ section.title }}</span>
          <span
            class="h-2 w-2 shrink-0 rounded-full"
            :class="section.id === activeSectionId ? 'bg-white' : 'bg-slate-600'"
          />
        </button>
      </nav>

      <section class="min-h-[520px] rounded-xl border border-white/10 bg-white/[0.04] p-5">
        <div class="mb-5 flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-sky-300">{{ copy.viewing }}</p>
            <h3 class="mt-1 text-2xl font-bold text-white">{{ activeSection.title }}</h3>
          </div>
          <p class="text-xs font-medium text-slate-500">
            {{ activeIndex + 1 }} / {{ guideSections.length }}
          </p>
        </div>

        <p class="text-sm leading-6 text-slate-400">{{ activeSection.description }}</p>

        <ol class="mt-5 space-y-3">
          <li v-for="(step, index) in activeSection.steps" :key="step" class="flex gap-3 text-sm leading-6 text-slate-300">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-xs font-bold text-sky-300">
              {{ index + 1 }}
            </span>
            <span>{{ step }}</span>
          </li>
        </ol>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <div class="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p class="text-xs font-bold uppercase tracking-wider text-emerald-300">{{ copy.tipLabel }}</p>
            <p class="mt-2 text-sm leading-6 text-emerald-50/90">{{ activeSection.tip }}</p>
          </div>

          <div class="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
            <p class="text-xs font-bold uppercase tracking-wider text-amber-200">{{ copy.noteLabel }}</p>
            <p class="mt-2 text-sm leading-6 text-amber-50/90">{{ activeSection.note }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type Language = 'vi' | 'en'

type DownloadGuideSection = {
  title: string
  description: string
  steps: string[]
  tip: string
  note: string
}

const languageOptions: Array<{ label: string; value: Language }> = [
  { label: 'VI', value: 'vi' },
  { label: 'EN', value: 'en' },
]

const language = ref<Language>('vi')
const activeSectionId = ref('account')

const content = {
  vi: {
    eyebrow: 'Hướng dẫn OCTOM',
    title: 'Hướng dẫn sử dụng website',
    subtitle: 'Tài liệu chi tiết giúp bạn đi từ đăng ký tài khoản, tạo dự án, quản lý công việc cho đến theo dõi tiến độ và phối hợp với nhóm.',
    viewing: 'Đang xem',
    tipLabel: 'Mẹo sử dụng',
    noteLabel: 'Lưu ý',
    backToLogin: 'Quay lại đăng nhập',
    quickStart: [
      {
        title: 'Bắt đầu tài khoản',
        text: 'Tạo tài khoản, đăng nhập, lấy lại mật khẩu và hiểu luồng vào hệ thống.',
        icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      },
      {
        title: 'Tổ chức dự án',
        text: 'Tạo project, mời thành viên, chọn project hiện tại và quản lý ngữ cảnh làm việc.',
        icon: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
      },
      {
        title: 'Theo dõi tiến độ',
        text: 'Sử dụng dashboard, danh sách task, board, file và comment để phối hợp hằng ngày.',
        icon: 'M9 17v-6a2 2 0 012-2h8M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h8m-4 14l4 4m0 0l4-4m-4 4V9',
      },
    ],
    sections: [
      {
        id: 'account',
        title: '1. Tài khoản và bảo mật',
        description: 'Phần này dành cho người mới bắt đầu: tạo tài khoản, đăng nhập, đăng xuất và xử lý khi quên mật khẩu.',
        steps: [
          'Tại màn đăng nhập, nếu chưa có tài khoản hãy bấm Create an account để chuyển sang màn đăng ký.',
          'Nhập họ tên thật hoặc tên nhóm dễ nhận diện, email đang dùng và mật khẩu đủ mạnh. Nên dùng mật khẩu có chữ hoa, chữ thường, số và ký tự đặc biệt.',
          'Sau khi đăng ký thành công, hệ thống sẽ tự đăng nhập và đưa bạn đến bước tạo project đầu tiên.',
          'Khi đã có tài khoản, quay lại Sign in, nhập email và mật khẩu để vào hệ thống.',
          'Nếu quên mật khẩu, bấm Forgot password, nhập đúng email đã đăng ký rồi kiểm tra hộp thư để mở liên kết đặt lại mật khẩu.',
          'Sau khi đặt lại mật khẩu, quay về màn đăng nhập và đăng nhập bằng mật khẩu mới.',
        ],
        tip: 'Nên dùng email làm việc thật để nhận được invite dự án, thông báo và liên kết đặt lại mật khẩu.',
        note: 'Nếu không thấy email đặt lại mật khẩu, hãy kiểm tra mục spam hoặc chắc chắn rằng email nhập vào trùng với email đã đăng ký.',
      },
      {
        id: 'projects',
        title: '2. Dự án',
        description: 'Project là không gian làm việc chính, nơi chứa task, board, files, thành viên và các thiết lập của nhóm.',
        steps: [
          'Sau khi đăng nhập lần đầu, nếu chưa có project, hệ thống sẽ đưa bạn đến màn Create Project.',
          'Khi tạo project, đặt tên rõ ràng theo nhóm, sản phẩm hoặc giai đoạn làm việc để dễ phân biệt về sau.',
          'Vào Projects để xem toàn bộ dự án bạn đang tham gia và chọn dự án cần làm việc.',
          'Khi một project được chọn, các trang Tasks, Board, Files và Settings sẽ hoạt động theo project đó.',
          'Nếu được mời vào dự án, mở liên kết invite. Hệ thống sẽ đưa bạn vào đúng project sau khi xác nhận.',
          'Nếu làm nhiều dự án cùng lúc, hãy kiểm tra project hiện tại trước khi tạo task hoặc tải file để tránh đưa dữ liệu nhầm nơi.',
        ],
        tip: 'Với nhóm lớn, nên thống nhất quy tắc đặt tên project, ví dụ “Tên sản phẩm - Giai đoạn” để mọi người tìm nhanh hơn.',
        note: 'Một số chức năng có thể phụ thuộc quyền của bạn trong project. Nếu không thấy nút thao tác, hãy kiểm tra vai trò với quản trị viên dự án.',
      },
      {
        id: 'dashboard',
        title: '3. Dashboard',
        description: 'Dashboard là màn hình tổng quan giúp bạn nắm tình hình dự án trước khi đi vào từng công việc cụ thể.',
        steps: [
          'Mở Dashboard sau khi đăng nhập để xem nhanh dự án hiện tại đang có bao nhiêu công việc và tiến độ tổng thể ra sao.',
          'Quan sát các chỉ số tổng quan như task đang mở, task hoàn thành, task trễ hạn hoặc các biểu đồ tiến độ nếu có.',
          'Dùng dashboard như màn kiểm tra đầu ngày: xác định việc nào gấp, việc nào đang bị chậm và ai đang phụ trách.',
          'Nếu số liệu không đúng project mong muốn, hãy đổi project hiện tại rồi quay lại dashboard.',
          'Sau khi xác định điểm cần xử lý, chuyển sang Tasks hoặc Board để cập nhật chi tiết từng task.',
        ],
        tip: 'Mỗi buổi sáng, hãy mở dashboard trước khi vào board. Cách này giúp bạn ưu tiên việc quan trọng thay vì xử lý task theo cảm tính.',
        note: 'Dashboard chỉ hữu ích khi task được cập nhật đều. Nếu nhóm không cập nhật trạng thái, số liệu tổng quan sẽ không phản ánh đúng thực tế.',
      },
      {
        id: 'tasks',
        title: '4. Công việc và Kanban board',
        description: 'Tasks dùng để quản lý danh sách công việc; Board dùng để nhìn tiến độ theo cột trạng thái và kéo thả nhanh.',
        steps: [
          'Vào Tasks để xem toàn bộ công việc của project dưới dạng danh sách, phù hợp khi cần tìm kiếm, lọc hoặc kiểm tra chi tiết.',
          'Khi tạo task mới, nhập tiêu đề ngắn gọn theo hành động cần làm, ví dụ “Thiết kế màn đăng nhập” thay vì “Đăng nhập”.',
          'Bổ sung mô tả, deadline, priority, label, sprint và assignee để người nhận task hiểu rõ việc cần làm và mức độ ưu tiên.',
          'Dùng bộ lọc hoặc tìm kiếm để nhanh chóng tìm task theo trạng thái, người phụ trách, mức độ ưu tiên hoặc từ khóa.',
          'Vào Board để xem task theo các cột trạng thái. Khi tiến độ thay đổi, kéo task sang cột tương ứng để cả nhóm nhìn thấy ngay.',
          'Nếu task quá lớn, mở chi tiết task và chia thành checklist hoặc subtask để dễ theo dõi.',
        ],
        tip: 'Một task tốt nên trả lời được bốn câu hỏi: làm gì, ai làm, khi nào xong và mức độ ưu tiên là gì.',
        note: 'Đừng tạo task quá chung chung. Task mơ hồ khiến người phụ trách khó bắt đầu và làm dashboard mất độ chính xác.',
      },
      {
        id: 'task-detail',
        title: '5. Chi tiết task',
        description: 'Màn chi tiết task là nơi cập nhật toàn bộ thông tin sâu hơn: mô tả, trạng thái, người phụ trách, checklist, comment, file và lịch sử.',
        steps: [
          'Bấm vào một task trong danh sách hoặc board để mở màn chi tiết.',
          'Kiểm tra tiêu đề và mô tả trước tiên để chắc chắn mọi người hiểu cùng một phạm vi công việc.',
          'Cập nhật trạng thái, priority, deadline, assignee và label khi có thay đổi để dữ liệu toàn hệ thống luôn mới.',
          'Dùng checklist hoặc subtask để chia nhỏ việc lớn thành các bước có thể hoàn thành từng phần.',
          'Dùng comment để trao đổi ngay trong task. Khi ai đó đọc lại, họ thấy đầy đủ ngữ cảnh thay vì phải tìm trong tin nhắn ngoài.',
          'Đính kèm file, ảnh hoặc tài liệu liên quan để người thực hiện không phải hỏi lại nguồn thông tin.',
          'Theo dõi activity log để biết ai đã thay đổi nội dung nào và thời điểm thay đổi.',
        ],
        tip: 'Khi giao việc, hãy ghi rõ tiêu chí hoàn thành trong mô tả hoặc checklist. Điều này giảm rất nhiều vòng hỏi lại.',
        note: 'Nếu thay đổi deadline hoặc người phụ trách, nên để lại comment ngắn nêu lý do để các thành viên khác hiểu bối cảnh.',
      },
      {
        id: 'files',
        title: '6. Tệp và thư mục',
        description: 'Files giúp lưu trữ tài liệu theo project, tránh thất lạc file và giúp cả nhóm dùng chung một nguồn dữ liệu.',
        steps: [
          'Vào Files trong project hiện tại để xem các file và thư mục đã được tải lên.',
          'Tạo thư mục theo module, sprint, khách hàng hoặc loại tài liệu để cấu trúc file dễ tìm.',
          'Trước khi tải file, kiểm tra bạn đang ở đúng project và đúng thư mục.',
          'Tải file lên, sau đó đặt tên file rõ ràng nếu cần để người khác hiểu nội dung trước khi mở.',
          'Dùng chức năng mở hoặc xem trước để kiểm tra nhanh tài liệu mà không phải tải xuống thủ công.',
          'Khi file liên quan trực tiếp đến task, hãy đính kèm hoặc nhắc đến trong comment của task để nối đúng ngữ cảnh.',
        ],
        tip: 'Nên đặt tên file có phiên bản hoặc ngày tháng, ví dụ “API-spec-v2” hoặc “Bao-cao-sprint-05”, để tránh nhầm file cũ với file mới.',
        note: 'File nằm trong project nào thì nên phục vụ project đó. Không nên dùng Files làm kho lưu trữ chung cho tài liệu không liên quan.',
      },
      {
        id: 'settings',
        title: '7. Cài đặt và thành viên',
        description: 'Settings là nơi quản lý thông tin dự án, thành viên, vai trò và một số tùy chỉnh cá nhân hoặc dự án.',
        steps: [
          'Vào Settings khi cần cập nhật tên, mô tả hoặc cấu hình của project.',
          'Kiểm tra danh sách thành viên để biết ai đang tham gia project và vai trò của từng người.',
          'Khi mời người mới, tạo hoặc gửi invite theo luồng của hệ thống để họ vào đúng project.',
          'Gán vai trò phù hợp với trách nhiệm: người quản lý cần quyền cấu hình, thành viên thực hiện chỉ cần quyền thao tác task liên quan.',
          'Nếu bạn không thể sửa hoặc xóa một nội dung, hãy kiểm tra quyền hiện tại của tài khoản trong project.',
          'Ở phần cá nhân, cập nhật thông tin người dùng, theme hoặc thông báo để trải nghiệm làm việc phù hợp hơn.',
        ],
        tip: 'Hãy cấp quyền theo nguyên tắc vừa đủ. Người nào cần thao tác nào thì cấp quyền thao tác đó, tránh mở quyền quá rộng.',
        note: 'Thay đổi vai trò thành viên có thể ảnh hưởng trực tiếp đến khả năng tạo, sửa, xóa hoặc cấu hình dữ liệu trong project.',
      },
      {
        id: 'tips',
        title: '8. Quy trình làm việc đề xuất',
        description: 'Phần này gợi ý cách dùng OCTOM hằng ngày để nhóm làm việc rõ ràng, ít bỏ sót và dễ nhìn lại tiến độ.',
        steps: [
          'Đầu ngày: mở Dashboard để xem tổng quan, sau đó vào Board để xác định các task cần ưu tiên.',
          'Khi nhận task: đọc mô tả, deadline, priority và checklist. Nếu thiếu thông tin, hỏi ngay trong comment của task.',
          'Khi bắt đầu làm: chuyển task sang trạng thái đang xử lý để nhóm biết bạn đã nhận việc.',
          'Trong lúc làm: cập nhật checklist, comment tiến độ hoặc đính kèm file khi có thay đổi quan trọng.',
          'Khi hoàn thành: kiểm tra lại tiêu chí hoàn thành, cập nhật trạng thái sang hoàn tất và để lại ghi chú nếu cần.',
          'Cuối ngày hoặc cuối sprint: dùng Dashboard và Board để rà soát task trễ hạn, task chưa có người phụ trách và task bị kẹt lâu.',
        ],
        tip: 'Càng cập nhật đều, công cụ càng hữu ích. Mỗi lần thay đổi trạng thái hoặc phạm vi công việc, hãy cập nhật ngay trong OCTOM.',
        note: 'Tránh trao đổi quyết định quan trọng chỉ ở bên ngoài hệ thống. Nếu quyết định ảnh hưởng đến task, hãy ghi lại trong comment để không mất dấu.',
      },
    ],
  },
  en: {
    eyebrow: 'OCTOM Guide',
    title: 'Website user guide',
    subtitle: 'A detailed guide that walks you through account setup, project creation, task management, progress tracking, and team collaboration.',
    viewing: 'Now viewing',
    tipLabel: 'Best practice',
    noteLabel: 'Note',
    backToLogin: 'Back to login',
    quickStart: [
      {
        title: 'Start with your account',
        text: 'Create an account, sign in, recover your password, and understand the access flow.',
        icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      },
      {
        title: 'Organize projects',
        text: 'Create projects, invite members, choose the active project, and keep work in the right context.',
        icon: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
      },
      {
        title: 'Track progress',
        text: 'Use the dashboard, task list, board, files, and comments to coordinate daily work.',
        icon: 'M9 17v-6a2 2 0 012-2h8M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h8m-4 14l4 4m0 0l4-4m-4 4V9',
      },
    ],
    sections: [
      {
        id: 'account',
        title: '1. Account and security',
        description: 'This section helps new users create an account, sign in, sign out, and recover access when they forget their password.',
        steps: [
          'On the login screen, select Create an account if you do not have an account yet.',
          'Enter a recognizable name, your active email address, and a strong password. A strong password should include uppercase letters, lowercase letters, numbers, and symbols.',
          'After registration succeeds, the system signs you in and sends you to the first project creation step.',
          'If you already have an account, return to Sign in and enter your email and password.',
          'If you forget your password, select Forgot password, enter the email used for registration, and check your inbox for the reset link.',
          'After resetting the password, return to the login screen and sign in with the new password.',
        ],
        tip: 'Use a real work email so you can receive project invitations, notifications, and password reset links.',
        note: 'If the reset email does not arrive, check spam or confirm that the email matches the one used during registration.',
      },
      {
        id: 'projects',
        title: '2. Projects',
        description: 'A project is the main workspace that contains tasks, boards, files, members, and team settings.',
        steps: [
          'After your first login, if you do not have any project yet, the system takes you to Create Project.',
          'When creating a project, use a clear name based on the team, product, or work phase so it stays easy to recognize later.',
          'Open Projects to view every project you belong to and choose the one you want to work on.',
          'Once a project is selected, Tasks, Board, Files, and Settings will all operate inside that project context.',
          'If you are invited to a project, open the invitation link. The system will place you in the correct project after confirmation.',
          'If you work across multiple projects, always verify the active project before creating tasks or uploading files.',
        ],
        tip: 'For larger teams, agree on a project naming pattern such as “Product name - Phase” so everyone can find the right workspace quickly.',
        note: 'Some actions depend on your project role. If a button is missing, check your role with the project administrator.',
      },
      {
        id: 'dashboard',
        title: '3. Dashboard',
        description: 'The dashboard gives you a project overview before you drill into individual tasks.',
        steps: [
          'Open Dashboard after signing in to see how much work the active project has and how the overall progress looks.',
          'Review summary metrics such as open tasks, completed tasks, overdue tasks, or progress charts if available.',
          'Use the dashboard as a morning check-in screen: identify urgent work, delayed items, and current assignees.',
          'If the numbers do not match the project you expected, switch the active project and return to the dashboard.',
          'After identifying what needs attention, move to Tasks or Board to update the specific work items.',
        ],
        tip: 'Open the dashboard before jumping into the board each morning. It helps you prioritize important work instead of reacting task by task.',
        note: 'Dashboard data is only useful when tasks are updated regularly. If the team does not update statuses, the overview will not reflect reality.',
      },
      {
        id: 'tasks',
        title: '4. Tasks and Kanban board',
        description: 'Tasks manage work in a list view; Board visualizes progress by status columns and supports quick drag-and-drop updates.',
        steps: [
          'Open Tasks to view all project work in a list, which is useful for searching, filtering, and checking details.',
          'When creating a task, write a short action-based title, such as “Design login screen” instead of just “Login”.',
          'Add description, deadline, priority, labels, sprint, and assignee so the owner understands the work and urgency.',
          'Use filters or search to find tasks by status, assignee, priority, or keywords.',
          'Open Board to view tasks by status columns. When progress changes, drag the task to the matching column so the team sees it immediately.',
          'If a task is too large, open its detail view and split it into checklist items or subtasks.',
        ],
        tip: 'A good task answers four questions: what needs to be done, who owns it, when it is due, and how important it is.',
        note: 'Avoid vague tasks. Unclear tasks make it hard for assignees to start and make dashboard metrics less reliable.',
      },
      {
        id: 'task-detail',
        title: '5. Task detail',
        description: 'The task detail view is where you manage deeper information: description, status, assignee, checklist, comments, files, and activity history.',
        steps: [
          'Select a task from the list or board to open its detail view.',
          'Check the title and description first to make sure everyone shares the same scope.',
          'Update status, priority, deadline, assignee, and labels whenever something changes.',
          'Use checklist items or subtasks to break large work into smaller pieces that can be completed step by step.',
          'Use comments for discussions inside the task. Anyone reading later will see the full context without searching external chats.',
          'Attach related files, screenshots, or documents so the assignee does not need to ask for source materials.',
          'Review the activity log to understand what changed, who changed it, and when it happened.',
        ],
        tip: 'When assigning work, include completion criteria in the description or checklist. It reduces back-and-forth questions.',
        note: 'If you change the deadline or assignee, leave a short comment explaining why so the team understands the context.',
      },
      {
        id: 'files',
        title: '6. Files and folders',
        description: 'Files help store project documents in one place, reduce lost assets, and give the team a shared source of truth.',
        steps: [
          'Open Files inside the active project to view uploaded files and folders.',
          'Create folders by module, sprint, client, or document type so files are easier to find.',
          'Before uploading, confirm that you are in the correct project and folder.',
          'Upload the file, then use a clear file name if needed so others understand it before opening.',
          'Use open or preview actions to inspect documents quickly without manually downloading them.',
          'When a file belongs to a specific task, attach it or mention it in the task comments to preserve context.',
        ],
        tip: 'Include versions or dates in file names, such as “API-spec-v2” or “Sprint-05-report”, to avoid confusing old files with new ones.',
        note: 'Files inside a project should serve that project. Avoid using Files as a general storage area for unrelated documents.',
      },
      {
        id: 'settings',
        title: '7. Settings and members',
        description: 'Settings is where you manage project information, members, roles, and selected personal or project preferences.',
        steps: [
          'Open Settings when you need to update the project name, description, or configuration.',
          'Review the member list to see who belongs to the project and what role each person has.',
          'When inviting new people, create or send invitations through the system so they join the correct project.',
          'Assign roles based on responsibility: managers may need configuration permissions, while contributors usually need task-level permissions.',
          'If you cannot edit or delete something, check your current permissions in the project.',
          'In personal settings, update your profile, theme, or notifications so the workspace fits your working style.',
        ],
        tip: 'Grant only the permissions people actually need. This keeps project data easier to control.',
        note: 'Changing member roles can directly affect who can create, edit, delete, or configure data in the project.',
      },
      {
        id: 'tips',
        title: '8. Recommended workflow',
        description: 'This section suggests a daily way to use OCTOM so the team stays clear, misses less work, and can review progress easily.',
        steps: [
          'Start of day: open Dashboard for an overview, then go to Board to identify tasks that need priority.',
          'When receiving a task: read the description, deadline, priority, and checklist. If information is missing, ask in the task comments.',
          'When starting work: move the task into the in-progress status so the team knows you have picked it up.',
          'While working: update checklist items, leave progress comments, or attach files when important changes happen.',
          'When finished: verify completion criteria, move the task to done, and leave a note if needed.',
          'End of day or sprint: use Dashboard and Board to review overdue tasks, unassigned tasks, and tasks stuck for too long.',
        ],
        tip: 'The more consistently the team updates OCTOM, the more valuable it becomes. Update the system whenever status or scope changes.',
        note: 'Avoid keeping important decisions only outside the system. If a decision affects a task, record it in comments so the history stays clear.',
      },
    ],
  },
} as const

const copy = computed(() => content[language.value])
const quickStart = computed(() => copy.value.quickStart)
const guideSections = computed(() => copy.value.sections)

const activeIndex = computed(() => {
  const index = guideSections.value.findIndex((section) => section.id === activeSectionId.value)
  return index >= 0 ? index : 0
})

const activeSection = computed(() => guideSections.value[activeIndex.value])

watch(language, () => {
  if (!guideSections.value.some((section) => section.id === activeSectionId.value)) {
    activeSectionId.value = guideSections.value[0].id
  }
})

const vietnameseGuideDocument: {
  title: string
  subtitle: string
  quickStart: Array<{ title: string; text: string }>
  sections: DownloadGuideSection[]
} = {
  title: 'Hướng dẫn sử dụng OCTOM',
  subtitle:
    'Tài liệu này giúp người dùng nắm được toàn bộ quy trình sử dụng website OCTOM: từ đăng ký tài khoản, đăng nhập, tạo dự án, mời thành viên, quản lý công việc, theo dõi tiến độ, làm việc với tệp và phối hợp hằng ngày trong nhóm.',
  quickStart: [
    {
      title: 'Bắt đầu với tài khoản',
      text: 'Tạo tài khoản, đăng nhập, đăng xuất, đặt lại mật khẩu và bảo vệ thông tin truy cập.',
    },
    {
      title: 'Tổ chức dự án',
      text: 'Tạo project, chọn project đang làm việc, mời thành viên và quản lý vai trò trong nhóm.',
    },
    {
      title: 'Theo dõi tiến độ',
      text: 'Sử dụng Dashboard, Tasks, Board, Task Detail, Files và Settings để quản lý công việc xuyên suốt.',
    },
  ],
  sections: [
    {
      title: '1. Tài khoản và bảo mật',
      description:
        'Phần này dành cho người mới bắt đầu sử dụng hệ thống, bao gồm tạo tài khoản, đăng nhập, đăng xuất và xử lý khi quên mật khẩu.',
      steps: [
        'Tại màn hình đăng nhập, nếu chưa có tài khoản, bấm Create an account để chuyển sang màn hình đăng ký.',
        'Nhập họ tên hoặc tên nhóm dễ nhận diện, email đang sử dụng và mật khẩu đủ mạnh. Nên dùng mật khẩu có chữ hoa, chữ thường, số và ký tự đặc biệt.',
        'Sau khi đăng ký thành công, hệ thống sẽ tự đăng nhập và đưa bạn đến bước tạo project đầu tiên.',
        'Khi đã có tài khoản, quay lại màn hình Sign in, nhập email và mật khẩu để vào hệ thống.',
        'Nếu quên mật khẩu, bấm Forgot password, nhập đúng email đã đăng ký rồi kiểm tra hộp thư để mở liên kết đặt lại mật khẩu.',
        'Sau khi đặt lại mật khẩu, quay về màn hình đăng nhập và đăng nhập bằng mật khẩu mới.',
        'Khi không còn làm việc, dùng nút đăng xuất để kết thúc phiên đăng nhập và tránh người khác sử dụng tài khoản của bạn.',
      ],
      tip: 'Nên dùng email làm việc thật để nhận được lời mời dự án, thông báo và liên kết đặt lại mật khẩu.',
      note: 'Nếu không thấy email đặt lại mật khẩu, hãy kiểm tra thư mục spam hoặc chắc chắn rằng email nhập vào trùng với email đã đăng ký.',
    },
    {
      title: '2. Dự án',
      description:
        'Project là không gian làm việc chính, nơi chứa task, board, files, thành viên và các thiết lập của nhóm.',
      steps: [
        'Sau khi đăng nhập lần đầu, nếu chưa có project, hệ thống sẽ đưa bạn đến màn hình Create Project.',
        'Khi tạo project, đặt tên rõ ràng theo nhóm, sản phẩm hoặc giai đoạn làm việc để dễ phân biệt về sau.',
        'Vào Projects để xem toàn bộ dự án bạn đang tham gia và chọn dự án cần làm việc.',
        'Khi một project được chọn, các trang Tasks, Board, Files và Settings sẽ hoạt động theo project đó.',
        'Khi mời người mới, tạo invite link trong hệ thống và gửi cho đúng người cần tham gia.',
        'Người mở invite link phải đăng nhập trước. Sau khi đăng nhập, hệ thống sẽ hỏi xác nhận trước khi tham gia project.',
        'Nếu làm nhiều dự án cùng lúc, hãy kiểm tra project hiện tại trước khi tạo task hoặc tải file để tránh đưa dữ liệu nhầm nơi.',
      ],
      tip: 'Với nhóm lớn, nên thống nhất quy tắc đặt tên project, ví dụ “Tên sản phẩm - Giai đoạn”, để mọi người tìm nhanh hơn.',
      note: 'Một số chức năng phụ thuộc quyền của bạn trong project. Nếu không thấy nút thao tác, hãy kiểm tra vai trò với quản trị viên dự án.',
    },
    {
      title: '3. Dashboard',
      description:
        'Dashboard là màn hình tổng quan giúp bạn nắm tình hình dự án trước khi đi vào từng công việc cụ thể.',
      steps: [
        'Mở Dashboard sau khi đăng nhập để xem nhanh dự án hiện tại đang có bao nhiêu công việc và tiến độ tổng thể ra sao.',
        'Quan sát các chỉ số tổng quan như task đang mở, task hoàn thành, task trễ hạn hoặc các biểu đồ tiến độ nếu có.',
        'Dùng Dashboard như màn kiểm tra đầu ngày để xác định việc nào gấp, việc nào đang chậm và ai đang phụ trách.',
        'Nếu số liệu không đúng project mong muốn, hãy đổi project hiện tại rồi quay lại Dashboard.',
        'Sau khi xác định điểm cần xử lý, chuyển sang Tasks hoặc Board để cập nhật chi tiết từng task.',
      ],
      tip: 'Mỗi buổi sáng, hãy mở Dashboard trước khi vào Board để ưu tiên việc quan trọng thay vì xử lý task theo cảm tính.',
      note: 'Dashboard chỉ hữu ích khi task được cập nhật đều. Nếu nhóm không cập nhật trạng thái, số liệu tổng quan sẽ không phản ánh đúng thực tế.',
    },
    {
      title: '4. Công việc và Kanban Board',
      description:
        'Tasks dùng để quản lý danh sách công việc; Board dùng để nhìn tiến độ theo cột trạng thái và kéo thả nhanh.',
      steps: [
        'Vào Tasks để xem toàn bộ công việc của project dưới dạng danh sách, phù hợp khi cần tìm kiếm, lọc hoặc kiểm tra chi tiết.',
        'Khi tạo task mới, nhập tiêu đề ngắn gọn theo hành động cần làm, ví dụ “Thiết kế màn đăng nhập” thay vì “Đăng nhập”.',
        'Bổ sung mô tả, deadline, priority, label, sprint và assignee để người nhận task hiểu rõ việc cần làm và mức độ ưu tiên.',
        'Dùng bộ lọc hoặc tìm kiếm để nhanh chóng tìm task theo trạng thái, người phụ trách, mức độ ưu tiên hoặc từ khóa.',
        'Vào Board để xem task theo các cột trạng thái. Khi tiến độ thay đổi, kéo task sang cột tương ứng để cả nhóm nhìn thấy ngay.',
        'Nếu task quá lớn, mở chi tiết task và chia thành checklist hoặc subtask để dễ theo dõi.',
      ],
      tip: 'Một task tốt nên trả lời được bốn câu hỏi: làm gì, ai làm, khi nào xong và mức độ ưu tiên là gì.',
      note: 'Đừng tạo task quá chung chung. Task mơ hồ khiến người phụ trách khó bắt đầu và làm Dashboard mất độ chính xác.',
    },
    {
      title: '5. Chi tiết task',
      description:
        'Màn chi tiết task là nơi cập nhật toàn bộ thông tin sâu hơn: mô tả, trạng thái, người phụ trách, checklist, comment, file và lịch sử.',
      steps: [
        'Bấm vào một task trong danh sách hoặc Board để mở màn hình chi tiết.',
        'Kiểm tra tiêu đề và mô tả trước tiên để chắc chắn mọi người hiểu cùng một phạm vi công việc.',
        'Cập nhật trạng thái, priority, deadline, assignee và label khi có thay đổi để dữ liệu toàn hệ thống luôn mới.',
        'Dùng checklist hoặc subtask để chia nhỏ việc lớn thành các bước có thể hoàn thành từng phần.',
        'Dùng comment để trao đổi ngay trong task. Khi ai đó đọc lại, họ thấy đầy đủ ngữ cảnh thay vì phải tìm trong tin nhắn ngoài.',
        'Đính kèm file, ảnh hoặc tài liệu liên quan để người thực hiện không phải hỏi lại nguồn thông tin.',
        'Theo dõi activity log để biết ai đã thay đổi nội dung nào và thời điểm thay đổi.',
      ],
      tip: 'Khi giao việc, hãy ghi rõ tiêu chí hoàn thành trong mô tả hoặc checklist để giảm vòng hỏi lại.',
      note: 'Nếu thay đổi deadline hoặc người phụ trách, nên để lại comment ngắn nêu lý do để các thành viên khác hiểu bối cảnh.',
    },
    {
      title: '6. Tệp và thư mục',
      description:
        'Files giúp lưu trữ tài liệu theo project, tránh thất lạc file và giúp cả nhóm dùng chung một nguồn dữ liệu.',
      steps: [
        'Vào Files trong project hiện tại để xem các file và thư mục đã được tải lên.',
        'Tạo thư mục theo module, sprint, khách hàng hoặc loại tài liệu để cấu trúc file dễ tìm.',
        'Trước khi tải file, kiểm tra bạn đang ở đúng project và đúng thư mục.',
        'Tải file lên, sau đó đặt tên file rõ ràng nếu cần để người khác hiểu nội dung trước khi mở.',
        'Dùng chức năng mở hoặc xem trước để kiểm tra nhanh tài liệu mà không phải tải xuống thủ công.',
        'Khi file liên quan trực tiếp đến task, hãy đính kèm hoặc nhắc đến trong comment của task để nối đúng ngữ cảnh.',
      ],
      tip: 'Nên đặt tên file có phiên bản hoặc ngày tháng, ví dụ “API-spec-v2” hoặc “Bao-cao-sprint-05”, để tránh nhầm file cũ với file mới.',
      note: 'File nằm trong project nào thì nên phục vụ project đó. Không nên dùng Files làm kho lưu trữ chung cho tài liệu không liên quan.',
    },
    {
      title: '7. Cài đặt và thành viên',
      description:
        'Settings là nơi quản lý thông tin dự án, thành viên, vai trò và một số tùy chỉnh cá nhân hoặc dự án.',
      steps: [
        'Vào Settings khi cần cập nhật tên, mô tả hoặc cấu hình của project.',
        'Kiểm tra danh sách thành viên để biết ai đang tham gia project và vai trò của từng người.',
        'Khi mời người mới, tạo hoặc gửi invite theo luồng của hệ thống để họ vào đúng project.',
        'Gán vai trò phù hợp với trách nhiệm: người quản lý cần quyền cấu hình, thành viên thực hiện chỉ cần quyền thao tác task liên quan.',
        'Nếu bạn không thể sửa hoặc xóa một nội dung, hãy kiểm tra quyền hiện tại của tài khoản trong project.',
        'Ở phần cá nhân, cập nhật thông tin người dùng, theme hoặc thông báo để trải nghiệm làm việc phù hợp hơn.',
      ],
      tip: 'Hãy cấp quyền theo nguyên tắc vừa đủ. Người nào cần thao tác nào thì cấp quyền thao tác đó, tránh mở quyền quá rộng.',
      note: 'Thay đổi vai trò thành viên có thể ảnh hưởng trực tiếp đến khả năng tạo, sửa, xóa hoặc cấu hình dữ liệu trong project.',
    },
    {
      title: '8. Quy trình làm việc đề xuất',
      description:
        'Phần này gợi ý cách dùng OCTOM hằng ngày để nhóm làm việc rõ ràng, ít bỏ sót và dễ nhìn lại tiến độ.',
      steps: [
        'Đầu ngày: mở Dashboard để xem tổng quan, sau đó vào Board để xác định các task cần ưu tiên.',
        'Khi nhận task: đọc mô tả, deadline, priority và checklist. Nếu thiếu thông tin, hỏi ngay trong comment của task.',
        'Khi bắt đầu làm: chuyển task sang trạng thái đang xử lý để nhóm biết bạn đã nhận việc.',
        'Trong lúc làm: cập nhật checklist, comment tiến độ hoặc đính kèm file khi có thay đổi quan trọng.',
        'Khi hoàn thành: kiểm tra lại tiêu chí hoàn thành, cập nhật trạng thái sang hoàn tất và để lại ghi chú nếu cần.',
        'Cuối ngày hoặc cuối sprint: dùng Dashboard và Board để rà soát task trễ hạn, task chưa có người phụ trách và task bị kẹt lâu.',
      ],
      tip: 'Càng cập nhật đều, công cụ càng hữu ích. Mỗi lần thay đổi trạng thái hoặc phạm vi công việc, hãy cập nhật ngay trong OCTOM.',
      note: 'Tránh trao đổi quyết định quan trọng chỉ ở bên ngoài hệ thống. Nếu quyết định ảnh hưởng đến task, hãy ghi lại trong comment để không mất dấu.',
    },
  ],
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderSteps(steps: string[]) {
  return steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')
}

function downloadVietnameseGuide() {
  const sectionHtml = vietnameseGuideDocument.sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.description)}</p>
          <ol>${renderSteps(section.steps)}</ol>
          <p class="callout"><strong>Mẹo sử dụng:</strong> ${escapeHtml(section.tip)}</p>
          <p class="note"><strong>Lưu ý:</strong> ${escapeHtml(section.note)}</p>
        </section>
      `
    )
    .join('')

  const quickStartHtml = vietnameseGuideDocument.quickStart
    .map((item) => `<li><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.text)}</li>`)
    .join('')

  const documentHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(vietnameseGuideDocument.title)}</title>
        <style>
          body {
            font-family: "Times New Roman", serif;
            color: #111827;
            line-height: 1.55;
            font-size: 12pt;
          }
          h1 {
            color: #0f172a;
            font-size: 24pt;
            margin-bottom: 8px;
          }
          h2 {
            color: #075985;
            font-size: 16pt;
            margin-top: 26px;
            margin-bottom: 8px;
            border-bottom: 1px solid #bae6fd;
            padding-bottom: 4px;
          }
          p {
            margin: 8px 0;
          }
          ol, ul {
            margin-top: 8px;
            margin-bottom: 12px;
          }
          li {
            margin-bottom: 6px;
          }
          .subtitle {
            color: #334155;
            font-size: 12.5pt;
          }
          .meta {
            color: #64748b;
            font-size: 10.5pt;
            margin-bottom: 20px;
          }
          .callout {
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 8px 10px;
          }
          .note {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 8px 10px;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(vietnameseGuideDocument.title)}</h1>
        <p class="subtitle">${escapeHtml(vietnameseGuideDocument.subtitle)}</p>
        <p class="meta">Tài liệu tiếng Việt dành cho người dùng OCTOM.</p>
        <h2>Tổng quan nhanh</h2>
        <ul>${quickStartHtml}</ul>
        ${sectionHtml}
      </body>
    </html>
  `

  const blob = new Blob(['\ufeff', documentHtml], {
    type: 'application/msword;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'Huong-dan-su-dung-OCTOM.doc'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
</script>
