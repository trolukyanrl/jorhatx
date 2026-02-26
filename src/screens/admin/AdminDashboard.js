import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  Surface,
  IconButton,
  TextInput,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { categoryService } from '../../services/category';
import AdminBottomNav from '../../components/AdminBottomNav';
import { locationService } from '../../services/location';

const AdminDashboard = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const activeTab = route.params?.activeTab || 'main';
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locationLabel, setLocationLabel] = useState('Locating...');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState('');

  useEffect(() => {
    loadCategories();
    loadLocation();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), loadLocation()]);
    setRefreshing(false);
  };

  const loadCategories = async () => {
    const result = await categoryService.getCategories();
    if (result.success) {
      setCategories(result.categories);
      return;
    }
    setCategories([]);
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

  const handleUserManagement = () => {
    navigation.navigate('UserManagement');
  };

  const handleContentModeration = () => {
    navigation.navigate('ContentModeration');
  };

  const handleCategoryManagement = () => {
    navigation.navigate('CategoryManagement');
  };

  const handleAnalytics = () => {
    navigation.navigate('Analytics');
  };

  const handleReports = () => {
    navigation.navigate('Reports');
  };

  const handleListItemForSell = () => {
    navigation.navigate('AdminCreateListing');
  };

  const handleViewListedItems = () => {
    navigation.navigate('AdminListedItems');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Categories
        </Text>
        <View style={styles.categoryWrap}>
          {categories.length === 0 ? (
            <Text variant="bodySmall" style={styles.emptyCategoryText}>
              No categories yet. Add from Category Management.
            </Text>
          ) : (
            categories.map((category) => (
              <Chip key={category.$id} style={styles.categoryChip} icon="tag-outline">
                {category.name}
              </Chip>
            ))
          )}
        </View>
      </View>

      {/* Admin Actions Grid */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Admin Actions
        </Text>
        <View style={styles.adminActionsGrid}>
          <Surface style={styles.adminActionCard} elevation={2}>
            <Button
              mode="contained"
              onPress={handleUserManagement}
              style={styles.adminActionButton}
              icon="account-group"
            >
              User Management
            </Button>
            <Text variant="bodySmall" style={styles.actionDescription}>
              View, ban, and manage users
            </Text>
          </Surface>

          <Surface style={styles.adminActionCard} elevation={2}>
            <Button
              mode="contained"
              onPress={handleContentModeration}
              style={[styles.adminActionButton, styles.moderationButton]}
              icon="gavel"
            >
              Content Moderation
            </Button>
            <Text variant="bodySmall" style={styles.actionDescription}>
              Review and manage listings
            </Text>
          </Surface>

          <Surface style={styles.adminActionCard} elevation={2}>
            <Button
              mode="contained"
              onPress={handleCategoryManagement}
              style={[styles.adminActionButton, styles.categoryButton]}
              icon="tag"
            >
              Category Management
            </Button>
            <Text variant="bodySmall" style={styles.actionDescription}>
              Manage product categories
            </Text>
          </Surface>

          <Surface style={styles.adminActionCard} elevation={2}>
            <Button
              mode="contained"
              onPress={handleAnalytics}
              style={[styles.adminActionButton, styles.analyticsButton]}
              icon="chart-line"
            >
              Analytics
            </Button>
            <Text variant="bodySmall" style={styles.actionDescription}>
              View platform statistics
            </Text>
          </Surface>

          <Surface style={styles.adminActionCard} elevation={2}>
            <Button
              mode="contained"
              onPress={handleReports}
              style={[styles.adminActionButton, styles.reportsButton]}
              icon="alert"
            >
              Reports
            </Button>
            <Text variant="bodySmall" style={styles.actionDescription}>
              View user reports
            </Text>
          </Surface>

          <Surface style={styles.adminActionCard} elevation={2}>
            <Button
              mode="contained"
              onPress={handleListItemForSell}
              style={[styles.adminActionButton, styles.sellButton]}
              icon="cart-plus"
            >
              List Item
            </Button>
            <Text variant="bodySmall" style={styles.actionDescription}>
              Create item listing for sale
            </Text>
          </Surface>

          <Surface style={styles.adminActionCard} elevation={2}>
            <Button
              mode="contained"
              onPress={handleViewListedItems}
              style={[styles.adminActionButton, styles.viewItemsButton]}
              icon="view-list"
            >
              View Listings
            </Button>
            <Text variant="bodySmall" style={styles.actionDescription}>
              See all admin listed items
            </Text>
          </Surface>
        </View>
      </View>

      {/* Admin Stats */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Platform Overview
        </Text>
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="titleLarge" style={styles.statNumber}>
                0
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Total Users
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="titleLarge" style={styles.statNumber}>
                0
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Active Listings
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="titleLarge" style={styles.statNumber}>
                0
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Pending Reports
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      </ScrollView>

      <AdminBottomNav activeTab={activeTab} />

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
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 90,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
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
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  adminActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  adminActionCard: {
    width: '48%',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  adminActionButton: {
    marginBottom: 8,
    backgroundColor: '#6200ea',
  },
  moderationButton: {
    backgroundColor: '#d32f2f',
  },
  categoryButton: {
    backgroundColor: '#388e3c',
  },
  analyticsButton: {
    backgroundColor: '#1976d2',
  },
  reportsButton: {
    backgroundColor: '#f57c00',
  },
  sellButton: {
    backgroundColor: '#00897b',
  },
  viewItemsButton: {
    backgroundColor: '#5d4037',
  },
  actionDescription: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ea',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f3e5f5',
    borderRadius: 4,
  },
  emptyCategoryText: {
    color: '#666',
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

export default AdminDashboard;
