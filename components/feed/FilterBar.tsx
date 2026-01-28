import { Brand, Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FeedFilters } from '@/types';
import { AlertTriangle, Filter, MapPin, Newspaper, ShoppingBag, TrendingUp } from 'lucide-react-native';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface FilterBarProps {
    filters: FeedFilters;
    onFilterChange: (filters: FeedFilters) => void;
}

interface FilterOption {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    value: Partial<FeedFilters>;
}

const FILTER_OPTIONS: FilterOption[] = [
    {
        id: 'all',
        label: 'Semua',
        icon: Filter,
        value: { type: 'all', sortBy: 'recent' },
    },
    {
        id: 'nearby',
        label: 'Terdekat',
        icon: MapPin,
        value: { sortBy: 'nearby', radius: 5 },
    },
    {
        id: 'trending',
        label: 'Trending',
        icon: TrendingUp,
        value: { sortBy: 'trending' },
    },
    {
        id: 'reports',
        label: 'Laporan',
        icon: AlertTriangle,
        value: { type: 'REPORT' },
    },
    {
        id: 'news',
        label: 'Berita',
        icon: Newspaper,
        value: { type: 'NEWS' },
    },
    {
        id: 'promotions',
        label: 'Promo',
        icon: ShoppingBag,
        value: { type: 'PROMOTION' },
    },
];

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const isActive = (option: FilterOption) => {
        if (option.id === 'all') {
            return !filters.type || filters.type === 'all';
        }
        if (option.value.type) {
            return filters.type === option.value.type;
        }
        if (option.value.sortBy) {
            return filters.sortBy === option.value.sortBy;
        }
        return false;
    };

    const handlePress = (option: FilterOption) => {
        onFilterChange({
            ...filters,
            ...option.value,
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {FILTER_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = isActive(option);

                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.filterButton,
                                {
                                    backgroundColor: active ? Brand.primary : colors.surface,
                                    borderColor: active ? Brand.primary : colors.border,
                                },
                            ]}
                            onPress={() => handlePress(option)}
                        >
                            <Icon
                                size={16}
                                color={active ? '#FFFFFF' : colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.filterText,
                                    { color: active ? '#FFFFFF' : colors.text },
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.sm,
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        borderWidth: 1,
        gap: 6,
    },
    filterText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
});
