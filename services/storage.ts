import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

// External Storage API Configuration
const STORAGE_API_URL = process.env.EXPO_PUBLIC_STORAGE_API_URL || 'https://storage.sangkaraprasetya.site';
const STORAGE_API_KEY = process.env.EXPO_PUBLIC_STORAGE_API_KEY || '';

interface UploadResponse {
    success: boolean;
    url: string;
    filename: string;
}

const compressImage = async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
};

/**
 * Convert a local file URI to a Blob for uploading
 */
const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
};

/**
 * Upload an image to the external storage server
 * @param uri - Local file URI of the image
 * @param path - Upload path (posts, avatars, reports)
 * @returns Promise with the uploaded image URL
 */
export const uploadImage = async (
    uri: string,
    path: string = 'posts'
): Promise<string> => {
    try {
        // Extract base path only (posts, avatars, reports) - ignore subpaths like userId
        const basePath = path.split('/')[0];

        // Compress the image first
        const compressedUri = await compressImage(uri);

        // Create FormData for multipart upload
        const formData = new FormData();
        const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

        // Handle platform differences for FormData
        if (Platform.OS === 'web') {
            // Web: Convert URI to Blob and create File object
            const blob = await uriToBlob(compressedUri);
            const file = new File([blob], filename, { type: 'image/jpeg' });
            formData.append('image', file);
        } else {
            // React Native (iOS/Android): Use URI object format
            formData.append('image', {
                uri: compressedUri,
                type: 'image/jpeg',
                name: filename,
            } as any);
        }

        // Upload to external storage server
        const response = await fetch(`${STORAGE_API_URL}/upload/${basePath}`, {
            method: 'POST',
            headers: {
                'X-API-Key': STORAGE_API_KEY,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }

        const result: UploadResponse = await response.json();

        if (!result.success) {
            throw new Error('Upload failed: Server returned unsuccessful response');
        }

        console.log('Image uploaded successfully:', result.url);
        return result.url;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

/**
 * Upload multiple images to the external storage server
 * @param uris - Array of local file URIs
 * @param path - Upload path (posts, avatars, reports)
 * @returns Promise with array of uploaded image URLs
 */
export const uploadImages = async (
    uris: string[],
    path: string = 'posts'
): Promise<string[]> => {
    const uploadPromises = uris.map((uri) => uploadImage(uri, path));
    return Promise.all(uploadPromises);
};

/**
 * Delete an image from the storage server
 * Note: This functionality may need to be implemented on the server side
 */
export const deleteImage = async (url: string): Promise<void> => {
    try {
        // Extract filename from URL
        const filename = url.split('/').pop();
        if (!filename) {
            throw new Error('Invalid URL: Cannot extract filename');
        }

        const response = await fetch(`${STORAGE_API_URL}/delete/${filename}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': STORAGE_API_KEY,
            },
        });

        if (!response.ok) {
            console.warn('Delete may have failed:', response.status);
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
};

/**
 * Upload an avatar image for a user
 * @param uri - Local file URI of the avatar image
 * @param userId - User ID for organizing avatars
 * @returns Promise with the uploaded avatar URL
 */
export const uploadAvatar = async (
    uri: string,
    userId: string
): Promise<string> => {
    return uploadImage(uri, 'avatars');
};
