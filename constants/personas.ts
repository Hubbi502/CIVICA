import { PersonaType } from '@/types';

export interface PersonaInfo {
    id: PersonaType;
    name: string;
    icon: string;
    description: string;
    color: string;
    defaultInterests: string[];
    defaultPreferences: string[];
}

export const Personas: Record<PersonaType, PersonaInfo> = {
    merchant: {
        id: 'merchant',
        name: 'Merchant / UMKM',
        icon: 'store',
        description: 'Pemilik usaha kecil menengah yang ingin mempromosikan produk dan terhubung dengan pelanggan lokal',
        color: '#10B981',
        defaultInterests: ['bisnis', 'marketing', 'pelanggan', 'promo', 'delivery'],
        defaultPreferences: [
            'Promosi bisnis sekitar',
            'Tren pasar lokal',
            'Event bazaar dan pameran',
            'Tips UMKM',
            'Peluang kolaborasi',
        ],
    },
    office_worker: {
        id: 'office_worker',
        name: 'Office Worker',
        icon: 'briefcase',
        description: 'Pekerja kantoran yang butuh info tempat makan, transportasi, dan fasilitas sekitar kantor',
        color: '#3B82F6',
        defaultInterests: ['makan siang', 'kopi', 'coworking', 'transportasi', 'meeting'],
        defaultPreferences: [
            'Rekomendasi tempat makan',
            'Info lalu lintas',
            'Promo kantin dan kafe',
            'Coworking space',
            'Event networking',
        ],
    },
    resident: {
        id: 'resident',
        name: 'Resident',
        icon: 'home',
        description: 'Warga yang peduli dengan kondisi lingkungan sekitar dan ingin berkontribusi untuk perbaikan',
        color: '#F59E0B',
        defaultInterests: ['lingkungan', 'keamanan', 'fasilitas umum', 'komunitas', 'RT/RW'],
        defaultPreferences: [
            'Laporan infrastruktur',
            'Keamanan lingkungan',
            'Info RT/RW',
            'Acara komunitas',
            'Layanan publik',
        ],
    },
    student: {
        id: 'student',
        name: 'Student',
        icon: 'graduation-cap',
        description: 'Pelajar atau mahasiswa yang mencari tempat belajar, hangout, dan diskon khusus',
        color: '#8B5CF6',
        defaultInterests: ['belajar', 'nongkrong', 'diskon', 'wifi', 'kost'],
        defaultPreferences: [
            'Tempat belajar nyaman',
            'Promo untuk mahasiswa',
            'Cafe dengan WiFi',
            'Info kost dan kontrakan',
            'Event kampus',
        ],
    },
};

export const getPersonaById = (id: PersonaType): PersonaInfo => {
    return Personas[id];
};

export const getAllPersonas = (): PersonaInfo[] => {
    return Object.values(Personas);
};
