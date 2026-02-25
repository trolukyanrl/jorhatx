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
  Surface,
} from 'react-native-paper';
import { authService } from '../../services/auth';
import { useNavigation } from '@react-navigation/native';

const AdminDashboard = () => {
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
        <Avatar.Text size={64} label={`${user.name?.charAt(0) || 'A'}`} />
        <View style={styles.welcomeText}>
          <Text variant="titleLarge" style={styles.userName}>
            Welcome, {user.name || 'Admin'}
          </Text>
          <Text variant="bodyMedium" style={styles.userEmail}>
            {user.email}
          </Text>
          <Chip icon="shield-star" style={styles.adminRole}>
            Admin
          </Chip>
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

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Quick Actions
        </Text>
        <List.Section>
          <List.Item
            title="System Settings"
            description="Configure platform settings"
            left={(props) => <List.Icon {...props} icon="cog" />}
            onPress={() => navigation.navigate('SystemSettings')}
            style={styles.listItem}
          />
          <List.Item
            title="Backup & Restore"
            description="Manage data backups"
            left={(props) => <List.Icon {...props} icon="database" />}
            onPress={() => navigation.navigate('BackupRestore')}
            style={styles.listItem}
          />
          <List.Item
            title="Security Logs"
            description="View security events"
            left={(props) => <List.Icon {...props} icon="security" />}
            onPress={() => navigation.navigate('SecurityLogs')}
            style={styles.listItem}
          />
          <List.Item
            title="Help & Support"
            description="Admin help and documentation"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            onPress={() => navigation.navigate('AdminHelp')}
            style={styles.listItem}
          />
          <List.Item
            title="Logout"
            description="Sign out of admin account"
            left={(props) => <List.Icon {...props} icon="logout" />}
            onPress={handleLogout}
            style={[styles.listItem, styles.logoutItem]}
          />
        </List.Section>
      </View>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="shield-check"
        label="Admin Panel"
        onPress={() => navigation.navigate('AdminPanel')}
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
  adminRole: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
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
    backgroundColor: '#d32f2f',
  },
  loadingCard: {
    margin: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
  },
});

export default AdminDashboard;