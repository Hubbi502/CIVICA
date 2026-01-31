import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { UserLocation } from '@/types';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ChevronDown, ChevronRight, MapPin, Navigation } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const CITIES = [
    {
        name: 'Jakarta',
        districts: ['Menteng', 'Kemang', 'Kuningan', 'Sudirman', 'Thamrin', 'Senayan', 'Kelapa Gading', 'Pluit'],
    },
    {
        name: 'Bandung',
        districts: ['Dago', 'Braga', 'Ciumbuleuit', 'Buah Batu', 'Setiabudhi', 'Riau', 'Cihampelas'],
    },
    {
        name: 'Surabaya',
        districts: ['Gubeng', 'Tegalsari', 'Mulyorejo', 'Rungkut', 'Wonokromo', 'Sawahan'],
    },
    {
        name: 'Yogyakarta',
        districts: ['Malioboro', 'Prawirotaman', 'Kotabaru', 'Gondokusuman', 'Mergangsan'],
    },
    {
        name: 'Semarang',
        districts: ['Simpang Lima', 'Peterongan', 'Banyumanik', 'Tembalang', 'Pedurungan'],
    },
];

export default function LocationScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const { setOnboardingLocation } = useAuthStore();

    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [showCityPicker, setShowCityPicker] = useState(false);
    const [showDistrictPicker, setShowDistrictPicker] = useState(false);

    const selectedCityData = CITIES.find(c => c.name === selectedCity);

    const handleDetectLocation = async () => {
        setIsDetecting(true);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Mohon izinkan akses lokasi untuk mendeteksi lokasi Anda');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            // Use Photon API for web (CORS friendly, OSM-based)
            if (Platform.OS === 'web') {
                try {
                    const response = await fetch(
                        `https://photon.komoot.io/reverse?lat=${location.coords.latitude}&lon=${location.coords.longitude}`
                    );
                    const data = await response.json();

                    if (data && data.features && data.features.length > 0) {
                        const props = data.features[0].properties;
                        const district = props.suburb || props.district || props.locality || '';
                        const city = props.city || props.town || props.state || '';

                        // Try to match with predefined cities
                        const matchedCity = CITIES.find(c =>
                            city.toLowerCase().includes(c.name.toLowerCase())
                        );

                        if (matchedCity) {
                            setSelectedCity(matchedCity.name);
                            // Try to match district
                            const matchedDistrict = matchedCity.districts.find(d =>
                                district.toLowerCase().includes(d.toLowerCase())
                            );
                            setSelectedDistrict(matchedDistrict || matchedCity.districts[0] || district);
                        } else {
                            setSelectedCity(city || 'Unknown');
                            setSelectedDistrict(district || 'Unknown');
                        }
                        return;
                    }
                } catch (webErr) {
                    console.log('Web reverse geocode failed, trying native fallback', webErr);
                }
            }

            // Native fallback (iOS/Android)
            const [address] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (address) {
                const matchedCity = CITIES.find(c =>
                    address.city?.toLowerCase().includes(c.name.toLowerCase()) ||
                    address.region?.toLowerCase().includes(c.name.toLowerCase())
                );

                if (matchedCity) {
                    setSelectedCity(matchedCity.name);
                    if (matchedCity.districts.length > 0) {
                        setSelectedDistrict(matchedCity.districts[0]);
                    }
                } else {
                    setSelectedCity(address.city || address.region || 'Unknown');
                    setSelectedDistrict(address.district || address.subregion || 'Unknown');
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Gagal mendeteksi lokasi. Silakan pilih manual.');
        } finally {
            setIsDetecting(false);
        }
    };

    const handleContinue = () => {
        if (!selectedCity || !selectedDistrict) {
            Alert.alert('Error', 'Mohon pilih kota dan kecamatan');
            return;
        }

        const location: UserLocation = {
            city: selectedCity,
            district: selectedDistrict,
        };

        setOnboardingLocation(location);
        router.push('/(onboarding)/interests' as any);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: Brand.primary + '20' }]}>
                    <MapPin size={32} color={Brand.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Di mana lokasi Anda?</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Pilih lokasi untuk mendapatkan informasi yang relevan dengan area Anda
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.detectButton, { backgroundColor: Brand.primary }]}
                onPress={handleDetectLocation}
                disabled={isDetecting}
            >
                {isDetecting ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <>
                        <Navigation size={20} color="#FFFFFF" />
                        <Text style={styles.detectButtonText}>Deteksi Lokasi Otomatis</Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>atau pilih manual</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <View style={[styles.pickerGroup, { zIndex: showCityPicker ? 10 : 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Kota</Text>
                <TouchableOpacity
                    style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                        setShowCityPicker(!showCityPicker);
                        setShowDistrictPicker(false);
                    }}
                    activeOpacity={0.7}
                >
                    <View style={styles.pickerContent}>
                        <MapPin size={18} color={selectedCity ? Brand.primary : colors.textMuted} />
                        <Text
                            style={[
                                styles.pickerText,
                                { color: selectedCity ? colors.text : colors.textMuted }
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {selectedCity || 'Pilih kota'}
                        </Text>
                    </View>
                    <ChevronDown
                        size={20}
                        color={colors.icon}
                        style={{ transform: [{ rotate: showCityPicker ? '180deg' : '0deg' }] }}
                    />
                </TouchableOpacity>

                {showCityPicker && (
                    <View style={[styles.pickerOptions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <ScrollView
                            style={styles.pickerScroll}
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                        >
                            {CITIES.map((city, index) => (
                                <TouchableOpacity
                                    key={city.name}
                                    style={[
                                        styles.pickerOption,
                                        selectedCity === city.name && styles.pickerOptionSelected,
                                        index === CITIES.length - 1 && styles.pickerOptionLast
                                    ]}
                                    onPress={() => {
                                        setSelectedCity(city.name);
                                        setSelectedDistrict(null);
                                        setShowCityPicker(false);
                                    }}
                                    activeOpacity={0.6}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            { color: selectedCity === city.name ? Brand.primary : colors.text },
                                            selectedCity === city.name && styles.pickerOptionTextSelected
                                        ]}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {city.name}
                                    </Text>
                                    {selectedCity === city.name && (
                                        <View style={styles.checkmark}>
                                            <Text style={styles.checkmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            <View style={[styles.pickerGroup, { zIndex: showDistrictPicker ? 10 : 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Kecamatan / Area</Text>
                <TouchableOpacity
                    style={[
                        styles.picker,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        !selectedCity && styles.pickerDisabled
                    ]}
                    onPress={() => {
                        if (selectedCity) {
                            setShowDistrictPicker(!showDistrictPicker);
                            setShowCityPicker(false);
                        }
                    }}
                    disabled={!selectedCity}
                    activeOpacity={0.7}
                >
                    <View style={styles.pickerContent}>
                        <MapPin size={18} color={selectedDistrict ? Brand.primary : colors.textMuted} />
                        <Text
                            style={[
                                styles.pickerText,
                                { color: selectedDistrict ? colors.text : colors.textMuted }
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {selectedDistrict || 'Pilih kecamatan'}
                        </Text>
                    </View>
                    <ChevronDown
                        size={20}
                        color={colors.icon}
                        style={{ transform: [{ rotate: showDistrictPicker ? '180deg' : '0deg' }] }}
                    />
                </TouchableOpacity>

                {showDistrictPicker && selectedCityData && (
                    <View style={[styles.pickerOptions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <ScrollView
                            style={styles.pickerScroll}
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                        >
                            {selectedCityData.districts.map((district, index) => (
                                <TouchableOpacity
                                    key={district}
                                    style={[
                                        styles.pickerOption,
                                        selectedDistrict === district && styles.pickerOptionSelected,
                                        index === selectedCityData.districts.length - 1 && styles.pickerOptionLast
                                    ]}
                                    onPress={() => {
                                        setSelectedDistrict(district);
                                        setShowDistrictPicker(false);
                                    }}
                                    activeOpacity={0.6}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            { color: selectedDistrict === district ? Brand.primary : colors.text },
                                            selectedDistrict === district && styles.pickerOptionTextSelected
                                        ]}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {district}
                                    </Text>
                                    {selectedDistrict === district && (
                                        <View style={styles.checkmark}>
                                            <Text style={styles.checkmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={[
                    styles.continueButton,
                    (!selectedCity || !selectedDistrict) && styles.buttonDisabled
                ]}
                onPress={handleContinue}
                disabled={!selectedCity || !selectedDistrict}
            >
                <Text style={styles.continueButtonText}>Lanjutkan</Text>
                <ChevronRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
        paddingTop: Spacing['3xl'],
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.md,
        textAlign: 'center',
        lineHeight: 22,
    },
    detectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        height: 52,
        borderRadius: Radius.lg,
        ...Shadows.md,
    },
    detectButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.xl,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: Spacing.md,
        fontSize: FontSize.sm,
    },
    pickerGroup: {
        marginBottom: Spacing.lg,
        zIndex: 1,
        position: 'relative',
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.sm,
    },
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.md,
        height: 56,
        ...Shadows.sm,
    },
    pickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: Spacing.sm,
        marginRight: Spacing.sm,
    },
    pickerDisabled: {
        opacity: 0.5,
    },
    pickerText: {
        fontSize: FontSize.md,
        flex: 1,
    },
    pickerOptions: {
        position: 'absolute',
        top: 85,
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: Radius.lg,
        maxHeight: 220,
        overflow: 'hidden',
        ...Shadows.lg,
        zIndex: 100,
        elevation: 10,
    },
    pickerScroll: {
        maxHeight: 220,
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        minHeight: 48,
    },
    pickerOptionSelected: {
        backgroundColor: Brand.primary + '12',
    },
    pickerOptionLast: {
        borderBottomWidth: 0,
    },
    pickerOptionText: {
        fontSize: FontSize.md,
        flex: 1,
    },
    pickerOptionTextSelected: {
        fontWeight: FontWeight.semibold,
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Spacing.sm,
    },
    checkmarkText: {
        color: '#FFFFFF',
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Brand.primary,
        height: 52,
        borderRadius: Radius.lg,
        marginTop: Spacing.xl,
        ...Shadows.md,
    },
    buttonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
});
