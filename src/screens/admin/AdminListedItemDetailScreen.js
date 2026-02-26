import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, Dimensions } from 'react-native';
import { Avatar, Card, Text, Button, TextInput, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  databases,
  DATABASE_ID,
  POSTS_COLLECTION_ID,
  USERS_COLLECTION_ID,
  LISTING_IMAGES_BUCKET_ID,
  getStorageFileViewUrl,
} from '../../services/appwrite';
import { authService } from '../../services/auth';
import AdminBottomNav from '../../components/AdminBottomNav';

const AdminListedItemDetailScreen = () => {
  const imageWidth = Dimensions.get('window').width - 24;
  const navigation = useNavigation();
  const route = useRoute();
  const itemId = route.params?.itemId;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [ownerName, setOwnerName] = useState('');

  useEffect(() => {
    loadItem();
  }, [itemId]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

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

  const loadItem = async () => {
    try {
      if (!itemId || !POSTS_COLLECTION_ID) {
        setItem(null);
        return;
      }

      const doc = await databases.getDocument(DATABASE_ID, POSTS_COLLECTION_ID, itemId);
      setItem(doc);
      setTitle(doc.title || '');
      setCategory(doc.category || '');
      setPrice((doc.price ?? '').toString());
      setDescription(doc.description || '');
    } catch (error) {
      console.error('Load item detail error:', error);
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUserId(user?.$id || null);
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedCategory = category.trim();
    const numericPrice = Number(price);

    if (!trimmedTitle) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    if (!trimmedCategory) {
      Alert.alert('Validation', 'Category is required.');
      return;
    }
    if (!price || Number.isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Validation', 'Enter a valid price.');
      return;
    }

    setSaving(true);
    try {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        itemId,
        {
          title: trimmedTitle,
          category: trimmedCategory,
          price: numericPrice,
          description: description.trim(),
        }
      );
      setItem(updated);
      setIsEditing(false);
      Alert.alert('Success', 'Listing updated successfully.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to update listing.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databases.deleteDocument(DATABASE_ID, POSTS_COLLECTION_ID, itemId);
              Alert.alert('Deleted', 'Listing deleted successfully.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error?.message || 'Failed to delete listing.');
            }
          },
        },
      ]
    );
  };

  const resolveUserName = async (userId, fallbackName = '') => {
    const fromPost = (fallbackName || '').trim();
    if (fromPost) return fromPost;
    if (!userId) return '';
    try {
      const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
      return (userDoc?.name || userDoc?.email || '').trim();
    } catch (error) {
      return '';
    }
  };

  const getOwnerFallbackLabel = (userId) => (userId ? `User ${userId.slice(-4)}` : 'User');

  useEffect(() => {
    let isActive = true;

    const loadOwnerName = async () => {
      if (!item) {
        setOwnerName('');
        return;
      }
      const resolved = await resolveUserName(item.createdBy, item.createdByName || '');
      if (!isActive) return;
      setOwnerName(resolved || getOwnerFallbackLabel(item.createdBy));
    };

    loadOwnerName();
    return () => {
      isActive = false;
    };
  }, [item?.createdBy, item?.createdByName]);

  const handleOpenChat = async () => {
    if (!item?.createdBy) {
      Alert.alert('Chat unavailable', 'Post owner is not available for this listing.');
      return;
    }

    if (currentUserId && item.createdBy === currentUserId) {
      Alert.alert('Chat unavailable', 'This is your own post.');
      return;
    }

    const sellerName = await resolveUserName(item.createdBy, item.createdByName || '');

    navigation.navigate('ChatConversation', {
      postId: item.$id,
      postTitle: item.title || 'Listing',
      otherUserId: item.createdBy,
      otherUserName: sellerName,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text>Loading item details...</Text>
        </View>
        <AdminBottomNav activeTab="main" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text>Item not found.</Text>
        </View>
        <AdminBottomNav activeTab="main" />
      </View>
    );
  }

  const imageIds = parseImageIds(item.imageIds);
  const ownerDisplayName = ownerName || getOwnerFallbackLabel(item.createdBy);
  const ownerInitial = ownerDisplayName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
        <View style={styles.ownerCard}>
          <Avatar.Text size={36} label={ownerInitial} style={styles.ownerAvatar} labelStyle={styles.ownerAvatarLabel} />
          <View style={styles.ownerTextWrap}>
            <Text style={styles.ownerLabel}>Posted by</Text>
            <Text style={styles.ownerName} numberOfLines={1}>
              {ownerDisplayName}
            </Text>
          </View>
        </View>
        {imageIds.length > 0 && LISTING_IMAGES_BUCKET_ID ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageCarousel}
            onMomentumScrollEnd={(event) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / imageWidth);
              setCurrentImageIndex(index);
            }}
          >
            {imageIds.map((imageId) => (
              <Image
                key={imageId}
                source={{ uri: getStorageFileViewUrl(LISTING_IMAGES_BUCKET_ID, imageId) }}
                style={[styles.image, { width: imageWidth }]}
              />
            ))}
          </ScrollView>
        ) : null}
        {imageIds.length > 1 ? (
          <View style={styles.dotContainer}>
            {imageIds.map((imageId, index) => (
              <View
                key={`${imageId}-${index}`}
                style={[styles.dot, index === currentImageIndex && styles.activeDot]}
              />
            ))}
          </View>
        ) : null}

        <Card.Content>
          {isEditing ? (
            <>
              <TextInput
                mode="outlined"
                label="Title"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Category"
                value={category}
                onChangeText={setCategory}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Price"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={styles.input}
              />
            </>
          ) : (
            <>
              <Text variant="titleLarge" style={styles.title}>
                {item.title || 'Untitled Item'}
              </Text>
              <Text style={styles.meta}>Category: {item.category || 'General'}</Text>
              <Text style={styles.meta}>Price: Rs. {item.price || 0}</Text>
              {item.location ? <Text style={styles.meta}>Location: {item.location}</Text> : null}
              {item.state ? <Text style={styles.meta}>State: {item.state}</Text> : null}
              {item.district ? <Text style={styles.meta}>District: {item.district}</Text> : null}
              {item.village ? <Text style={styles.meta}>Village/Town: {item.village}</Text> : null}
              {item.area ? <Text style={styles.meta}>Area/Landmark: {item.area}</Text> : null}
              {item.pinCode ? <Text style={styles.meta}>PIN Code: {item.pinCode}</Text> : null}
              <Text style={styles.meta}>Description:</Text>
              <Text style={styles.description}>{item.description || 'No description'}</Text>
              <Text style={styles.meta}>
                Posted: {item.$createdAt ? new Date(item.$createdAt).toLocaleString() : 'N/A'}
              </Text>
              <View style={styles.tagWrap}>
                <Chip icon="shield-crown-outline" style={styles.tagChip}>
                  Admin Post
                </Chip>
              </View>
            </>
          )}

          <View style={styles.buttonRow}>
            {isEditing ? (
              <>
                <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving}>
                  Save
                </Button>
                <Button mode="outlined" onPress={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('AdminCreateListing', { editPost: item })}
                  icon="pencil-outline"
                >
                  Edit
                </Button>
                <Button mode="contained" onPress={handleDelete} buttonColor="#d32f2f" icon="delete-outline">
                  Delete
                </Button>
              </>
            )}
          </View>
          {!isEditing ? (
            <Button mode="contained" icon="chat-outline" onPress={handleOpenChat} style={styles.chatButton}>
              Chat with Seller
            </Button>
          ) : null}
        </Card.Content>
        </Card>
      </ScrollView>
      <AdminBottomNav activeTab="main" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 96,
  },
  card: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },
  ownerAvatar: {
    backgroundColor: '#4f46e5',
  },
  ownerAvatarLabel: {
    color: '#fff',
    fontSize: 14,
  },
  ownerTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  ownerLabel: {
    color: '#666',
    fontSize: 11,
  },
  ownerName: {
    marginTop: 1,
    color: '#222',
    fontWeight: '700',
    fontSize: 15,
  },
  imageCarousel: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#eee',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#cfcfcf',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#6200ea',
    width: 9,
    height: 9,
  },
  title: {
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  meta: {
    color: '#555',
    marginTop: 4,
  },
  description: {
    color: '#444',
    marginTop: 4,
  },
  input: {
    marginBottom: 10,
  },
  tagWrap: {
    marginTop: 10,
    flexDirection: 'row',
  },
  tagChip: {
    backgroundColor: '#e8f5e9',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  chatButton: {
    marginTop: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdminListedItemDetailScreen;
