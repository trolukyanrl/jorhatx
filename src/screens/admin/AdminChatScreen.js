import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth';
import { chatService } from '../../services/chat';
import {
  databases,
  DATABASE_ID,
  USERS_COLLECTION_ID,
  POSTS_COLLECTION_ID,
  LISTING_IMAGES_BUCKET_ID,
  getStorageFileViewUrl,
} from '../../services/appwrite';
import AdminBottomNav from '../../components/AdminBottomNav';

const AdminChatScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [otherUserNames, setOtherUserNames] = useState({});
  const [postDetails, setPostDetails] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  const getOtherPersonIdForUser = (thread, userId) => {
    if (!thread || !userId) return '';
    let otherId = (thread.participants || []).find((id) => id !== userId);
    if (!otherId && thread.participantOneId && thread.participantTwoId) {
      otherId = thread.participantOneId === userId ? thread.participantTwoId : thread.participantOneId;
    }
    return otherId || '';
  };

  const getOtherPersonId = (thread) => getOtherPersonIdForUser(thread, currentUserId);

  const getUserLabelFallback = (userId) => (userId ? `User ${userId.slice(-4)}` : 'User');
  const parseImageIds = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }
    return [];
  };

  const resolveOtherUserNames = async (userThreads, userId) => {
    const otherIds = Array.from(
      new Set((userThreads || []).map((thread) => getOtherPersonIdForUser(thread, userId)).filter(Boolean))
    );

    if (!otherIds.length) {
      setOtherUserNames({});
      return;
    }

    const pairs = await Promise.all(
      otherIds.map(async (otherId) => {
        try {
          const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, otherId);
          const name = (userDoc?.name || userDoc?.email || '').trim();
          return [otherId, name || getUserLabelFallback(otherId)];
        } catch (error) {
          return [otherId, getUserLabelFallback(otherId)];
        }
      })
    );

    setOtherUserNames(Object.fromEntries(pairs));
  };

  const resolvePostDetails = async (userThreads) => {
    const postIds = Array.from(new Set((userThreads || []).map((thread) => thread.postId).filter(Boolean)));
    if (!postIds.length) {
      setPostDetails({});
      return;
    }

    const pairs = await Promise.all(
      postIds.map(async (postId) => {
        try {
          const postDoc = await databases.getDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId);
          const imageIds = parseImageIds(postDoc?.imageIds);
          const firstImageId = imageIds[0];
          const imageUri =
            firstImageId && LISTING_IMAGES_BUCKET_ID
              ? getStorageFileViewUrl(LISTING_IMAGES_BUCKET_ID, firstImageId)
              : '';
          return [
            postId,
            {
              title: postDoc?.title || postDoc?.name || 'Post',
              price: postDoc?.price ?? null,
              imageUri,
            },
          ];
        } catch (error) {
          return [
            postId,
            {
              title: 'Post',
              price: null,
              imageUri: '',
            },
          ];
        }
      })
    );

    setPostDetails(Object.fromEntries(pairs));
  };

  const getThreadUserName = (thread) => {
    const otherUserId = getOtherPersonId(thread);
    return otherUserNames[otherUserId] || getUserLabelFallback(otherUserId);
  };

  const getThreadDescription = (thread) => thread?.lastMessage || 'Tap to open chat';

  const loadThreads = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const user = await authService.getCurrentUser();
      const userId = user?.$id || null;
      setCurrentUserId(userId);

      if (!userId) {
        setThreads([]);
        return;
      }

      const userThreads = await chatService.getThreadsForUser(userId);
      setThreads(userThreads);
      await Promise.all([resolveOtherUserNames(userThreads, userId), resolvePostDetails(userThreads)]);
    } catch (error) {
      setThreads([]);
      setOtherUserNames({});
      setPostDetails({});
      setErrorMessage(error?.message || 'Failed to load chats.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadThreads();
    }, [])
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              Admin Chat
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Open a conversation to chat with users.
            </Text>
          </Card.Content>
        </Card>

        {loading ? (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text>Loading chats...</Text>
            </Card.Content>
          </Card>
        ) : errorMessage ? (
          <Card style={styles.infoCard} onPress={loadThreads}>
            <Card.Content>
              <Text style={styles.infoTitle}>Unable to load chats</Text>
              <Text style={styles.infoDesc}>{errorMessage}</Text>
            </Card.Content>
          </Card>
        ) : threads.length === 0 ? (
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text style={styles.infoTitle}>No chats yet</Text>
              <Text style={styles.infoDesc}>Open any listing and tap Chat with Seller.</Text>
            </Card.Content>
          </Card>
        ) : (
          threads.map((thread) => (
            <Card
              key={thread.threadId}
              style={styles.threadCard}
              onPress={() =>
                navigation.navigate('ChatConversation', {
                  threadId: thread.threadId,
                  postId: thread.postId,
                  postTitle: thread?.postTitle || 'Listing',
                  otherUserId: getOtherPersonId(thread),
                  otherUserName: otherUserNames[getOtherPersonId(thread)] || '',
                })
              }
            >
              <Card.Content style={styles.threadContent}>
                <Text style={styles.threadName} numberOfLines={1}>
                  {getThreadUserName(thread)}
                </Text>
                {postDetails[thread.postId] ? (
                  <View style={styles.postPreviewRow}>
                    {postDetails[thread.postId].imageUri ? (
                      <Card.Cover source={{ uri: postDetails[thread.postId].imageUri }} style={styles.postThumb} />
                    ) : (
                      <View style={styles.postThumb} />
                    )}
                    <View style={styles.postMetaWrap}>
                      <Text style={styles.postTitle} numberOfLines={1}>
                        {postDetails[thread.postId].title}
                      </Text>
                      <Text style={styles.postPrice} numberOfLines={1}>
                        {postDetails[thread.postId].price ? `Rs. ${postDetails[thread.postId].price}` : 'Price not set'}
                      </Text>
                    </View>
                  </View>
                ) : null}
                <Text style={styles.threadMessage} numberOfLines={1}>
                  {getThreadDescription(thread)}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <AdminBottomNav activeTab="chat" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 12,
    paddingTop: 20,
    paddingBottom: 90,
  },
  headerCard: {
    marginBottom: 12,
    borderRadius: 10,
  },
  title: {
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    marginTop: 6,
    color: '#666',
  },
  infoCard: {
    borderRadius: 10,
    marginBottom: 10,
  },
  infoTitle: {
    fontWeight: '700',
    color: '#222',
  },
  infoDesc: {
    color: '#666',
    marginTop: 4,
  },
  threadCard: {
    borderRadius: 10,
    marginBottom: 10,
  },
  threadContent: {
    paddingVertical: 10,
  },
  threadName: {
    fontWeight: '700',
    color: '#1f1f1f',
    fontSize: 15,
  },
  postPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  postThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#eceff1',
  },
  postMetaWrap: {
    marginLeft: 8,
    flex: 1,
  },
  postTitle: {
    color: '#222',
    fontSize: 13,
    fontWeight: '600',
  },
  postPrice: {
    marginTop: 1,
    color: '#666',
    fontSize: 12,
  },
  threadMessage: {
    marginTop: 4,
    color: '#666',
  },
});

export default AdminChatScreen;
