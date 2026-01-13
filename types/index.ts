export type PersonaType = 'merchant' | 'office_worker' | 'resident' | 'student';

export interface UserLocation {
    city: string;
    district: string;
    latitude?: number;
    longitude?: number;
}

export interface UserPreferences {
    nearbyRadius: number;
    notifications: {
        reports: boolean;
        news: boolean;
        promotions: boolean;
        comments: boolean;
        upvotes: boolean;
    };
    darkMode: boolean;
}

export interface UserStats {
    totalReports: number;
    totalUpvotes: number;
    resolvedIssues: number;
    points: number;
    level: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    persona: PersonaType;
    location: UserLocation;
    interests: string[];
    preferences: UserPreferences;
    stats: UserStats;
    badges: string[];
    createdAt: Date;
    updatedAt: Date;
}

export type PostType = 'REPORT' | 'PROMOTION' | 'NEWS' | 'GENERAL';
export type ReportStatus = 'active' | 'verified' | 'resolved' | 'closed';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PostLocation {
    address: string;
    city: string;
    district: string;
    latitude: number;
    longitude: number;
}

export interface AIClassification {
    category: PostType;
    confidence: number;
    severity?: SeverityLevel;
    tags: string[];
    keywords: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface PostMedia {
    url: string;
    type: 'image' | 'video';
    thumbnailUrl?: string;
}

export interface PostEngagement {
    upvotes: number;
    comments: number;
    shares: number;
    watchers: number;
    views: number;
}

export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    isAnonymous: boolean;

    content: string;
    media: PostMedia[];
    location: PostLocation;

    type: PostType;
    classification: AIClassification;

    engagement: PostEngagement;
    upvotedBy: string[];
    watchedBy: string[];

    createdAt: Date;
    updatedAt: Date;
}

export interface ReportUpdate {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    media?: PostMedia[];
    createdAt: Date;
}

export interface Report extends Post {
    type: 'REPORT';
    status: ReportStatus;
    severity: SeverityLevel;
    updates: ReportUpdate[];
    verifiedCount: number;
}

export interface BusinessLinks {
    whatsapp?: string;
    instagram?: string;
    tokopedia?: string;
    shopee?: string;
    website?: string;
    googleMaps?: string;
}

export interface BusinessDetails {
    name: string;
    category: string;
    priceRange?: string;
    operatingHours?: string;
    links: BusinessLinks;
    products?: string[];
}

export interface Promotion extends Post {
    type: 'PROMOTION';
    business: BusinessDetails;
}

export interface Comment {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    parentId?: string;
    likes: number;
    likedBy: string[];
    createdAt: Date;
    updatedAt: Date;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    timestamp: Date;
    metadata?: {
        type?: 'recommendation' | 'search' | 'info' | 'action';
        posts?: string[];
        locations?: PostLocation[];
    };
}

export interface QuickAction {
    id: string;
    icon: string;
    label: string;
    prompt: string;
}

export type NotificationType =
    | 'upvote'
    | 'comment'
    | 'reply'
    | 'report_update'
    | 'report_verified'
    | 'report_resolved'
    | 'new_follower'
    | 'achievement'
    | 'city_alert';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: {
        postId?: string;
        commentId?: string;
        userId?: string;
        badgeId?: string;
    };
    read: boolean;
    createdAt: Date;
}

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: BadgeRarity;
    requirement: string;
    category: 'contributor' | 'engagement' | 'streak' | 'special';
}

export interface UserBadge {
    badgeId: string;
    earnedAt: Date;
}

export interface CityStats {
    date: Date;
    newReports: number;
    resolvedIssues: number;
    activeUsers: number;
    avgResponseTime: number;
    healthScore: number;
}

export interface LeaderboardEntry {
    userId: string;
    userName: string;
    userAvatar?: string;
    reportCount: number;
    points: number;
    rank: number;
}

export interface FeedFilters {
    type?: PostType | 'all';
    radius?: number;
    sortBy?: 'recent' | 'trending' | 'nearby';
    status?: ReportStatus;
}

export interface SearchFilters extends FeedFilters {
    query?: string;
    category?: string;
    priceRange?: string;
    openNow?: boolean;
    hasDelivery?: boolean;
}
