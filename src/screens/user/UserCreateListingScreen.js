import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Modal, Pressable, Platform } from 'react-native';
import { Card, Text, TextInput, Button, Chip, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ID } from 'react-native-appwrite';
import MapView, { Marker } from '../../components/MapViewAdapter';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  databases,
  DATABASE_ID,
  POSTS_COLLECTION_ID,
  storage,
  LISTING_IMAGES_BUCKET_ID,
  getStorageFileViewUrl,
} from '../../services/appwrite';
import { categoryService } from '../../services/category';
import { authService } from '../../services/auth';
import UserBottomNav from '../../components/UserBottomNav';

const UserCreateListingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const editPost = route.params?.editPost || null;
  const isEditMode = !!editPost?.$id;

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [showAddressFields, setShowAddressFields] = useState(false);
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [area, setArea] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [existingImageIds, setExistingImageIds] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 26.7509,
    longitude: 94.2037,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const mapRef = useRef(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    setTitle(editPost.title || '');
    setPrice((editPost.price ?? '').toString());
    setLocation(editPost.location || '');
    setDescription(editPost.description || '');
    setSelectedCategory(editPost.category || '');
    setStateName(editPost.state || '');
    setDistrict(editPost.district || '');
    setVillage(editPost.village || '');
    setArea(editPost.area || '');
    setPinCode(editPost.pinCode || '');
    setShowAddressFields(
      !!(editPost.state || editPost.district || editPost.village || editPost.area || editPost.pinCode)
    );
    setExistingImageIds(parseImageIds(editPost.imageIds));
  }, [isEditMode, editPost]);

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
    setLocation('');
    setDescription('');
    setSelectedCategory('');
    setSelectedImages([]);
    setShowAddressFields(false);
    setStateName('');
    setDistrict('');
    setVillage('');
    setArea('');
    setPinCode('');
    setExistingImageIds([]);
    setSelectedCoords(null);
  };

  const buildAddressLabel = () =>
    [village.trim(), area.trim(), district.trim(), stateName.trim(), pinCode.trim()]
      .filter(Boolean)
      .join(', ');

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

  const removeExistingImage = (imageId) => {
    setExistingImageIds((prev) => prev.filter((id) => id !== imageId));
  };

  const reverseGeocodeToLabel = async (latitude, longitude) => {
    try {
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = places?.[0];
      if (!place) return '';
      const label = [place.name, place.city || place.subregion, place.region]
        .filter(Boolean)
        .join(', ');
      return label || '';
    } catch (error) {
      return '';
    }
  };

  const getCurrentCoords = async () => {
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown?.coords) {
        return lastKnown.coords;
      }
    } catch (error) {
      // Ignore and fallback to active GPS call.
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: true,
    });
    return current?.coords || null;
  };

  const openLocationModal = async () => {
    setLocationModalVisible(true);
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow location permission.');
        return;
      }

      if (Platform.OS === 'android') {
        try {
          await Location.enableNetworkProviderAsync();
        } catch (error) {
          // Continue even when provider prompt is skipped.
        }
      }

      const coords = await getCurrentCoords();
      if (!coords) {
        Alert.alert('Location', 'Unable to detect current location. Please tap on map.');
        return;
      }

      const nextRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(nextRegion);
      setSelectedCoords({ latitude: coords.latitude, longitude: coords.longitude });
      mapRef.current?.animateToRegion(nextRegion, 350);

      if (!location.trim()) {
        const label = await reverseGeocodeToLabel(coords.latitude, coords.longitude);
        if (label) {
          setLocation(label);
        }
      }
    } catch (error) {
      Alert.alert('Location', 'Unable to detect current location. Please tap on map.');
    } finally {
      setLocating(false);
    }
  };

  const onMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedCoords({ latitude, longitude });
    const label = await reverseGeocodeToLabel(latitude, longitude);
    if (label) setLocation(label);
  };

  const confirmLocation = () => {
    if (!location.trim()) {
      Alert.alert('Validation', 'Please select on map or enter address manually.');
      return;
    }
    setLocationModalVisible(false);
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
    const trimmedLocation = location.trim();
    const addressLocation = buildAddressLabel();
    const finalLocation = trimmedLocation || addressLocation;
    const trimmedDescription = description.trim();
    const trimmedState = stateName.trim();
    const trimmedDistrict = district.trim();
    const trimmedVillage = village.trim();
    const trimmedArea = area.trim();
    const trimmedPinCode = pinCode.trim();
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
    if (!finalLocation) {
      Alert.alert('Validation', 'Please select location or add address.');
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
      const finalImageIds = [...existingImageIds, ...uploadedImageIds];

      if (isEditMode) {
        await databases.updateDocument(
          DATABASE_ID,
          POSTS_COLLECTION_ID,
          editPost.$id,
          {
            title: trimmedTitle,
            category: selectedCategory,
            price: numericPrice,
            location: finalLocation,
            state: trimmedState,
            district: trimmedDistrict,
            village: trimmedVillage,
            area: trimmedArea,
            pinCode: trimmedPinCode,
            description: trimmedDescription,
            imageIds: JSON.stringify(finalImageIds),
          }
        );

        Alert.alert('Success', 'Item updated successfully.');
        navigation.replace('MyPosts');
        return;
      }

      await databases.createDocument(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        ID.unique(),
        {
          title: trimmedTitle,
          category: selectedCategory,
          price: numericPrice,
          location: finalLocation,
          state: trimmedState,
          district: trimmedDistrict,
          village: trimmedVillage,
          area: trimmedArea,
          pinCode: trimmedPinCode,
          description: trimmedDescription,
          role: 'user',
          createdByRole: 'user',
          isAdminPost: false,
          createdBy: currentUser?.$id || '',
          imageIds: JSON.stringify(finalImageIds),
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

  const addressPreview = buildAddressLabel();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.heading}>
              {isEditMode ? 'Update Item' : 'List Item for Sell'}
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

            <Button mode="outlined" icon="map-marker-outline" onPress={openLocationModal} style={styles.input}>
              Select Location
            </Button>
            {!!location && (
              <Text variant="bodySmall" style={styles.selectedLocationText}>
                Selected location: {location}
              </Text>
            )}
            <Button
              mode="outlined"
              icon="home-map-marker"
              onPress={() => setShowAddressFields((prev) => !prev)}
              style={styles.input}
            >
              Add Address
            </Button>
            {!!addressPreview && (
              <Text variant="bodySmall" style={styles.selectedAddressText}>
                Selected address: {addressPreview}
              </Text>
            )}

            {showAddressFields ? (
              <View style={styles.addressBox}>
                <TextInput
                  mode="outlined"
                  label="State"
                  value={stateName}
                  onChangeText={setStateName}
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="District"
                  value={district}
                  onChangeText={setDistrict}
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="Village / Town"
                  value={village}
                  onChangeText={setVillage}
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="Area / Landmark"
                  value={area}
                  onChangeText={setArea}
                  style={styles.input}
                />
                <TextInput
                  mode="outlined"
                  label="PIN Code"
                  keyboardType="number-pad"
                  value={pinCode}
                  onChangeText={setPinCode}
                  style={styles.input}
                />
              </View>
            ) : null}

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
            {existingImageIds.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageList}
              >
                {existingImageIds.map((imageId) => (
                  <View key={imageId} style={styles.imageItem}>
                    <Image
                      source={{ uri: getStorageFileViewUrl(LISTING_IMAGES_BUCKET_ID, imageId) }}
                      style={styles.previewImage}
                    />
                    <IconButton
                      icon="close-circle"
                      size={18}
                      style={styles.removeImageButton}
                      iconColor="#d32f2f"
                      onPress={() => removeExistingImage(imageId)}
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
              {isEditMode ? 'Update Listing' : 'Publish Listing'}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <UserBottomNav activeTab="sell" />

      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.locationModalRoot}>
          <Pressable style={styles.locationBackdrop} onPress={() => setLocationModalVisible(false)} />
          <View style={styles.locationModalCard}>
            <View style={styles.locationModalHeader}>
              <Text variant="titleMedium" style={styles.heading}>
                Choose Location
              </Text>
              <IconButton icon="close" onPress={() => setLocationModalVisible(false)} />
            </View>
            {locating ? (
              <Text style={styles.locationHint}>Detecting current location...</Text>
            ) : null}

            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              onPress={onMapPress}
            >
              {selectedCoords ? <Marker coordinate={selectedCoords} /> : null}
            </MapView>

            <TextInput
              mode="outlined"
              label="Location (manual)"
              value={location}
              onChangeText={setLocation}
              style={styles.locationManualInput}
            />

            <View style={styles.locationActionRow}>
              <Button mode="outlined" onPress={() => setLocationModalVisible(false)} style={styles.locationActionBtn}>
                Cancel
              </Button>
              <Button mode="contained" onPress={confirmLocation} style={styles.locationActionBtn}>
                Use This
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  selectedLocationText: {
    marginTop: -6,
    marginBottom: 10,
    color: '#444',
  },
  selectedAddressText: {
    marginTop: -6,
    marginBottom: 10,
    color: '#444',
  },
  addressBox: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  locationModalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  locationModalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    maxHeight: '80%',
  },
  locationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  locationHint: {
    marginBottom: 6,
    color: '#666',
  },
  map: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    marginBottom: 10,
  },
  locationManualInput: {
    marginBottom: 10,
  },
  locationActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationActionBtn: {
    width: '48%',
  },
  locationBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});

export default UserCreateListingScreen;
