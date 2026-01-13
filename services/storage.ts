/**
 * Firebase Storage Service for CIVICA
 * Handles image uploads and management
 */

import { storage } from '@/FirebaseConfig';
import * as ImageManipulator from 'expo-image-manipulator';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

/**
 * Compress and resize an image before upload
 */
const compressImage = async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
};

/**
 * Convert URI to Blob for upload
 */
const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
};

/**
 * Upload a single image to Firebase Storage
 */
export const uploadImage = async (
    uri: string,
    path: string = 'posts'
): Promise<string> => {
    try {
        // Compress image
        const compressedUri = await compressImage(uri);

        // Convert to blob
        const blob = await uriToBlob(compressedUri);

        // Generate unique filename
        const filename = `${path}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const storageRef = ref(storage, filename);

        // Upload
        await uploadBytes(storageRef, blob);

        // Get download URL
        const downloadUrl = await getDownloadURL(storageRef);

        return downloadUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

/**
 * Upload multiple images
 */
export const uploadImages = async (
    uris: string[],
    path: string = 'posts'
): Promise<string[]> => {
    const uploadPromises = uris.map((uri) => uploadImage(uri, path));
    return Promise.all(uploadPromises);
};

/**
 * Delete an image from storage
 */
export const deleteImage = async (url: string): Promise<void> => {
    try {
        // Extract path from URL
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (
    uri: string,
    userId: string
): Promise<string> => {
    return uploadImage(uri, `avatars/${userId}`);
};
