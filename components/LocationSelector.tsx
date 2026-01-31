import { Brand, Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PostLocation } from '@/types';
import * as Location from 'expo-location';
import { MapPin, Navigation, Search, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface LocationSelectorProps {
    onLocationSelect: (location: PostLocation | null) => void;
    initialLocation?: PostLocation | null;
}

type LocationMode = 'auto' | 'manual' | 'none';

export default function LocationSelector({ onLocationSelect, initialLocation }: LocationSelectorProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [mode, setMode] = useState<LocationMode>('none');
    const [isLoading, setIsLoading] = useState(false);
    const [manualAddress, setManualAddress] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<PostLocation | null>(null);

    // Init from props
    useEffect(() => {
        if (initialLocation) {
            setSelectedLocation(initialLocation);
            if (initialLocation.latitude !== 0 && initialLocation.longitude !== 0) {
                // Heuristic: If we have specific coords, assume manual or auto based on data presence
                // For simplicity in edit mode, default to manual if address exists so they can edit it
                setMode('manual');
                setManualAddress(initialLocation.address);
            }
        }
    }, []);

    const handleAutoLocation = async () => {
        setMode('auto');
        setIsLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Izin lokasi diperlukan untuk fitur ini.');
                setMode('none');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            // Web specific handling for Reverse Geocoding via Photon (CORS friendly)
            if (Platform.OS === 'web') {
                try {
                    const response = await fetch(
                        `https://photon.komoot.io/reverse?lat=${location.coords.latitude}&lon=${location.coords.longitude}`
                    );
                    const data = await response.json();

                    if (data && data.features && data.features.length > 0) {
                        const feature = data.features[0];
                        const props = feature.properties;

                        // Construct address from Photon/OSM properties
                        const name = props.name;
                        const street = props.street;
                        const district = props.suburb || props.district || props.locality;
                        const city = props.city || props.town || props.state;

                        // Prioritize Name if it's a POI, else Street
                        const displayParts = [name, street, district, city].filter(Boolean);
                        // Deduplicate parts
                        const uniqueParts = [...new Set(displayParts)];
                        const addressStr = uniqueParts.join(', ');

                        const newLocation: PostLocation = {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            address: addressStr || 'Lokasi Terdeteksi',
                            city: city || '',
                            district: district || '',
                        };
                        setSelectedLocation(newLocation);
                        onLocationSelect(newLocation);
                        return; // Exit success
                    }
                } catch (webErr) {
                    console.log('Web reverse geocode failed', webErr);
                    // Fallthrough to standard expo-location
                }
            }

            // Native or Fallback
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (reverseGeocode.length > 0) {
                const result = reverseGeocode[0];
                const address = [result.street, result.name, result.district, result.city].filter(Boolean).join(', ');
                const newLocation: PostLocation = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    address: address || 'Lokasi Terdeteksi',
                    city: result.city || '',
                    district: result.district || '',
                };
                setSelectedLocation(newLocation);
                onLocationSelect(newLocation);
            }
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Gagal mendapatkan lokasi saat ini.');
            setMode('none');
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSearch = async () => {
        if (!manualAddress.trim()) return;

        setIsLoading(true);
        try {
            // Use Photon (Komoot) for ALL platforms (Web & Mobile)
            // This provides consistent POI (Point of Interest) search results like "Monas" or "Stasiun"
            // which native geocoders often fail to find.
            try {
                const response = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(manualAddress)}&limit=1`
                );
                const data = await response.json();

                if (data && data.features && data.features.length > 0) {
                    const feature = data.features[0];
                    const [lon, lat] = feature.geometry.coordinates; // GeoJSON is [lon, lat]
                    const props = feature.properties;

                    const name = props.name;
                    const street = props.street;
                    const district = props.suburb || props.district || props.locality;
                    const city = props.city || props.town || props.state;

                    const displayParts = [name, street, district, city].filter(Boolean);
                    const uniqueParts = [...new Set(displayParts)];
                    const formattedAddress = uniqueParts.join(', ');

                    const newLocation: PostLocation = {
                        latitude: lat,
                        longitude: lon,
                        address: formattedAddress || manualAddress,
                        city: city || '',
                        district: district || '',
                    };

                    setSelectedLocation(newLocation);
                    onLocationSelect(newLocation);
                    return; // Exit success
                } else {
                    Alert.alert('Tidak Ditemukan', 'Alamat tidak ditemukan.');
                    return;
                }
            } catch (networkErr) {
                console.error('Photon geocode error:', networkErr);

                // FALLBACK: Use Native Geocoder if network request fails
                if (Platform.OS !== 'web') {
                    const geocoded = await Location.geocodeAsync(manualAddress);
                    if (geocoded.length > 0) {
                        const result = geocoded[0];
                        const reverseGeocode = await Location.reverseGeocodeAsync({
                            latitude: result.latitude,
                            longitude: result.longitude
                        });

                        let city = '', district = '';
                        if (reverseGeocode.length > 0) {
                            city = reverseGeocode[0].city || '';
                            district = reverseGeocode[0].district || '';
                        }

                        const newLocation: PostLocation = {
                            latitude: result.latitude,
                            longitude: result.longitude,
                            address: manualAddress,
                            city,
                            district
                        };
                        setSelectedLocation(newLocation);
                        onLocationSelect(newLocation);
                        return;
                    }
                }

                Alert.alert('Error', 'Gagal mencari lokasi. Pastikan koneksi internet aktif.');
            }
        } catch (error) {
            console.error('Error geocoding:', error);
            Alert.alert('Error', 'Gagal mencari lokasi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNone = () => {
        setMode('none');
        setSelectedLocation(null);
        onLocationSelect(null);
        setManualAddress('');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.text }]}>Lokasi Kejadian</Text>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, mode === 'auto' && { backgroundColor: Brand.primary + '20', borderColor: Brand.primary }]}
                    onPress={handleAutoLocation}
                >
                    <Navigation size={16} color={mode === 'auto' ? Brand.primary : colors.textMuted} />
                    <Text style={[styles.tabText, { color: mode === 'auto' ? Brand.primary : colors.textMuted }]}>
                        Otomatis
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, mode === 'manual' && { backgroundColor: Brand.primary + '20', borderColor: Brand.primary }]}
                    onPress={() => setMode('manual')}
                >
                    <MapPin size={16} color={mode === 'manual' ? Brand.primary : colors.textMuted} />
                    <Text style={[styles.tabText, { color: mode === 'manual' ? Brand.primary : colors.textMuted }]}>
                        Manual
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, mode === 'none' && { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                    onPress={handleNone}
                >
                    <X size={16} color={colors.textMuted} />
                    <Text style={[styles.tabText, { color: colors.textMuted }]}>
                        Tidak Ada
                    </Text>
                </TouchableOpacity>
            </View>

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Brand.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Mencari lokasi...</Text>
                </View>
            )}

            {!isLoading && mode === 'auto' && selectedLocation && (
                <View style={[styles.resultCard, { backgroundColor: Brand.primary + '10' }]}>
                    <Navigation size={20} color={Brand.primary} />
                    <Text style={[styles.resultText, { color: colors.text }]}>
                        {selectedLocation.address}
                    </Text>
                </View>
            )}

            {!isLoading && mode === 'manual' && (
                <View style={styles.mmContainer}>
                    <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="Masukkan alamat atau nama tempat..."
                            placeholderTextColor={colors.textMuted}
                            value={manualAddress}
                            onChangeText={setManualAddress}
                            onSubmitEditing={handleManualSearch}
                            returnKeyType="search"
                        />
                        <TouchableOpacity onPress={handleManualSearch} style={styles.searchButton}>
                            <Search size={20} color={colors.icon} />
                        </TouchableOpacity>
                    </View>
                    {selectedLocation && (
                        <View style={[styles.resultCard, { backgroundColor: Brand.primary + '10', marginTop: Spacing.sm }]}>
                            <MapPin size={20} color={Brand.primary} />
                            <Text style={[styles.resultText, { color: colors.text }]}>
                                {selectedLocation.address}
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
        borderRadius: Radius.lg,
        width: '100%',
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.sm,
    },
    tabs: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xs,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    tabText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
    },
    loadingText: {
        fontSize: FontSize.sm,
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.md,
    },
    resultText: {
        fontSize: FontSize.sm,
        flex: 1,
    },
    mmContainer: {
        gap: Spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
    },
    input: {
        flex: 1,
        paddingVertical: Spacing.sm,
        fontSize: FontSize.sm,
    },
    searchButton: {
        padding: Spacing.xs,
    },
});
