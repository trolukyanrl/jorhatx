import { ID, Query, Permission, Role } from 'react-native-appwrite';
import {
  databases,
  DATABASE_ID,
  WISHLISTS_COLLECTION_ID,
} from './appwrite';

export const wishlistService = {
  async getWishlistIds(userId) {
    try {
      if (!userId || !WISHLISTS_COLLECTION_ID) return [];

      const result = await databases.listDocuments(
        DATABASE_ID,
        WISHLISTS_COLLECTION_ID,
        [Query.equal('userId', userId), Query.limit(200)]
      );

      const ids = (result.documents || []).map((doc) => doc.postId).filter(Boolean);
      return Array.from(new Set(ids));
    } catch (error) {
      console.error('Get wishlist error:', error);
      return [];
    }
  },

  async setWishlistIds(userId, ids) {
    try {
      if (!userId || !WISHLISTS_COLLECTION_ID) return false;

      const existing = await databases.listDocuments(
        DATABASE_ID,
        WISHLISTS_COLLECTION_ID,
        [Query.equal('userId', userId), Query.limit(200)]
      );

      const existingDocs = existing.documents || [];
      const targetIds = new Set(ids || []);

      for (const doc of existingDocs) {
        if (!targetIds.has(doc.postId)) {
          await databases.deleteDocument(DATABASE_ID, WISHLISTS_COLLECTION_ID, doc.$id);
        }
      }

      const existingPostIds = new Set(existingDocs.map((doc) => doc.postId));
      for (const postId of targetIds) {
        if (!existingPostIds.has(postId)) {
          await databases.createDocument(
            DATABASE_ID,
            WISHLISTS_COLLECTION_ID,
            ID.unique(),
            { userId, postId }
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Set wishlist error:', error);
      return false;
    }
  },

  async toggleWishlist(userId, postId) {
    try {
      if (!userId || !postId || !WISHLISTS_COLLECTION_ID) return [];

      const existing = await databases.listDocuments(
        DATABASE_ID,
        WISHLISTS_COLLECTION_ID,
        [Query.equal('userId', userId), Query.equal('postId', postId), Query.limit(10)]
      );

      const docs = existing.documents || [];

      if (docs.length > 0) {
        for (const doc of docs) {
          await databases.deleteDocument(DATABASE_ID, WISHLISTS_COLLECTION_ID, doc.$id);
        }
      } else {
        await databases.createDocument(
          DATABASE_ID,
          WISHLISTS_COLLECTION_ID,
          ID.unique(),
          { userId, postId },
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        );
      }

      return this.getWishlistIds(userId);
    } catch (error) {
      console.error('Toggle wishlist error:', error);
      return this.getWishlistIds(userId);
    }
  },
};
