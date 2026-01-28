import { storage } from '@/FirebaseConfig';
import * as ImageManipulator from 'expo-image-manipulator';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const compressImage = async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
};

const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
};

export const uploadImage = async (
    uri: string,
    path: string = 'posts'
): Promise<string> => {
    try {
        const compressedUri = await compressImage(uri);

        const blob = await uriToBlob(compressedUri);

        const filename = `${path}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const storageRef = ref(storage, filename);

        await uploadBytes(storageRef, blob);

        const downloadUrl = await getDownloadURL(storageRef);

        return downloadUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

export const uploadImages = async (
    uris: string[],
    path: string = 'posts'
): Promise<string[]> => {
    const uploadPromises = uris.map((uri) => uploadImage(uri, path));
    return Promise.all(uploadPromises);
};

export const deleteImage = async (url: string): Promise<void> => {
    try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
};

export const uploadAvatar = async (
    uri: string,
    userId: string
): Promise<string> => {
    return uploadImage(uri, `avatars/${userId}`);
};
