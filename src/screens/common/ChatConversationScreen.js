import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
  Keyboard,
} from 'react-native';
import { Avatar, Button, Text, TextInput, IconButton } from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Query } from 'react-native-appwrite';
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
import MessageStatus from '../../components/MessageStatus';
import TypingIndicator from '../../components/TypingIndicator';
import EnhancedTimestamp from '../../components/EnhancedTimestamp';

const ChatConversationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [otherUserName, setOtherUserName] = useState('');
  const [postInfo, setPostInfo] = useState(null);
  const [typingStatus, setTypingStatus] = useState({ isTyping: false, typingUserId: '', typingAt: '' });
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const listRef = useRef(null);

  const threadTitle = useMemo(
    () => otherUserName || route.params?.otherUserName || 'User',
    [otherUserName, route.params?.otherUserName]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
    });
  }, [navigation]);

  const getOtherUserIdFromThread = (thread, userId) => {
    if (!thread || !userId) return route.params?.otherUserId || '';
    const participantIds = (thread.participants || []).filter(Boolean);
    let otherId = participantIds.find((id) => id !== userId);
    if (!otherId && thread.participantOneId && thread.participantTwoId) {
      otherId = thread.participantOneId === userId ? thread.participantTwoId : thread.participantOneId;
    }
    return otherId || route.params?.otherUserId || '';
  };

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

  const loadOtherUserName = async (thread, userId) => {
    const fallbackLabel = (id) => (id ? `User ${id.slice(-4)}` : 'User');
    const fromRoute = (route.params?.otherUserName || '').trim();
    if (fromRoute) {
      setOtherUserName(fromRoute);
      return;
    }

    const otherId = getOtherUserIdFromThread(thread, userId);
    if (!otherId) {
      setOtherUserName('User');
      return;
    }

    try {
      const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, otherId);
      const resolvedName = (userDoc?.name || userDoc?.email || '').trim();
      setOtherUserName(resolvedName || fallbackLabel(otherId));
    } catch (error) {
      try {
        const userList = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal('$id', otherId), Query.limit(1)]
        );
        const userDoc = userList.documents?.[0];
        const resolvedName = (userDoc?.name || userDoc?.email || '').trim();
        setOtherUserName(resolvedName || fallbackLabel(otherId));
      } catch (listError) {
        setOtherUserName(fallbackLabel(otherId));
      }
    }
  };

  const loadPostInfo = async (thread) => {
    const postId = thread?.postId || route.params?.postId;
    if (!postId) {
      setPostInfo(null);
      return;
    }

    try {
      const postDoc = await databases.getDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId);
      const imageIds = parseImageIds(postDoc?.imageIds);
      const firstImageId = imageIds[0];
      const imageUri =
        firstImageId && LISTING_IMAGES_BUCKET_ID
          ? getStorageFileViewUrl(LISTING_IMAGES_BUCKET_ID, firstImageId)
          : null;
      setPostInfo({
        postId,
        title: postDoc?.title || route.params?.postTitle || `Listing #${postId.slice(-6)}`,
        price: postDoc?.price,
        location: postDoc?.location || '',
        imageUri,
        postDoc,
      });
    } catch (error) {
      setPostInfo({
        postId,
        title: route.params?.postTitle || `Listing #${postId.slice(-6)}`,
        price: null,
        location: '',
        imageUri: null,
        postDoc: null,
      });
    }
  };

  const handleOpenPostDetail = async () => {
    const postId = postInfo?.postId || route.params?.postId;
    if (!postId) return;

    try {
      let post = postInfo?.postDoc || null;
      if (!post) {
        post = await databases.getDocument(DATABASE_ID, POSTS_COLLECTION_ID, postId);
      }
      navigation.navigate('UserPostDetail', { post });
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to open post details.');
    }
  };

  const resolveThread = async (userId) => {
    const threadIdParam = activeThread?.threadId || route.params?.threadId;
    const postId = route.params?.postId;
    const otherUserId = route.params?.otherUserId;
    const postTitle = route.params?.postTitle || 'Listing';

    if (threadIdParam) {
      const existing = await chatService.getThreadById(threadIdParam);
      if (existing) return existing;
    }

    if (postId && otherUserId && userId && otherUserId !== userId) {
      const candidateThreadId = chatService.buildThreadId(postId, userId, otherUserId);
      const existing = await chatService.getThreadById(candidateThreadId);
      if (existing) return existing;

      return {
        threadId: candidateThreadId,
        postId,
        postTitle,
        participants: [userId, otherUserId],
        isDraft: true,
      };
    }

    return null;
  };

  const ensureThreadForSend = async () => {
    if (!currentUserId) return null;
    if (activeThread && !activeThread.isDraft) return activeThread;

    const postId = route.params?.postId || activeThread?.postId;
    const postTitle = route.params?.postTitle || activeThread?.postTitle || 'Listing';
    const otherUserId =
      route.params?.otherUserId || getOtherUserIdFromThread(activeThread, currentUserId);
    const otherUserName = route.params?.otherUserName || '';

    if (!postId || !otherUserId || otherUserId === currentUserId) {
      return null;
    }

    return chatService.ensureThreadFromPost({
      postId,
      postTitle,
      currentUserId,
      otherUserId,
      currentUserName: '',
      otherUserName,
    });
  };

  const loadConversation = async (options = {}) => {
    const silent = options.silent === true;
    if (!silent) {
      setLoading(true);
    }
    setErrorMessage('');
    try {
      const user = await authService.getCurrentUser();
      const userId = user?.$id || null;
      setCurrentUserId(userId);

      if (!userId) {
        setActiveThread(null);
        setMessages([]);
        return;
      }

      const thread = await resolveThread(userId);
      setActiveThread(thread);
      await Promise.all([loadOtherUserName(thread, userId), loadPostInfo(thread)]);

      if (!thread?.threadId) {
        setMessages([]);
        return;
      }

      const threadMessages = await chatService.getMessages(thread.threadId);
      setMessages(threadMessages);
    } catch (error) {
      setActiveThread(null);
      setMessages([]);
      setErrorMessage(error?.message || 'Failed to load conversation.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.threadId, route.params?.postId, route.params?.otherUserId]);

  useFocusEffect(
    React.useCallback(() => {
      loadConversation();
      const interval = setInterval(() => {
        loadConversation({ silent: true });
      }, 3000);
      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.threadId, route.params?.postId, route.params?.otherUserId, activeThread?.threadId])
  );

  useEffect(() => {
    if (!messages.length) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages]);

  // Typing indicator functionality
  useEffect(() => {
    if (!activeThread?.threadId) return;

    const checkTypingStatus = async () => {
      const status = await chatService.getTypingStatus(activeThread.threadId);
      setTypingStatus(status);
    };

    const interval = setInterval(checkTypingStatus, 2000);
    checkTypingStatus();

    return () => clearInterval(interval);
  }, [activeThread?.threadId]);

  // Handle typing indicator when user types
  useEffect(() => {
    if (!activeThread?.threadId || !currentUserId) return;

    if (messageText.length > 0 && !isTyping) {
      setIsTyping(true);
      chatService.setTypingStatus({
        threadId: activeThread.threadId,
        userId: currentUserId,
        isTyping: true,
      });

      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      const timeout = setTimeout(() => {
        setIsTyping(false);
        chatService.setTypingStatus({
          threadId: activeThread.threadId,
          userId: currentUserId,
          isTyping: false,
        });
      }, 2000);

      setTypingTimeout(timeout);
    }
  }, [messageText, activeThread?.threadId, currentUserId, isTyping, typingTimeout]);

  // Mark messages as read when user views the conversation
  useEffect(() => {
    if (!activeThread?.threadId || !currentUserId) return;

    const markMessagesAsRead = async () => {
      await chatService.markThreadMessagesAsRead(activeThread.threadId, currentUserId);
      const threadMessages = await chatService.getMessages(activeThread.threadId);
      setMessages(threadMessages);
    };

    markMessagesAsRead();
  }, [activeThread?.threadId, currentUserId]);

  const handleSend = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || !currentUserId) return;
    setErrorMessage('');
    try {
      const threadForSend = await ensureThreadForSend();
      if (!threadForSend?.threadId) {
        setErrorMessage('Unable to start this chat.');
        return;
      }

      if (!activeThread || activeThread.threadId !== threadForSend.threadId || activeThread.isDraft) {
        setActiveThread(threadForSend);
      }

      await chatService.sendMessage({
        threadId: threadForSend.threadId,
        senderId: currentUserId,
        text: trimmed,
      });

      setMessageText('');
      const threadMessages = await chatService.getMessages(threadForSend.threadId);
      setMessages(threadMessages);
    } catch (error) {
      setErrorMessage(error?.message || 'Failed to send message.');
    }
  };

  const renderMessage = ({ item }) => {
    const isMine = item.senderId === currentUserId;
    return (
      <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
        <Text style={styles.messageText}>{item.text}</Text>
        <View style={styles.messageFooter}>
          <EnhancedTimestamp timestamp={item.createdAt} isMine={isMine} />
          <MessageStatus status={item.status || 'sent'} isMine={isMine} />
        </View>
      </View>
    );
  };

  return (
    // ✅ FIX 1: Use 'padding' on both platforms so the whole screen shrinks when keyboard opens
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      // ✅ FIX 2: Set a proper keyboardVerticalOffset
      // On iOS this accounts for the navigation header (~56px is common; adjust if needed)
      // On Android keep it 0 since windowSoftInputMode="adjustResize" usually handles it,
      // but 'padding' behavior still helps when that isn't set.
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ✅ FIX 3: The outer View is now a pure flex column.
          Header cards sit at the top, FlatList grows to fill available space,
          composer stays at the bottom — no absolute positioning needed. */}
      <View style={styles.body}>

        {/* ── User info card ── */}
        <View style={styles.userInfoCard}>
          <Avatar.Text
            size={34}
            label={(threadTitle || 'U').trim().charAt(0).toUpperCase() || 'U'}
            style={styles.userInfoAvatar}
            labelStyle={styles.userInfoAvatarLabel}
          />
          <View style={styles.userInfoTextWrap}>
            <Text style={styles.userInfoName} numberOfLines={1}>
              {threadTitle || 'User'}
            </Text>
            <Text style={styles.userInfoSubtitle}>Chat conversation</Text>
          </View>
        </View>

        {/* ── Post info card ── */}
        {postInfo ? (
          <Pressable style={styles.postInfoCard} onPress={handleOpenPostDetail}>
            {postInfo.imageUri ? (
              <Image source={{ uri: postInfo.imageUri }} style={styles.postThumb} />
            ) : null}
            <View style={styles.postInfoTextWrap}>
              <Text style={styles.postInfoLabel}>Regarding post</Text>
              <Text style={styles.postInfoTitle} numberOfLines={1}>
                {postInfo.title}
              </Text>
              <Text style={styles.postInfoMeta} numberOfLines={1}>
                {postInfo.price ? `Rs. ${postInfo.price}` : 'Price not set'}
                {postInfo.location ? `  |  ${postInfo.location}` : ''}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {/* ── Main content area (grows to fill remaining space) ── */}
        {loading ? (
          <View style={styles.centerWrap}>
            <Text>Loading conversation...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerWrap}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Button mode="contained-tonal" onPress={loadConversation} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        ) : !activeThread ? (
          <View style={styles.centerWrap}>
            <Text>Unable to open this conversation.</Text>
          </View>
        ) : (
          // ✅ FIX 4: This inner flex container holds the list + composer in normal flow
          <View style={styles.chatArea}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.$id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              // ✅ FIX 5: Tell the list to maintain scroll position when content changes
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              ListFooterComponent={
                <TypingIndicator
                  isTyping={typingStatus.isTyping && typingStatus.typingUserId !== currentUserId}
                  typingUserName={otherUserName}
                />
              }
            />

            {/* ✅ FIX 6: Composer is in normal document flow at the bottom of the flex column */}
            <View style={styles.composerWrap}>
              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  placeholder="Type a message"
                  value={messageText}
                  onChangeText={setMessageText}
                  style={styles.messageInput}
                  multiline
                  numberOfLines={1}
                  outlineColor="#e0e0e0"
                  activeOutlineColor="#4f46e5"
                />
                <IconButton
                  icon="send"
                  iconColor="#4f46e5"
                  size={28}
                  onPress={handleSend}
                  disabled={!messageText.trim()}
                  style={styles.sendButton}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  body: {
    flex: 1,
    paddingTop: 8,
    // ✅ flex column so cards + chatArea stack vertically
    flexDirection: 'column',
  },
  // ✅ chatArea takes all remaining space and arranges list + composer in a column
  chatArea: {
    flex: 1,
    flexDirection: 'column',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  userInfoAvatar: {
    backgroundColor: '#4f46e5',
  },
  userInfoAvatarLabel: {
    fontSize: 13,
    color: '#fff',
  },
  userInfoTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  userInfoName: {
    fontWeight: '700',
    color: '#222',
    fontSize: 15,
  },
  userInfoSubtitle: {
    marginTop: 2,
    color: '#666',
    fontSize: 12,
  },
  postInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  postThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#eceff1',
    marginRight: 10,
  },
  postInfoTextWrap: {
    flex: 1,
  },
  postInfoLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  postInfoTitle: {
    fontWeight: '700',
    color: '#222',
  },
  postInfoMeta: {
    marginTop: 2,
    color: '#666',
    fontSize: 12,
  },
  messageList: {
    padding: 12,
    paddingBottom: 8, // ✅ No need for huge bottom padding since composer is in-flow now
  },
  messageBubble: {
    maxWidth: '84%',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#d1f5d3',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageText: {
    color: '#222',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    marginTop: 4,
  },
  // ✅ FIX: Composer is no longer absolutely positioned — it sits naturally at the bottom
  composerWrap: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 25,
    // ✅ Remove fixed height so multiline can expand naturally
    maxHeight: 120,
  },
  sendButton: {
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 25,
  },
});

export default ChatConversationScreen;