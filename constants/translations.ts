import { Language } from "@/stores/languageStore";

export const translations: Record<Language, Record<string, string>> = {
  id: {
    // Settings
    settings: "Pengaturan",
    account: "AKUN",
    editProfile: "Edit Profil",
    security: "Keamanan",
    privacy: "Privasi",
    preferences: "PREFERENSI",
    notifications: "Notifikasi",
    darkMode: "Mode Gelap",
    language: "Bahasa",
    locationServices: "Layanan Lokasi",
    support: "DUKUNGAN",
    helpCenter: "Pusat Bantuan",
    aboutCivica: "Tentang CIVICA",

    // Language options
    indonesian: "Indonesia",
    english: "English",
    selectLanguage: "Pilih Bahasa",

    // Filter bar
    all: "Semua",
    nearby: "Terdekat",
    trending: "Trending",
    reports: "Laporan",
    news: "Berita",
    promotions: "Promo",

    // Home screen
    hello: "Halo",
    location: "Lokasi",
    noPosts: "Belum ada postingan",
    beFirst: "Jadilah yang pertama berbagi informasi di area ini!",

    // Common
    cancel: "Batal",
    save: "Simpan",
    confirm: "Konfirmasi",
    back: "Kembali",
    next: "Lanjut",
    done: "Selesai",
    search: "Cari",
    signOut: "Keluar",
    total: "Total",

    // Profile screen
    profile: "Profil",
    reportsCount: "Laporan",
    upvotesCount: "Dukungan",
    resolved: "Selesai",
    badges: "Lencana",
    seeAll: "Lihat Semua",
    yourImpact: "Dampak Anda",
    impactText: "Bulan ini Anda telah membantu",
    problemsResolved: "masalah",
    andYourPosts: "terselesaikan dan postingan Anda dilihat",
    people: "orang!",
    appearance: "Tampilan",
    help: "Bantuan",

    // Badge names
    beginner: "Pemula",
    reporter: "Pelapor",
    verified: "Terverifikasi",
    helper: "Penolong",
    top10: "Top 10",
    streak7: "Streak 7",

    // Level names
    bronze: "Perunggu",
    silver: "Perak",
    gold: "Emas",
    diamond: "Berlian",

    // Reports screen
    myReports: "Laporan Saya",
    active: "Aktif",
    verifiedStatus: "Terverifikasi",
    resolvedStatus: "Selesai",
    closed: "Ditutup",
    noReports: "Belum ada laporan",
    startReporting:
      "Mulai laporkan masalah di sekitar Anda untuk membantu komunitas",
    createReport: "Buat Laporan",
    following: "mengikuti",

    // Pulse screen
    cityPulse: "Denyut Kota",
    cityReport: "Laporan Kota",
    todaysSnapshot: "Ringkasan Hari Ini",
    weeklyStats: "Statistik Mingguan",
    newReports: "Laporan Baru",
    resolvedToday: "Terselesaikan",
    activeUsers: "Pengguna Aktif",
    avgResponse: "Rata-rata Respon",
    hour: "jam",
    urgentIssues: "Isu Mendesak",
    topContributors: "Top Kontributor",
    weeklyActivity: "Aktivitas Mingguan",
    reportsLabel: "Laporan",
    resolvedLabel: "Selesai",
    loadingData: "Memuat data...",
    noUrgentIssues: "Tidak ada isu mendesak saat ini",
    noContributors: "Belum ada kontributor",
    today: "Hari ini",
    ago: "lalu",

    // Severity
    critical: "Kritis",
    high: "Tinggi",
    medium: "Sedang",
    low: "Rendah",

    // Time
    justNow: "Baru saja",
    minutesAgo: "menit yang lalu",
    hoursAgo: "jam yang lalu",
    daysAgo: "hari yang lalu",

    // Days
    monday: "Sen",
    tuesday: "Sel",
    wednesday: "Rab",
    thursday: "Kam",
    friday: "Jum",
    saturday: "Sab",
    sunday: "Min",

    // Chatbot
    civicaAssistant: "Asisten CIVICA",
    askAnything: "Tanyakan apa saja tentang masalah publik...",
    typeMessage: "Ketik pesan...",
    goodMorning: "Selamat pagi",
    goodAfternoon: "Selamat siang",
    goodEvening: "Selamat sore",
    goodNight: "Selamat malam",
    greeting: "Ada yang bisa saya bantu hari ini?",

    // Create post
    createPost: "Buat Postingan",
    whatHappening: "Apa yang sedang terjadi?",
    addPhoto: "Tambah Foto",
    addLocation: "Tambah Lokasi",
    post: "Posting",
    report: "Laporan",
    newsPost: "Berita",
    promotion: "Promo",
    selectCategory: "Pilih Kategori",
    describeProblem: "Jelaskan masalah yang Anda temui...",

    // Tab bar
    home: "Beranda",
    pulse: "Laporan",
    chat: "Chat",

    // Auth
    login: "Masuk",
    register: "Daftar",
    email: "Email",
    password: "Kata Sandi",
    confirmPassword: "Konfirmasi Kata Sandi",
    fullName: "Nama Lengkap",
    forgotPassword: "Lupa Kata Sandi?",
    noAccount: "Belum punya akun?",
    haveAccount: "Sudah punya akun?",
    loginSubtitle: "Masuk untuk melanjutkan",
    registerSubtitle: "Buat akun baru",
    resetPassword: "Atur Ulang Kata Sandi",
    sendResetLink: "Kirim Link Reset",

    // Onboarding
    welcome: "Selamat Datang",
    letsSetup: "Mari atur preferensi Anda",
    selectLocation: "Pilih Lokasi",
    selectInterests: "Pilih Minat",
    selectPersona: "Pilih Persona",
  },
  en: {
    // Settings
    settings: "Settings",
    account: "ACCOUNT",
    editProfile: "Edit Profile",
    security: "Security",
    privacy: "Privacy",
    preferences: "PREFERENCES",
    notifications: "Notifications",
    darkMode: "Dark Mode",
    language: "Language",
    locationServices: "Location Services",
    support: "SUPPORT",
    helpCenter: "Help Center",
    aboutCivica: "About CIVICA",

    // Language options
    indonesian: "Indonesia",
    english: "English",
    selectLanguage: "Select Language",

    // Filter bar
    all: "All",
    nearby: "Nearby",
    trending: "Trending",
    reports: "Reports",
    news: "News",
    promotions: "Promos",

    // Home screen
    hello: "Hello",
    location: "Location",
    noPosts: "No posts yet",
    beFirst: "Be the first to share information in this area!",

    // Common
    cancel: "Cancel",
    save: "Save",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    done: "Done",
    search: "Search",
    signOut: "Sign Out",
    total: "Total",

    // Profile screen
    profile: "Profile",
    reportsCount: "Reports",
    upvotesCount: "Upvotes",
    resolved: "Resolved",
    badges: "Badges",
    seeAll: "See All",
    yourImpact: "Your Impact",
    impactText: "This month you have helped",
    problemsResolved: "problems",
    andYourPosts: "get resolved and your posts were viewed by",
    people: "people!",
    appearance: "Appearance",
    help: "Help",

    // Badge names
    beginner: "Beginner",
    reporter: "Reporter",
    verified: "Verified",
    helper: "Helper",
    top10: "Top 10",
    streak7: "Streak 7",

    // Level names
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
    diamond: "Diamond",

    // Reports screen
    myReports: "My Reports",
    active: "Active",
    verifiedStatus: "Verified",
    resolvedStatus: "Resolved",
    closed: "Closed",
    noReports: "No reports yet",
    startReporting: "Start reporting issues around you to help the community",
    createReport: "Create Report",
    following: "following",

    // Pulse screen
    cityPulse: "City Pulse",
    cityReport: "City Reports",
    todaysSnapshot: "Today's Snapshot",
    weeklyStats: "Weekly Statistics",
    newReports: "New Reports",
    resolvedToday: "Resolved",
    activeUsers: "Active Users",
    avgResponse: "Avg Response",
    hour: "hour",
    urgentIssues: "Urgent Issues",
    topContributors: "Top Contributors",
    weeklyActivity: "Weekly Activity",
    reportsLabel: "Reports",
    resolvedLabel: "Resolved",
    loadingData: "Loading data...",
    noUrgentIssues: "No urgent issues right now",
    noContributors: "No contributors yet",
    today: "Today",
    ago: "ago",

    // Severity
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",

    // Time
    justNow: "Just now",
    minutesAgo: "minutes ago",
    hoursAgo: "hours ago",
    daysAgo: "days ago",

    // Days
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",

    // Chatbot
    civicaAssistant: "CIVICA Assistant",
    askAnything: "Ask anything about public issues...",
    typeMessage: "Type a message...",
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    goodNight: "Good night",
    greeting: "How can I help you today?",

    // Create post
    createPost: "Create Post",
    whatHappening: "What's happening?",
    addPhoto: "Add Photo",
    addLocation: "Add Location",
    post: "Post",
    report: "Report",
    newsPost: "News",
    promotion: "Promo",
    selectCategory: "Select Category",
    describeProblem: "Describe the problem you found...",

    // Tab bar
    home: "Home",
    pulse: "Reports",
    chat: "Chat",

    // Auth
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    fullName: "Full Name",
    forgotPassword: "Forgot Password?",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    loginSubtitle: "Sign in to continue",
    registerSubtitle: "Create a new account",
    resetPassword: "Reset Password",
    sendResetLink: "Send Reset Link",

    // Onboarding
    welcome: "Welcome",
    letsSetup: "Let's set up your preferences",
    selectLocation: "Select Location",
    selectInterests: "Select Interests",
    selectPersona: "Select Persona",
  },
};
