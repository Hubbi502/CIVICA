import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

const STEPS = ['location', 'interests', 'persona', 'preferences'];

export default function OnboardingLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const pathname = usePathname();

    const currentStep = STEPS.findIndex(step => pathname.includes(step));
    const progress = currentStep >= 0 ? (currentStep + 1) / STEPS.length : 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
                <View
                    style={[
                        styles.progressBar,
                        {
                            width: `${progress * 100}%`,
                            backgroundColor: Brand.primary,
                        }
                    ]}
                />
            </View>

            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="location" />
                <Stack.Screen name="interests" />
                <Stack.Screen name="persona" />
                <Stack.Screen name="preferences" />
            </Stack>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    progressContainer: {
        height: 4,
        width: '100%',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
});
