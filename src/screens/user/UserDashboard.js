import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { Searchbar, IconButton, Button, Chip, Card, Text, TextInput } from 'react-native-paper';
import { Query } from 'react-native-appwrite';
import { useNavigation } from '@react-navigation/native';
import {
  databases,
  DATABASE_ID,
  POSTS_COLLECTION_ID,
  LISTING_IMAGES_BUCKET_ID,
  getStorageFileViewUrl,
} from '../../services/appwrite';
import { categoryService } from '../../services/category';
import UserBottomNav from '../../components/UserBottomNav';
import { authService } from '../../services/auth';
import { wishlistService } from '../../services/wishlist';
import { locationService } from '../../services/location';

const UserDashboard = ({ showBottomNav = true }) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('none');
  const [maxPrice, setMaxPrice] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [wishlistedIds, setWishlistedIds] = useState([]);
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [userListedPosts, setUserListedPosts] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingUserPosts, setLoadingUserPosts] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [locationLabel, setLocationLabel] = useState('Locating...');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState('');
  const filterSlideAnim = useState(new Animated.Value(-240))[0];

  useEffect(() => {
    loadRecommendedPosts();
    loadUserPosts();
    loadCategories();
    loadWishlist();
    loadLocation();
  }, []);

  const loadRecommendedPosts = async () => {
    if (!POSTS_COLLECTION_ID) {
      setRecommendedPosts([]);
      return;
    }

    setLoadingRecommendations(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [Query.orderDesc('$createdAt'), Query.limit(20)]
      );

      const adminPosts = response.documents.filter(
        (post) =>
          post.role === 'admin' ||
          post.authorRole === 'admin' ||
          post.postedByRole === 'admin' ||
          post.createdByRole === 'admin' ||
          post.isAdminPost === true
      );

      setRecommendedPosts(adminPosts);
    } catch (error) {
      console.error('Failed to load recommended posts:', error);
      setRecommendedPosts([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const loadCategories = async () => {
    const result = await categoryService.getCategories();
    if (result.success) {
      setCategories(result.categories);
      return;
    }

    setCategories([]);
  };

  const loadUserPosts = async () => {
    if (!POSTS_COLLECTION_ID) {
      setUserListedPosts([]);
      return;
    }

    setLoadingUserPosts(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [Query.orderDesc('$createdAt'), Query.limit(100)]
      );
      setUserListedPosts(response.documents || []);
    } catch (error) {
      console.error('Failed to load user listed posts:', error);
      setUserListedPosts([]);
    } finally {
      setLoadingUserPosts(false);
    }
  };

  const loadWishlist = async () => {
    const currentUser = await authService.getCurrentUser();
    const userId = currentUser?.$id || null;
    setCurrentUserId(userId);
    const ids = await wishlistService.getWishlistIds(userId);
    setWishlistedIds(ids);
  };

  const loadLocation = async () => {
    const result = await locationService.getPreferredLocationLabel();
    setLocationLabel(result.location || 'Location unavailable');
  };

  const openLocationModal = () => {
    setManualLocationInput(locationLabel === 'Locating...' ? '' : locationLabel);
    setLocationModalVisible(true);
  };

  const closeLocationModal = () => {
    setLocationModalVisible(false);
  };

  const handleUseCurrentLocation = async () => {
    await locationService.clearManualLocationLabel();
    const result = await locationService.getCurrentLocationLabel();
    setLocationLabel(result.location || 'Location unavailable');
    closeLocationModal();
  };

  const handleSaveManualLocation = async () => {
    const value = manualLocationInput.trim();
    if (!value) {
      Alert.alert('Validation', 'Please enter a location.');
      return;
    }

    const result = await locationService.setManualLocationLabel(value);
    if (result.success) {
      setLocationLabel(result.location);
      closeLocationModal();
      return;
    }

    Alert.alert('Error', result.error || 'Failed to save location.');
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

  const matchesFilters = (post) => {
    const query = searchQuery.trim().toLowerCase();
    const postCategory = (post.category || post.type || '').toString().toLowerCase();
    const matchesCategory =
      activeCategory === 'all' || postCategory === activeCategory.toLowerCase();
    const numericPrice = Number(post.price || 0);
    const matchesPrice = maxPrice == null || (!Number.isNaN(numericPrice) && numericPrice <= maxPrice);

    if (!query) return matchesCategory && matchesPrice;

    const searchable = [
      post.title,
      post.name,
      post.category,
      post.type,
      post.description,
      post.price?.toString(),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return matchesCategory && matchesPrice && searchable.includes(query);
  };

  const applySort = (posts) => {
    const sorted = [...posts];
    if (sortBy === 'price_low_high') {
      sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'price_high_low') {
      sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }
    return sorted;
  };

  const filteredRecommendedPosts = applySort(recommendedPosts.filter(matchesFilters));
  const filteredUserPosts = applySort(userListedPosts.filter(matchesFilters));

  const isWishlisted = (postId) => wishlistedIds.includes(postId);

  const toggleWishlist = async (postId) => {
    const updated = await wishlistService.toggleWishlist(currentUserId, postId);
    setWishlistedIds(updated);
  };

  const renderPostImage = (post) => {
    const imageIds = parseImageIds(post.imageIds);
    const firstImageId = imageIds[0];
    if (!firstImageId || !LISTING_IMAGES_BUCKET_ID) return null;

    return (
      <View style={styles.postImageWrap}>
        <Image
          source={{
            uri: getStorageFileViewUrl(LISTING_IMAGES_BUCKET_ID, firstImageId),
          }}
          style={styles.postImage}
        />
        <IconButton
          icon={isWishlisted(post.$id) ? 'heart' : 'heart-outline'}
          iconColor={isWishlisted(post.$id) ? '#e53935' : '#fff'}
          size={20}
          style={styles.wishlistIcon}
          onPress={() => toggleWishlist(post.$id)}
        />
      </View>
    );
  };

  const openFilterPanel = () => {
    setFilterVisible(true);
    Animated.timing(filterSlideAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeFilterPanel = () => {
    Animated.timing(filterSlideAnim, {
      toValue: -240,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setFilterVisible(false));
  };

  const clearFilters = () => {
    setSortBy('none');
    setMaxPrice(null);
    closeFilterPanel();
  };

  return (
    <View style={styles.container}>
      <View style={styles.appHeader}>
        <Text variant="titleLarge" style={styles.appName}>
          JorhatX
        </Text>
        <View style={styles.locationWrap}>
          <Text variant="bodySmall" style={styles.locationText} numberOfLines={1}>
            {locationLabel}
          </Text>
          <IconButton
            icon="map-marker-outline"
            size={22}
            style={styles.locationButton}
            onPress={openLocationModal}
          />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.topBar}>
          <Searchbar
            placeholder="Search products, categories..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          <IconButton
            icon="heart-outline"
            size={22}
            style={styles.topIconButton}
            onPress={() => navigation.navigate('Wishlist')}
          />
          <IconButton
            icon="bell-outline"
            size={22}
            style={styles.topIconButton}
            onPress={() => Alert.alert('Notifications', 'Notifications page coming soon')}
          />
        </View>

        <View style={styles.categoryRow}>
          <IconButton
            icon="filter-variant"
            size={22}
            style={styles.filterButton}
            onPress={openFilterPanel}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            <Button
              mode="contained"
              icon="view-grid-outline"
              style={styles.categoryButton}
              onPress={() => setActiveCategory('all')}
            >
              Category
            </Button>
            {categories.map((item) => (
              <Chip
                key={item.$id || item.name}
                mode={activeCategory === item.name ? 'flat' : 'outlined'}
                selected={activeCategory === item.name}
                icon="tag-outline"
                style={[
                  styles.categoryChip,
                  activeCategory === item.name && styles.selectedCategoryChip,
                ]}
                onPress={() => setActiveCategory(item.name)}
              >
                {item.name}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <View style={styles.recommendedSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Suggested for You
          </Text>

          {loadingRecommendations ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text>Loading recommendations...</Text>
              </Card.Content>
            </Card>
          ) : filteredRecommendedPosts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyTitle}>No matching admin posts</Text>
                <Text variant="bodySmall" style={styles.emptyText}>
                  Try a different search or category.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedList}
            >
              {filteredRecommendedPosts.map((post) => (
                <Card
                  key={post.$id}
                  style={styles.postCard}
                  onPress={() => navigation.navigate('UserPostDetail', { post })}
                >
                  {renderPostImage(post)}
                  <Card.Content>
                    <Text variant="titleSmall" style={styles.postTitle}>
                      {post.title || post.name || 'Untitled Post'}
                    </Text>
                    <Text variant="bodySmall" style={styles.postMeta}>
                      {(post.category || post.type || 'General').toString()}
                      {post.price ? ` | Rs. ${post.price}` : ''}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.recommendedSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Newly Added Posts
          </Text>

          {loadingUserPosts ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text>Loading user listings...</Text>
              </Card.Content>
            </Card>
          ) : filteredUserPosts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyTitle}>No matching user listings</Text>
                <Text variant="bodySmall" style={styles.emptyText}>
                  Try a different search or category.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.userGrid}>
              {filteredUserPosts.map((post) => (
                <Card
                  key={post.$id}
                  style={styles.userPostCard}
                  onPress={() => navigation.navigate('UserPostDetail', { post })}
                >
                  {renderPostImage(post)}
                  <Card.Content>
                    <Text variant="titleSmall" style={styles.postTitle}>
                      {post.title || post.name || 'Untitled Post'}
                    </Text>
                    <Text variant="bodySmall" style={styles.postMeta}>
                      {(post.category || post.type || 'General').toString()}
                      {post.price ? ` | Rs. ${post.price}` : ''}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {showBottomNav ? <UserBottomNav activeTab="home" /> : null}

      <Modal visible={filterVisible} transparent animationType="none" onRequestClose={closeFilterPanel}>
        <View style={styles.filterModalRoot}>
          <Animated.View style={[styles.filterPanel, { transform: [{ translateX: filterSlideAnim }] }]}>
            <Text variant="titleMedium" style={styles.filterTitle}>
              Filters
            </Text>

            <Text variant="bodySmall" style={styles.filterLabel}>
              Sort by
            </Text>
            <Chip
              selected={sortBy === 'price_low_high'}
              style={styles.filterChip}
              onPress={() => setSortBy('price_low_high')}
            >
              Price low to high
            </Chip>
            <Chip
              selected={sortBy === 'price_high_low'}
              style={styles.filterChip}
              onPress={() => setSortBy('price_high_low')}
            >
              Price high to low
            </Chip>

            <Text variant="bodySmall" style={styles.filterLabel}>
              Max price
            </Text>
            <Chip
              selected={maxPrice === 50000}
              style={styles.filterChip}
              onPress={() => setMaxPrice(50000)}
            >
              Price below 50000
            </Chip>
            <Chip
              selected={maxPrice === 100000}
              style={styles.filterChip}
              onPress={() => setMaxPrice(100000)}
            >
              Price below 100000
            </Chip>
            <Chip
              selected={maxPrice === 500000}
              style={styles.filterChip}
              onPress={() => setMaxPrice(500000)}
            >
              Price below 500000
            </Chip>

            <View style={styles.filterActionRow}>
              <Button mode="outlined" onPress={clearFilters} style={styles.filterActionBtn}>
                Clear
              </Button>
              <Button mode="contained" onPress={closeFilterPanel} style={styles.filterActionBtn}>
                Apply
              </Button>
            </View>
          </Animated.View>
          <Pressable style={styles.filterBackdrop} onPress={closeFilterPanel} />
        </View>
      </Modal>

      <Modal visible={locationModalVisible} transparent animationType="fade" onRequestClose={closeLocationModal}>
        <Pressable style={styles.locationOverlay} onPress={closeLocationModal}>
          <Pressable style={styles.locationModalCard}>
            <Text variant="titleMedium" style={styles.locationModalTitle}>
              Set Location
            </Text>
            <TextInput
              mode="outlined"
              value={manualLocationInput}
              onChangeText={setManualLocationInput}
              placeholder="Enter city or area"
              style={styles.locationInput}
            />
            <View style={styles.locationActionRow}>
              <Button mode="outlined" onPress={handleUseCurrentLocation} style={styles.locationActionButton}>
                Use Current
              </Button>
              <Button mode="contained" onPress={handleSaveManualLocation} style={styles.locationActionButton}>
                Save
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 96,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  appName: {
    fontWeight: '700',
    color: '#222',
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '65%',
  },
  locationText: {
    color: '#444',
    marginRight: 2,
  },
  locationButton: {
    margin: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  searchBar: {
    flex: 1,
    marginRight: 4,
    borderRadius: 10,
  },
  topIconButton: {
    margin: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  filterButton: {
    margin: 0,
    marginRight: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButton: {
    marginRight: 8,
    backgroundColor: '#6200ea',
    borderRadius: 4,
  },
  categoryList: {
    paddingRight: 10,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  selectedCategoryChip: {
    backgroundColor: '#e3f2fd',
  },
  recommendedSection: {
    marginTop: 14,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#666',
    marginTop: 4,
    marginBottom: 10,
  },
  postCard: {
    width: 240,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  userPostCard: {
    width: '48%',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  userGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  postImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#eee',
  },
  postImageWrap: {
    position: 'relative',
  },
  wishlistIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  recommendedList: {
    paddingRight: 10,
  },
  postTitle: {
    fontWeight: '600',
    color: '#222',
  },
  postMeta: {
    marginTop: 6,
    color: '#666',
  },
  emptyCard: {
    borderRadius: 8,
  },
  emptyTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    color: '#666',
  },
  filterModalRoot: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 118,
    paddingBottom: 86,
  },
  filterBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  filterPanel: {
    width: 240,
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: 14,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.08)',
  },
  filterTitle: {
    fontWeight: '700',
    marginBottom: 10,
  },
  filterLabel: {
    color: '#666',
    marginTop: 10,
    marginBottom: 6,
  },
  filterChip: {
    marginBottom: 8,
  },
  filterActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  filterActionBtn: {
    width: '48%',
  },
  locationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  locationModalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
  },
  locationModalTitle: {
    fontWeight: '700',
    marginBottom: 10,
  },
  locationInput: {
    marginBottom: 12,
  },
  locationActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationActionButton: {
    width: '48%',
  },
});

export default UserDashboard;
