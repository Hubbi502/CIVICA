import { db } from '@/FirebaseConfig';
import { UserStats } from '@/types';
import { doc, runTransaction } from 'firebase/firestore';

export const LEVEL_CONFIG = {
    bronze: { target: 100, next: 'silver', label: 'Bronze' },
    silver: { target: 200, next: 'gold', label: 'Silver' },
    gold: { target: 350, next: 'diamond', label: 'Gold' },
    diamond: { target: 500, next: 'diamond', label: 'Diamond' }, // Max level for now
} as const;

export const POINTS_PER_UPVOTE = 0.4; // 5 upvotes = 2 points -> 1 upvote = 0.4 points

export const updateUserPoints = async (userId: string, change: number) => {
    console.log('[updateUserPoints] Called with userId:', userId, 'change:', change);
    try {
        const userRef = doc(db, 'users', userId);

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error('User does not exist');
            }

            const userData = userDoc.data();
            const currentStats: UserStats = userData.stats || {
                totalReports: 0,
                totalUpvotes: 0,
                resolvedIssues: 0,
                points: 0,
                level: 'bronze',
            };

            let newPoints = (currentStats.points || 0) + change;
            let newLevel = currentStats.level;

            // Handle negative points (floor at 0)
            if (newPoints < 0) newPoints = 0;

            // Check for level up
            const currentLevelConfig = LEVEL_CONFIG[newLevel as keyof typeof LEVEL_CONFIG];

            if (currentLevelConfig && newPoints >= currentLevelConfig.target) {
                // Determine next level
                const nextLevel = currentLevelConfig.next as keyof typeof LEVEL_CONFIG;

                // Only upgrade if different (handling Diamond cap)
                if (nextLevel !== newLevel) {
                    newLevel = nextLevel;
                    newPoints = 0; // Reset points on level up
                }
            }

            // Update stats
            console.log('[updateUserPoints] Updating user stats - newPoints:', newPoints, 'newLevel:', newLevel);
            transaction.update(userRef, {
                'stats.points': newPoints,
                'stats.level': newLevel,
            });
        });
    } catch (error) {
        console.error('Error updating user points:', error);
    }
};

export const getBadgeStatus = (stats: UserStats) => {
    return {
        "1": stats.totalReports >= 1,       // Pemula
        "2": stats.totalReports >= 5,       // Pelapor
        "3": stats.resolvedIssues >= 1,     // Terverifikasi
        "4": stats.totalUpvotes >= 10,      // Penolong
        "5": stats.points >= 1000,          // Top 10 (Placeholder)
        "6": false,                         // Streak 7 (Placeholder)
    };
};

/**
 * Update user's total upvote count in their stats
 */
export const updateUserUpvoteCount = async (userId: string, change: number) => {
    console.log('[updateUserUpvoteCount] Called with userId:', userId, 'change:', change);
    try {
        const userRef = doc(db, 'users', userId);

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error('User does not exist');
            }

            const userData = userDoc.data();
            const currentStats = userData.stats || {
                totalReports: 0,
                totalUpvotes: 0,
                resolvedIssues: 0,
                points: 0,
                level: 'bronze',
            };

            let newTotalUpvotes = (currentStats.totalUpvotes || 0) + change;
            if (newTotalUpvotes < 0) newTotalUpvotes = 0;

            transaction.update(userRef, {
                'stats.totalUpvotes': newTotalUpvotes,
            });
        });
    } catch (error) {
        console.error('Error updating user upvote count:', error);
    }
};
