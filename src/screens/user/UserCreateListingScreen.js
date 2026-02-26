import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Card, Text, TextInput, Button, Chip, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { ID } from 'react-native-appwrite';
import {
  databases,
  DATABASE_ID,
  POSTS_COLLECTION_ID,
  storage,
  LISTING_IMAGES_BUCKET_ID,
} from '../../services/appwrite';
import { categoryService } from '../../services/category';
import { authService } from '../../services/auth';
import UserBottomNav from '../../components/UserBottomNav';

const UserCreateListingScreen = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const result = await categoryService.getCategories();
    if (result.success) {
      setCategories(result.categories);
    } else {
      setCategories([]);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPrice('');
    setDescription('');
    setSelectedCategory('');
    setSelectedImages([]);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow photo library permission.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.length) return;
    const pickedAsset = result.assets[0];
    if (!pickedAsset?.uri) return;
    setSelectedImages((prev) => [...prev, pickedAsset]);
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const uploadImages = async () => {
    if (!selectedImages.length) return [];
    if (!LISTING_IMAGES_BUCKET_ID) {
      throw new Error('LISTING_IMAGES_BUCKET_ID is not configured in appwrite.js');
    }

    const uploadedFileIds = [];
    for (const asset of selectedImages) {
      const fileName =
        asset.fileName ||
        `listing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const fileType = asset.mimeType || 'image/jpeg';
      const fileSize = asset.fileSize || 0;

      const uploaded = await storage.createFile({
        bucketId: LISTING_IMAGES_BUCKET_ID,
        fileId: ID.unique(),
        file: {
          name: fileName,
          type: fileType,
          size: fileSize,
          uri: asset.uri,
        },
      });
      uploadedFileIds.push(uploaded.$id);
    }

    return uploadedFileIds;
  };

  const handleCreateListing = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const numericPrice = Number(price);

    if (!trimmedTitle) {
      Alert.alert('Validation', 'Please enter item title.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Validation', 'Please select a category.');
      return;
    }
    if (!price || Number.isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Validation', 'Please enter a valid price.');
      return;
    }
    if (!POSTS_COLLECTION_ID) {
      Alert.alert(
        'Posts Collection Missing',
        'Set POSTS_COLLECTION_ID in src/services/appwrite.js first.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const currentUser = await authService.getCurrentUser();
      const uploadedImageIds = await uploadImages();

      await databases.createDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        ID.unique(),
        {
          title: trimmedTitle,
          category: selectedCategory,
          price: numericPrice,
          description: trimmedDescription,
          role: 'user',
          createdByRole: 'user',
          isAdminPost: false,
          createdBy: currentUser?.$id || '',
          imageIds: JSON.stringify(uploadedImageIds),
        }
      );

      Alert.alert('Success', 'Item listed successfully.');
      resetForm();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to create listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.heading}>
              List Item for Sell
            </Text>

            <TextInput
              mode="outlined"
              label="Item Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Price"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              style={styles.input}
            />

            <Text variant="bodySmall" style={styles.categoryLabel}>
              Select Category
            </Text>
            <View style={styles.categoryWrap}>
              {categories.map((category) => (
                <Chip
                  key={category.$id}
                  selected={selectedCategory === category.name}
                  onPress={() => setSelectedCategory(category.name)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.name && styles.selectedCategoryChip,
                  ]}
                >
                  {category.name}
                </Chip>
              ))}
            </View>

            <TextInput
              mode="outlined"
              label="Description"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              style={styles.input}
            />

            <View style={styles.imageHeader}>
              <Text variant="bodySmall" style={styles.categoryLabel}>
                Images
              </Text>
              <Button mode="outlined" icon="image-plus" onPress={pickImage}>
                Add Image
              </Button>
            </View>

            {selectedImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageList}
              >
                {selectedImages.map((item, index) => (
                  <View key={`${item.uri}-${index}`} style={styles.imageItem}>
                    <Image source={{ uri: item.uri }} style={styles.previewImage} />
                    <IconButton
                      icon="close-circle"
                      size={18}
                      style={styles.removeImageButton}
                      iconColor="#d32f2f"
                      onPress={() => removeImage(index)}
                    />
                  </View>
                ))}
              </ScrollView>
            )}

            <Button
              mode="contained"
              onPress={handleCreateListing}
              loading={submitting}
              disabled={submitting}
            >
              Publish Listing
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <UserBottomNav activeTab="sell" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 96,
  },
  card: {
    borderRadius: 10,
  },
  heading: {
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    marginBottom: 10,
  },
  categoryLabel: {
    marginBottom: 8,
    color: '#666',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#e3f2fd',
  },
  imageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  imageList: {
    paddingBottom: 8,
  },
  imageItem: {
    marginRight: 10,
    position: 'relative',
  },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    margin: 0,
    backgroundColor: '#fff',
  },
});

export default UserCreateListingScreen;
