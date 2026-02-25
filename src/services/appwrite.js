import { Client, Account, Databases, Functions } from 'react-native-appwrite';

const client = new Client();

// Appwrite Configuration
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1') // Your Appwrite endpoint
  .setProject('699e968e00249d5c12a3') // Your project ID
  .setPlatform('com.jorhatx'); // Your app name

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);

// Database and Collection IDs
export const DATABASE_ID = '699e9bed001dc2b93814';
export const USERS_COLLECTION_ID = '699e9d2800183d9bf985';
export const CATEGORIES_COLLECTION_ID = ''; // You'll need to create this


export default client;

