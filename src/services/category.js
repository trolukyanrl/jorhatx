import { ID, Query } from 'react-native-appwrite';
import { databases, DATABASE_ID, CATEGORIES_COLLECTION_ID } from './appwrite';

export const categoryService = {
  async getCategories() {
    try {
      if (!CATEGORIES_COLLECTION_ID) {
        return { success: true, categories: [] };
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        [Query.orderAsc('name'), Query.limit(100)]
      );

      return { success: true, categories: result.documents || [] };
    } catch (error) {
      console.error('Get categories error:', error);
      return { success: false, categories: [], error: error.message };
    }
  },

  async addCategory(name) {
    try {
      if (!CATEGORIES_COLLECTION_ID) {
        return {
          success: false,
          error: 'CATEGORIES_COLLECTION_ID is not configured in appwrite.js',
        };
      }

      const trimmedName = (name || '').trim();
      if (!trimmedName) {
        return { success: false, error: 'Category name is required' };
      }

      const document = await databases.createDocument(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        ID.unique(),
        {
          name: trimmedName,
        }
      );

      return { success: true, category: document };
    } catch (error) {
      console.error('Add category error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateCategory(categoryId, name) {
    try {
      if (!CATEGORIES_COLLECTION_ID) {
        return {
          success: false,
          error: 'CATEGORIES_COLLECTION_ID is not configured in appwrite.js',
        };
      }

      const trimmedName = (name || '').trim();
      if (!trimmedName) {
        return { success: false, error: 'Category name is required' };
      }

      const document = await databases.updateDocument(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        categoryId,
        {
          name: trimmedName,
        }
      );

      return { success: true, category: document };
    } catch (error) {
      console.error('Update category error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteCategory(categoryId) {
    try {
      if (!CATEGORIES_COLLECTION_ID) {
        return {
          success: false,
          error: 'CATEGORIES_COLLECTION_ID is not configured in appwrite.js',
        };
      }

      await databases.deleteDocument(
        DATABASE_ID,
        CATEGORIES_COLLECTION_ID,
        categoryId
      );

      return { success: true };
    } catch (error) {
      console.error('Delete category error:', error);
      return { success: false, error: error.message };
    }
  },
};
