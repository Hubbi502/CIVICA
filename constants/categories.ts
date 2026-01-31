import { GeneralSubCategory, PostType, ReportStatus, SeverityLevel } from '@/types';

export interface PostTypeInfo {
    id: PostType;
    name: string;
    icon: string;
    color: string;
    description: string;
}

export const PostTypes: Record<PostType, PostTypeInfo> = {
    GENERAL: {
        id: 'GENERAL',
        name: 'Umum',
        icon: 'message-circle',
        color: '#6B7280',
        description: 'Posting umum tentang berbagai topik',
    },
    NEWS: {
        id: 'NEWS',
        name: 'Berita',
        icon: 'newspaper',
        color: '#3B82F6',
        description: 'Bagikan informasi, pengumuman, atau berita lokal',
    },
    REPORT: {
        id: 'REPORT',
        name: 'Laporan',
        icon: 'alert-triangle',
        color: '#EF4444',
        description: 'Laporkan masalah infrastruktur, keamanan, atau isu lingkungan',
    },
};

export interface GeneralSubCategoryInfo {
    id: GeneralSubCategory;
    name: string;
    icon: string;
    color: string;
}

export const GeneralSubCategories: Record<GeneralSubCategory, GeneralSubCategoryInfo> = {
    PROMOTION: { id: 'PROMOTION', name: 'Promosi', icon: 'shopping-bag', color: '#10B981' },
    SPORTS: { id: 'SPORTS', name: 'Olahraga', icon: 'dumbbell', color: '#F97316' },
    TECHNOLOGY: { id: 'TECHNOLOGY', name: 'Teknologi', icon: 'cpu', color: '#8B5CF6' },
    ENTERTAINMENT: { id: 'ENTERTAINMENT', name: 'Hiburan', icon: 'music', color: '#EC4899' },
    REAL_STORY: { id: 'REAL_STORY', name: 'Kisah Nyata', icon: 'book-open', color: '#14B8A6' },
    FICTION: { id: 'FICTION', name: 'Kisah Fiksi', icon: 'feather', color: '#A855F7' },
    OTHER: { id: 'OTHER', name: 'Lainnya', icon: 'more-horizontal', color: '#6B7280' },
};


export interface ReportCategory {
    id: string;
    name: string;
    icon: string;
    keywords: string[];
}

export const ReportCategories: ReportCategory[] = [
    {
        id: 'road',
        name: 'Jalan & Trotoar',
        icon: 'road',
        keywords: ['jalan', 'lubang', 'pothole', 'trotoar', 'aspal', 'rusak'],
    },
    {
        id: 'lighting',
        name: 'Penerangan',
        icon: 'lightbulb',
        keywords: ['lampu', 'gelap', 'penerangan', 'mati', 'PJU'],
    },
    {
        id: 'flooding',
        name: 'Banjir & Drainase',
        icon: 'droplets',
        keywords: ['banjir', 'genangan', 'drainase', 'selokan', 'air'],
    },
    {
        id: 'trash',
        name: 'Sampah',
        icon: 'trash-2',
        keywords: ['sampah', 'kotor', 'bau', 'TPA', 'menumpuk'],
    },
    {
        id: 'traffic',
        name: 'Lalu Lintas',
        icon: 'traffic-cone',
        keywords: ['macet', 'lalu lintas', 'lampu merah', 'kecelakaan', 'jalan'],
    },
    {
        id: 'safety',
        name: 'Keamanan',
        icon: 'shield-alert',
        keywords: ['aman', 'bahaya', 'pencurian', 'waspada', 'polisi'],
    },
    {
        id: 'facility',
        name: 'Fasilitas Umum',
        icon: 'building',
        keywords: ['fasum', 'taman', 'toilet', 'halte', 'rusak'],
    },
    {
        id: 'other',
        name: 'Lainnya',
        icon: 'more-horizontal',
        keywords: [],
    },
];

export interface BusinessCategory {
    id: string;
    name: string;
    icon: string;
}

export const BusinessCategories: BusinessCategory[] = [
    { id: 'food', name: 'Makanan & Minuman', icon: 'utensils' },
    { id: 'fashion', name: 'Fashion & Aksesoris', icon: 'shirt' },
    { id: 'beauty', name: 'Kecantikan & Kesehatan', icon: 'heart' },
    { id: 'electronics', name: 'Elektronik', icon: 'smartphone' },
    { id: 'home', name: 'Rumah Tangga', icon: 'home' },
    { id: 'services', name: 'Jasa & Layanan', icon: 'wrench' },
    { id: 'education', name: 'Pendidikan', icon: 'book-open' },
    { id: 'entertainment', name: 'Hiburan', icon: 'music' },
    { id: 'sports', name: 'Olahraga', icon: 'dumbbell' },
    { id: 'other', name: 'Lainnya', icon: 'more-horizontal' },
];

export interface SearchCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export const SearchCategories: SearchCategory[] = [
    { id: 'food', name: 'Kuliner', icon: 'utensils', color: '#EF4444' },
    { id: 'coffee', name: 'Kopi & Kafe', icon: 'coffee', color: '#8B4513' },
    { id: 'shopping', name: 'Belanja', icon: 'shopping-bag', color: '#EC4899' },
    { id: 'services', name: 'Layanan', icon: 'wrench', color: '#6366F1' },
    { id: 'coworking', name: 'Coworking', icon: 'laptop', color: '#3B82F6' },
    { id: 'health', name: 'Kesehatan', icon: 'heart-pulse', color: '#10B981' },
    { id: 'sports', name: 'Olahraga', icon: 'dumbbell', color: '#F97316' },
    { id: 'education', name: 'Pendidikan', icon: 'graduation-cap', color: '#8B5CF6' },
    { id: 'parks', name: 'Taman', icon: 'trees', color: '#22C55E' },
];

export interface SeverityInfo {
    id: SeverityLevel;
    name: string;
    color: string;
    description: string;
}

export const SeverityLevels: Record<SeverityLevel, SeverityInfo> = {
    low: {
        id: 'low',
        name: 'Ringan',
        color: '#10B981',
        description: 'Masalah kecil, tidak mengganggu',
    },
    medium: {
        id: 'medium',
        name: 'Sedang',
        color: '#F59E0B',
        description: 'Perlu perhatian, bisa mengganggu',
    },
    high: {
        id: 'high',
        name: 'Tinggi',
        color: '#EF4444',
        description: 'Masalah serius, perlu ditangani segera',
    },
    critical: {
        id: 'critical',
        name: 'Kritis',
        color: '#7C2D12',
        description: 'Darurat! Membahayakan keselamatan',
    },
};

export interface StatusInfo {
    id: ReportStatus;
    name: string;
    color: string;
    icon: string;
}

export const ReportStatuses: Record<ReportStatus, StatusInfo> = {
    active: {
        id: 'active',
        name: 'Aktif',
        color: '#3B82F6',
        icon: 'clock',
    },
    verified: {
        id: 'verified',
        name: 'Terverifikasi',
        color: '#10B981',
        icon: 'check-circle',
    },
    resolved: {
        id: 'resolved',
        name: 'Selesai',
        color: '#6B7280',
        icon: 'check-check',
    },
    closed: {
        id: 'closed',
        name: 'Ditutup',
        color: '#9CA3AF',
        icon: 'x-circle',
    },
};

export const DistanceOptions = [
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '20 km', value: 20 },
    { label: '50 km', value: 50 },
];

export const SortOptions = [
    { label: 'Terbaru', value: 'recent' },
    { label: 'Trending', value: 'trending' },
    { label: 'Terdekat', value: 'nearby' },
];
