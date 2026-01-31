import { Brand, Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { FeedFilters } from '@/types';
import { AlertTriangle, Filter, MapPin, MessageCircle, Newspaper, TrendingUp } from 'lucide-react-native';
import React, { memo, useCallback } from 'react';
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
    labelKey: string;
    icon: React.ComponentType<any>;
    value: Partial<FeedFilters>;
}

const FILTER_OPTIONS: FilterOption[] = [
    {
        id: 'all',
        labelKey: 'all',
        icon: Filter,
        value: { type: 'all', sortBy: 'recent' },
    },
    {
        id: 'nearby',
        labelKey: 'nearby',
        icon: MapPin,
        value: { sortBy: 'nearby', radius: 5 },
    },
    {
        id: 'trending',
        labelKey: 'trending',
        icon: TrendingUp,
        value: { sortBy: 'trending' },
    },
    {
        id: 'reports',
        labelKey: 'reports',
        icon: AlertTriangle,
        value: { type: 'REPORT' },
    },
    {
        id: 'news',
        labelKey: 'news',
        icon: Newspaper,
        value: { type: 'NEWS' },
    },
    {
        id: 'general',
        labelKey: 'general',
        icon: MessageCircle,
        value: { type: 'GENERAL' },
    },
];

function FilterBar({ filters, onFilterChange }: FilterBarProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { t } = useTranslation();

    const isActive = useCallback((option: FilterOption) => {
        // "Semua" is only active when type is 'all' or undefined AND sortBy is 'recent' or undefined
        if (option.id === 'all') {
            const isDefaultType = !filters.type || filters.type === 'all';
            const isDefaultSort = !filters.sortBy || filters.sortBy === 'recent';
            return isDefaultType && isDefaultSort;
        }

        // For type-based filters (reports, news, promotions), only active when this type is selected
        if (option.value.type) {
            return filters.type === option.value.type;
        }

        // For sortBy-based filters (nearby, trending), only active when this sortBy is selected
        // AND no specific type filter is active
        if (option.value.sortBy) {
            const noTypeFilter = !filters.type || filters.type === 'all';
            return filters.sortBy === option.value.sortBy && noTypeFilter;
        }

        return false;
    }, [filters.type, filters.sortBy]);

    const handlePress = useCallback((option: FilterOption) => {
        // When selecting a type-based filter, reset sortBy to default
        if (option.value.type) {
            onFilterChange({
                ...filters,
                type: option.value.type,
                sortBy: 'recent', // Reset sortBy when selecting a type filter
            });
        }
        // When selecting a sortBy-based filter (including 'all'), reset type to default
        else if (option.value.sortBy) {
            onFilterChange({
                ...filters,
                ...option.value,
                type: 'all', // Reset type when selecting a sortBy filter
            });
        }
        else {
            onFilterChange({
                ...filters,
                ...option.value,
            });
        }
    }, [filters, onFilterChange]);

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                removeClippedSubviews={false}
            >
                {FILTER_OPTIONS.map((option, index) => {
                    const Icon = option.icon;
                    const active = isActive(option);
                    const isLast = index === FILTER_OPTIONS.length - 1;

                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.filterButton,
                                {
                                    backgroundColor: active ? Brand.primary : colors.surface,
                                    borderColor: active ? Brand.primary : colors.border,
                                    marginRight: isLast ? 0 : Spacing.sm,
                                },
                            ]}
                            onPress={() => handlePress(option)}
                            activeOpacity={0.7}
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
                                {t(option.labelKey)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

export default memo(FilterBar);

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.sm,
    },
    scrollContent: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        alignItems: 'center',
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
