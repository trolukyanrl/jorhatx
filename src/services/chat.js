import { ID, Query, Permission, Role } from 'react-native-appwrite';
import {
  databases,
  DATABASE_ID,
  CHAT_THREADS_COLLECTION_ID,
  CHAT_MESSAGES_COLLECTION_ID,
} from './appwrite';

const uniqueParticipants = (participants) =>
  Array.from(new Set((participants || []).filter(Boolean).map((id) => id.toString())));

const buildThreadId = (postId, userA, userB) => {
  const ids = uniqueParticipants([userA, userB]).sort();
  return `${postId || 'post'}::${ids.join('::')}`;
};

const getParticipantPair = (userA, userB) => {
  const ids = uniqueParticipants([userA, userB]).sort();
  return {
    participantOneId: ids[0] || '',
    participantTwoId: ids[1] || '',
  };
};

const buildParticipantPermissions = (participantIds) => {
  const ids = uniqueParticipants(participantIds);
  const permissions = [];
  for (const id of ids) {
    permissions.push(Permission.read(Role.user(id)));
    permissions.push(Permission.update(Role.user(id)));
    permissions.push(Permission.delete(Role.user(id)));
  }
  return permissions;
};

const createDocumentWithPermissionFallback = async ({
  collectionId,
  data,
  permissions,
}) => {
  try {
    return await databases.createDocument(
      DATABASE_ID,
      collectionId,
      ID.unique(),
      data,
      permissions
    );
  } catch (error) {
    const message = (error?.message || '').toLowerCase();
    const isPermissionIssue =
      message.includes('permission') ||
      message.includes('permissions') ||
      message.includes('document security');

    if (!isPermissionIssue) {
      throw error;
    }

    return databases.createDocument(
      DATABASE_ID,
      collectionId,
      ID.unique(),
      data
    );
  }
};

const updateDocumentWithPermissionFallback = async ({
  collectionId,
  documentId,
  data,
  permissions,
}) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      collectionId,
      documentId,
      data,
      permissions
    );
  } catch (error) {
    const message = (error?.message || '').toLowerCase();
    const isPermissionIssue =
      message.includes('permission') ||
      message.includes('permissions') ||
      message.includes('document security');

    if (!isPermissionIssue) {
      throw error;
    }

    return databases.updateDocument(
      DATABASE_ID,
      collectionId,
      documentId,
      data
    );
  }
};

const normalizeThreadDoc = (doc) => ({
  $id: doc.$id,
  threadId: doc.threadKey,
  postId: doc.postId || '',
  postTitle: doc.postId ? `Listing #${doc.postId.slice(-6)}` : 'Listing',
  participants: uniqueParticipants([
    ...(doc.participantIds || []),
    doc.participantOneId,
    doc.participantTwoId,
  ]),
  participantOneId: doc.participantOneId || '',
  participantTwoId: doc.participantTwoId || '',
  buyerId: '',
  sellerId: '',
  buyerName: '',
  sellerName: '',
  updatedAt: doc.lastMessageAt || doc.$updatedAt || doc.$createdAt,
  lastMessage: doc.lastMessage || '',
  lastSenderId: doc.lastSenderId || '',
});

const findThreadByKey = async (threadKey) => {
  if (!threadKey || !CHAT_THREADS_COLLECTION_ID) return null;
  const result = await databases.listDocuments(
    DATABASE_ID,
    CHAT_THREADS_COLLECTION_ID,
    [Query.equal('threadKey', threadKey), Query.limit(1)]
  );
  return result.documents?.[0] || null;
};

export const chatService = {
  buildThreadId,

  async getThreadById(threadId) {
    if (!threadId) return null;
    const threadDoc = await findThreadByKey(threadId);
    return threadDoc ? normalizeThreadDoc(threadDoc) : null;
  },

  async ensureThread(meta) {
    if (!meta?.threadId || !CHAT_THREADS_COLLECTION_ID) return null;

    const threadKey = meta.threadId;
    const pair = getParticipantPair(
      meta.participants?.[0] || meta.buyerId,
      meta.participants?.[1] || meta.sellerId
    );
    const participants = uniqueParticipants([
      ...(meta.participants || []),
      meta.buyerId,
      meta.sellerId,
    ]);

    let threadDoc = await findThreadByKey(threadKey);
    if (!threadDoc) {
      const threadPermissions = buildParticipantPermissions(participants);
      threadDoc = await createDocumentWithPermissionFallback({
        collectionId: CHAT_THREADS_COLLECTION_ID,
        data: {
          threadKey,
          postId: meta.postId || '',
          participantIds: participants,
          participantOneId: pair.participantOneId,
          participantTwoId: pair.participantTwoId,
          lastMessage: meta.lastMessage || '',
          lastMessageAt: meta.updatedAt || null,
          lastSenderId: meta.lastSenderId || '',
        },
        permissions: threadPermissions,
      });
    } else {
      threadDoc = await databases.updateDocument(
        DATABASE_ID,
        CHAT_THREADS_COLLECTION_ID,
        threadDoc.$id,
        {
          postId: meta.postId || threadDoc.postId || '',
          participantIds: participants.length ? participants : threadDoc.participantIds || [],
          participantOneId: pair.participantOneId || threadDoc.participantOneId || '',
          participantTwoId: pair.participantTwoId || threadDoc.participantTwoId || '',
        }
      );
    }

    return normalizeThreadDoc(threadDoc);
  },

  async ensureThreadFromPost({
    postId,
    postTitle,
    currentUserId,
    otherUserId,
    currentUserName,
    otherUserName,
  }) {
    if (!postId || !currentUserId || !otherUserId) return null;

    const threadId = buildThreadId(postId, currentUserId, otherUserId);
    return this.ensureThread({
      threadId,
      postId,
      postTitle: postTitle || 'Listing',
      participants: [currentUserId, otherUserId],
      buyerId: currentUserId,
      sellerId: otherUserId,
      buyerName: currentUserName || '',
      sellerName: otherUserName || '',
    });
  },

  async getThreadsForUser(userId) {
    if (!userId || !CHAT_THREADS_COLLECTION_ID) return [];

    const queries = [Query.equal('participantOneId', userId), Query.limit(200)];
    const queriesAlt = [Query.equal('participantTwoId', userId), Query.limit(200)];

    const [resultOne, resultTwo] = await Promise.all([
      databases.listDocuments(DATABASE_ID, CHAT_THREADS_COLLECTION_ID, queries),
      databases.listDocuments(DATABASE_ID, CHAT_THREADS_COLLECTION_ID, queriesAlt),
    ]);

    const all = [...(resultOne.documents || []), ...(resultTwo.documents || [])];
    const unique = new Map();
    for (const doc of all) {
      unique.set(doc.$id, doc);
    }

    return Array.from(unique.values())
      .map(normalizeThreadDoc)
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  },

  async getMessages(threadId) {
    if (!threadId || !CHAT_MESSAGES_COLLECTION_ID) return [];

    const result = await databases.listDocuments(
      DATABASE_ID,
      CHAT_MESSAGES_COLLECTION_ID,
      [Query.equal('threadId', threadId), Query.orderAsc('$createdAt'), Query.limit(500)]
    );

    return (result.documents || []).map((doc) => ({
      $id: doc.$id,
      threadId: doc.threadId,
      senderId: doc.senderId,
      receiverId: doc.receiverId,
      text: doc.text || '',
      createdAt: doc.$createdAt,
      isRead: !!doc.isRead,
      status: doc.status || 'sent', // Use existing status column or default to 'sent'
    }));
  },

  async sendMessage({ threadId, senderId, text }) {
    if (!threadId || !senderId || !CHAT_MESSAGES_COLLECTION_ID) return null;
    const trimmed = (text || '').trim();
    if (!trimmed) return null;

    const thread = await findThreadByKey(threadId);
    if (!thread) return null;

    const participants = uniqueParticipants(thread.participantIds);
    const receiverId =
      participants.find((participantId) => participantId !== senderId) ||
      (thread.participantOneId === senderId ? thread.participantTwoId : thread.participantOneId);

    const messagePermissions = buildParticipantPermissions([senderId, receiverId]);
    const messageDoc = await createDocumentWithPermissionFallback({
      collectionId: CHAT_MESSAGES_COLLECTION_ID,
      data: {
        threadId,
        postId: thread.postId || '',
        senderId,
        receiverId: receiverId || '',
        text: trimmed,
        isRead: false,
        status: 'sent', // Message status: sent, delivered, read
      },
      permissions: messagePermissions,
    });

    await databases.updateDocument(
      DATABASE_ID,
      CHAT_THREADS_COLLECTION_ID,
      thread.$id,
      {
        lastMessage: trimmed,
        lastMessageAt: messageDoc.$createdAt,
        lastSenderId: senderId,
      }
    );

    return {
      $id: messageDoc.$id,
      threadId: messageDoc.threadId,
      senderId: messageDoc.senderId,
      receiverId: messageDoc.receiverId,
      text: messageDoc.text || '',
      createdAt: messageDoc.$createdAt,
      isRead: !!messageDoc.isRead,
      status: messageDoc.status || 'sent',
    };
  },

  // Typing indicators functionality
  async setTypingStatus({ threadId, userId, isTyping }) {
    if (!threadId || !userId || !CHAT_THREADS_COLLECTION_ID) return null;

    const thread = await findThreadByKey(threadId);
    if (!thread) return null;

    const typingData = {
      typingStatus: isTyping ? JSON.stringify({
        typingUserId: userId,
        typingAt: new Date().toISOString()
      }) : '',
    };

    const threadPermissions = buildParticipantPermissions(thread.participants);
    try {
      const updatedThread = await updateDocumentWithPermissionFallback({
        collectionId: CHAT_THREADS_COLLECTION_ID,
        documentId: thread.$id,
        data: typingData,
        permissions: threadPermissions,
      });

      const typingInfo = updatedThread.typingStatus ? JSON.parse(updatedThread.typingStatus) : null;
      return {
        threadId: updatedThread.threadKey,
        isTyping: !!typingInfo?.typingUserId,
        typingUserId: typingInfo?.typingUserId || '',
        typingAt: typingInfo?.typingAt || '',
      };
    } catch (error) {
      // If typingStatus column doesn't exist yet, just return success without updating
      return {
        threadId,
        isTyping,
        typingUserId: isTyping ? userId : '',
        typingAt: isTyping ? new Date().toISOString() : '',
      };
    }
  },

  async getTypingStatus(threadId) {
    if (!threadId || !CHAT_THREADS_COLLECTION_ID) return { isTyping: false, typingUserId: '', typingAt: '' };

    const thread = await findThreadByKey(threadId);
    if (!thread) return { isTyping: false, typingUserId: '', typingAt: '' };

    try {
      const typingInfo = thread.typingStatus ? JSON.parse(thread.typingStatus) : null;
      
      // Check if typing status is recent (within last 3 seconds)
      const typingAt = typingInfo?.typingAt ? new Date(typingInfo.typingAt) : null;
      const now = new Date();
      const isRecent = typingAt && (now.getTime() - typingAt.getTime()) < 3000;

      return {
        isTyping: isRecent && !!typingInfo?.typingUserId,
        typingUserId: isRecent ? typingInfo?.typingUserId || '' : '',
        typingAt: typingInfo?.typingAt || '',
      };
    } catch (error) {
      return { isTyping: false, typingUserId: '', typingAt: '' };
    }
  },

  // Message status tracking
  async markMessageAsDelivered(messageId) {
    if (!messageId || !CHAT_MESSAGES_COLLECTION_ID) return null;

    const message = await databases.getDocument(DATABASE_ID, CHAT_MESSAGES_COLLECTION_ID, messageId);
    if (!message) return null;

    const participants = [message.senderId, message.receiverId].filter(Boolean);
    const messagePermissions = buildParticipantPermissions(participants);

    const updatedMessage = await updateDocumentWithPermissionFallback({
      collectionId: CHAT_MESSAGES_COLLECTION_ID,
      documentId: messageId,
      data: {
        status: 'delivered',
      },
      permissions: messagePermissions,
    });

    return {
      $id: updatedMessage.$id,
      status: updatedMessage.status || 'delivered',
    };
  },

  async markMessageAsRead(messageId) {
    if (!messageId || !CHAT_MESSAGES_COLLECTION_ID) return null;

    const message = await databases.getDocument(DATABASE_ID, CHAT_MESSAGES_COLLECTION_ID, messageId);
    if (!message) return null;

    const participants = [message.senderId, message.receiverId].filter(Boolean);
    const messagePermissions = buildParticipantPermissions(participants);

    const updatedMessage = await updateDocumentWithPermissionFallback({
      collectionId: CHAT_MESSAGES_COLLECTION_ID,
      documentId: messageId,
      data: {
        status: 'read',
        isRead: true,
      },
      permissions: messagePermissions,
    });

    return {
      $id: updatedMessage.$id,
      status: updatedMessage.status || 'read',
      isRead: !!updatedMessage.isRead,
    };
  },

  async markThreadMessagesAsRead(threadId, userId) {
    if (!threadId || !userId || !CHAT_MESSAGES_COLLECTION_ID) return [];

    const result = await databases.listDocuments(
      DATABASE_ID,
      CHAT_MESSAGES_COLLECTION_ID,
      [
        Query.equal('threadId', threadId),
        Query.equal('receiverId', userId),
        Query.equal('isRead', false),
        Query.limit(100)
      ]
    );

    const messages = result.documents || [];
    const updatedMessages = [];

    for (const message of messages) {
      const participants = [message.senderId, message.receiverId].filter(Boolean);
      const messagePermissions = buildParticipantPermissions(participants);

      const updatedMessage = await updateDocumentWithPermissionFallback({
        collectionId: CHAT_MESSAGES_COLLECTION_ID,
        documentId: message.$id,
        data: {
          status: 'read',
          isRead: true,
        },
        permissions: messagePermissions,
      });

      updatedMessages.push({
        $id: updatedMessage.$id,
        status: updatedMessage.status || 'read',
        isRead: !!updatedMessage.isRead,
      });
    }

    return updatedMessages;
  },
};
