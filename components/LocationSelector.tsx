import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PostLocation } from '@/types';
import * as Location from 'expo-location';
import { Check, MapPin, Navigation, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
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

interface SearchResult {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string;
    latitude: number;
    longitude: number;
}

export default function LocationSelector({ onLocationSelect, initialLocation }: LocationSelectorProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [mode, setMode] = useState<LocationMode>('none');
    const [isLoading, setIsLoading] = useState(false);
    const [manualAddress, setManualAddress] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<PostLocation | null>(null);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showMapModal, setShowMapModal] = useState(false);
    const [pendingLocation, setPendingLocation] = useState<PostLocation | null>(null);

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
        setSearchResults([]);
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
        setSearchResults([]);
        try {
            // Use Photon (Komoot) for ALL platforms (Web & Mobile)
            // This provides consistent POI (Point of Interest) search results like "Monas" or "Stasiun"
            try {
                const response = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(manualAddress)}&limit=10`
                );
                const data = await response.json();

                if (data && data.features && data.features.length > 0) {
                    const results: SearchResult[] = data.features.map((feature: any, index: number) => {
                        const [lon, lat] = feature.geometry.coordinates; // GeoJSON is [lon, lat]
                        const props = feature.properties;

                        const name = props.name || '';
                        const street = props.street || '';
                        const district = props.suburb || props.district || props.locality || '';
                        const city = props.city || props.town || props.state || '';

                        const displayParts = [name, street, district, city].filter(Boolean);
                        const uniqueParts = [...new Set(displayParts)];
                        const formattedAddress = uniqueParts.join(', ');

                        return {
                            id: `${index}-${lat}-${lon}`,
                            name: name || formattedAddress.split(',')[0] || 'Lokasi',
                            address: formattedAddress || manualAddress,
                            city: city,
                            district: district,
                            latitude: lat,
                            longitude: lon,
                        };
                    });

                    setSearchResults(results);
                } else {
                    Alert.alert('Tidak Ditemukan', 'Alamat tidak ditemukan. Coba kata kunci lain.');
                }
            } catch (networkErr) {
                console.error('Photon geocode error:', networkErr);

                // FALLBACK: Use Native Geocoder if network request fails
                if (Platform.OS !== 'web') {
                    const geocoded = await Location.geocodeAsync(manualAddress);
                    if (geocoded.length > 0) {
                        const results: SearchResult[] = await Promise.all(
                            geocoded.slice(0, 5).map(async (result, index) => {
                                const reverseGeocode = await Location.reverseGeocodeAsync({
                                    latitude: result.latitude,
                                    longitude: result.longitude
                                });

                                let city = '', district = '', address = manualAddress;
                                if (reverseGeocode.length > 0) {
                                    city = reverseGeocode[0].city || '';
                                    district = reverseGeocode[0].district || '';
                                    address = [reverseGeocode[0].street, reverseGeocode[0].name, district, city]
                                        .filter(Boolean).join(', ') || manualAddress;
                                }

                                return {
                                    id: `native-${index}`,
                                    name: address.split(',')[0] || 'Lokasi',
                                    address,
                                    city,
                                    district,
                                    latitude: result.latitude,
                                    longitude: result.longitude,
                                };
                            })
                        );
                        setSearchResults(results);
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

    const handleSelectResult = (result: SearchResult) => {
        const newLocation: PostLocation = {
            latitude: result.latitude,
            longitude: result.longitude,
            address: result.address,
            city: result.city,
            district: result.district,
        };
        setPendingLocation(newLocation);
        setShowMapModal(true);
    };

    const confirmLocation = () => {
        if (pendingLocation) {
            setSelectedLocation(pendingLocation);
            onLocationSelect(pendingLocation);
            setSearchResults([]);
            setShowMapModal(false);
            setPendingLocation(null);
        }
    };

    // Generate MapLibre GL JS HTML for interactive map
    const getMapLibreHtml = (lat: number, lon: number) => {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://unpkg.com/maplibre-gl@4.1.0/dist/maplibre-gl.css" rel="stylesheet" />
    <script src="https://unpkg.com/maplibre-gl@4.1.0/dist/maplibre-gl.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        .marker {
            width: 30px;
            height: 30px;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ef4444" stroke="white" stroke-width="1"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>');
            background-size: contain;
            cursor: pointer;
        }
        .hint {
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-family: sans-serif;
            pointer-events: none;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="hint">Ketuk peta untuk mengubah lokasi</div>
    <script>
        const map = new maplibregl.Map({
            container: 'map',
            style: 'https://tiles.openfreemap.org/styles/liberty',
            center: [${lon}, ${lat}],
            zoom: 15
        });

        const el = document.createElement('div');
        el.className = 'marker';

        const marker = new maplibregl.Marker({ element: el, draggable: true })
            .setLngLat([${lon}, ${lat}])
            .addTo(map);

        function sendLocation(lngLat) {
            window.parent.postMessage({
                type: 'locationUpdate',
                latitude: lngLat.lat,
                longitude: lngLat.lng
            }, '*');
        }

        marker.on('dragend', () => {
            sendLocation(marker.getLngLat());
        });

        map.on('click', (e) => {
            marker.setLngLat(e.lngLat);
            sendLocation(e.lngLat);
        });
    </script>
</body>
</html>
        `;
    };

    // Handle messages from the MapLibre iframe
    const handleMapMessage = useCallback(async (event: MessageEvent) => {
        if (event.data?.type === 'locationUpdate') {
            const { latitude, longitude } = event.data;

            // Reverse geocode the new location
            try {
                const response = await fetch(
                    `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`
                );
                const data = await response.json();

                let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                let city = '';
                let district = '';

                if (data?.features?.length > 0) {
                    const props = data.features[0].properties;
                    const name = props.name;
                    const street = props.street;
                    district = props.suburb || props.district || props.locality || '';
                    city = props.city || props.town || props.state || '';

                    const displayParts = [name, street, district, city].filter(Boolean);
                    const uniqueParts = [...new Set(displayParts)];
                    address = uniqueParts.join(', ') || address;
                }

                setPendingLocation({
                    latitude,
                    longitude,
                    address,
                    city,
                    district,
                });
            } catch (error) {
                console.error('Reverse geocode error:', error);
                setPendingLocation(prev => prev ? {
                    ...prev,
                    latitude,
                    longitude,
                } : null);
            }
        }
    }, []);

    // Listen for postMessage from MapLibre iframe
    useEffect(() => {
        if (showMapModal) {
            window.addEventListener('message', handleMapMessage);
            return () => window.removeEventListener('message', handleMapMessage);
        }
    }, [showMapModal, handleMapMessage]);

    const handleNone = () => {
        setMode('none');
        setSelectedLocation(null);
        onLocationSelect(null);
        setManualAddress('');
        setSearchResults([]);
    };

    const renderSearchResult = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity
            style={[styles.resultItem, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => handleSelectResult(item)}
        >
            <MapPin size={18} color={Brand.primary} />
            <View style={styles.resultItemContent}>
                <Text style={[styles.resultItemName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={[styles.resultItemAddress, { color: colors.textMuted }]} numberOfLines={2}>
                    {item.address}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderMapModal = () => (
        <Modal
            visible={showMapModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowMapModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Konfirmasi Lokasi</Text>
                        <TouchableOpacity onPress={() => setShowMapModal(false)}>
                            <X size={24} color={colors.icon} />
                        </TouchableOpacity>
                    </View>

                    {pendingLocation && (
                        <View style={styles.modalBody}>
                            <View style={[styles.locationPreview, { backgroundColor: Brand.primary + '10' }]}>
                                <MapPin size={24} color={Brand.primary} />
                                <View style={styles.locationPreviewText}>
                                    <Text style={[styles.locationName, { color: colors.text }]} numberOfLines={2}>
                                        {pendingLocation.address}
                                    </Text>
                                    <Text style={[styles.locationCoords, { color: colors.textMuted }]}>
                                        {pendingLocation.latitude.toFixed(6)}, {pendingLocation.longitude.toFixed(6)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.mapContainer}>
                                <iframe
                                    srcDoc={getMapLibreHtml(pendingLocation.latitude, pendingLocation.longitude)}
                                    style={{
                                        width: '100%',
                                        height: 250,
                                        border: 'none',
                                        borderRadius: 8,
                                    }}
                                    title="Location Map"
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.cancelButton, { borderColor: colors.border }]}
                                    onPress={() => setShowMapModal(false)}
                                >
                                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Batal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={confirmLocation}
                                >
                                    <Check size={18} color="#FFFFFF" />
                                    <Text style={styles.confirmButtonText}>Pilih Lokasi Ini</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );

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
                        Sekarang
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, mode === 'manual' && { backgroundColor: Brand.primary + '20', borderColor: Brand.primary }]}
                    onPress={() => { setMode('manual'); setSearchResults([]); }}
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

                    {searchResults.length > 0 && (
                        <View style={[styles.searchResultsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.searchResultsTitle, { color: colors.textSecondary }]}>
                                Pilih lokasi:
                            </Text>
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item) => item.id}
                                renderItem={renderSearchResult}
                                style={styles.searchResultsList}
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled
                            />
                        </View>
                    )}

                    {selectedLocation && searchResults.length === 0 && (
                        <View style={[styles.resultCard, { backgroundColor: Brand.primary + '10', marginTop: Spacing.sm }]}>
                            <MapPin size={20} color={Brand.primary} />
                            <Text style={[styles.resultText, { color: colors.text }]}>
                                {selectedLocation.address}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {renderMapModal()}
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
    searchResultsContainer: {
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: Spacing.sm,
        maxHeight: 250,
    },
    searchResultsTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xs,
    },
    searchResultsList: {
        maxHeight: 200,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        padding: Spacing.sm,
        borderRadius: Radius.md,
        marginBottom: Spacing.xs,
        borderWidth: 1,
    },
    resultItemContent: {
        flex: 1,
    },
    resultItemName: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: 2,
    },
    resultItemAddress: {
        fontSize: FontSize.xs,
        lineHeight: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: Radius.xl,
        ...Shadows.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    modalBody: {
        padding: Spacing.lg,
    },
    locationPreview: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.md,
        marginBottom: Spacing.md,
    },
    locationPreviewText: {
        flex: 1,
    },
    locationName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
        marginBottom: 4,
    },
    locationCoords: {
        fontSize: FontSize.xs,
    },
    mapContainer: {
        width: '100%',
        height: 200,
        borderRadius: Radius.md,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    modalActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    confirmButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Brand.primary,
        paddingVertical: Spacing.md,
        borderRadius: Radius.md,
        ...Shadows.md,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
});
