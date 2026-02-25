import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Avatar,
  Chip,
  List,
  FAB,
} from 'react-native-paper';
import { authService } from '../../services/auth';
import { useNavigation } from '@react-navigation/native';

const UserDashboard = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const result = await authService.logout();
            if (result.success) {
              navigation.replace('Login');
            } else {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  const handleListings = () => {
    navigation.navigate('MyListings');
  };

  const handleCategories = () => {
    navigation.navigate('Categories');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Card style={styles.loadingCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.loadingText}>
              Loading...
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Avatar.Text size={64} label={`${user.name?.charAt(0) || 'U'}`} />
        <View style={styles.welcomeText}>
          <Text variant="titleLarge" style={styles.userName}>
            Welcome, {user.name || 'User'}
          </Text>
          <Text variant="bodyMedium" style={styles.userEmail}>
            {user.email}
          </Text>
          <Chip icon="shield-check" style={styles.userRole}>
            User
          </Chip>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Quick Actions
        </Text>
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleListings}
            style={styles.actionButton}
            icon="format-list-bulleted"
          >
            My Listings
          </Button>
          <Button
            mode="outlined"
            onPress={handleCategories}
            style={styles.actionButton}
            icon="tag"
          >
            Browse Categories
          </Button>
          <Button
            mode="outlined"
            onPress={handleProfile}
            style={styles.actionButton}
            icon="account"
          >
            Profile
          </Button>
        </View>
      </View>

      {/* User Stats */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Your Stats
        </Text>
        <View style={styles.statsContainer}>
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
                Messages
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text variant="titleLarge" style={styles.statNumber}>
                0
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                Favorites
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Account
        </Text>
        <List.Section>
          <List.Item
            title="Profile Settings"
            description="Update your profile information"
            left={(props) => <List.Icon {...props} icon="account-cog" />}
            onPress={handleProfile}
            style={styles.listItem}
          />
          <List.Item
            title="Security"
            description="Change password and security settings"
            left={(props) => <List.Icon {...props} icon="security" />}
            onPress={() => navigation.navigate('Security')}
            style={styles.listItem}
          />
          <List.Item
            title="Help & Support"
            description="Get help and support"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            onPress={() => navigation.navigate('Help')}
            style={styles.listItem}
          />
          <List.Item
            title="Logout"
            description="Sign out of your account"
            left={(props) => <List.Icon {...props} icon="logout" />}
            onPress={handleLogout}
            style={[styles.listItem, styles.logoutItem]}
          />
        </List.Section>
      </View>

      {/* Floating Action Button for adding listings */}
      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Listing"
        onPress={() => navigation.navigate('CreateListing')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    color: '#666',
    marginBottom: 8,
  },
  userRole: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
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
  actionButtons: {
    gap: 10,
  },
  actionButton: {
    marginBottom: 8,
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
  listItem: {
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  logoutItem: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ea',
  },
  loadingCard: {
    margin: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
  },
});

export default UserDashboard;