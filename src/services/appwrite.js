import { Client, Account, Databases, Functions, Storage } from 'react-native-appwrite';

const client = new Client();
export const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = '699e968e00249d5c12a3';

// Appwrite Configuration
client
  .setEndpoint(APPWRITE_ENDPOINT) // Your Appwrite endpoint
  .setProject(APPWRITE_PROJECT_ID) // Your project ID
  .setPlatform('com.jorhatx'); // Your app name

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export const storage = new Storage(client);

// Database and Collection IDs
export const DATABASE_ID = '699e9bed001dc2b93814';
export const USERS_COLLECTION_ID = '699e9d2800183d9bf985';
export const CATEGORIES_COLLECTION_ID = '699fe833003e6008e5d4';
export const POSTS_COLLECTION_ID = '699feb6d0005c55eafbd';
export const LISTING_IMAGES_BUCKET_ID = '699feea30036991342f7';
export const WISHLISTS_COLLECTION_ID = '69a00cb30013195528c8';
export const CHAT_THREADS_COLLECTION_ID = '69a05aca001455141b0c';
export const CHAT_MESSAGES_COLLECTION_ID = '69a05aed0033d8dcc430';

export const getStorageFileViewUrl = (bucketId, fileId) =>
  `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;


export default client;

