import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, List, Avatar, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth';
import UserBottomNav from '../../components/UserBottomNav';
import { AuthContext } from '../../context/AuthContext';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { handleLogout: performLogout } = useContext(AuthContext);
  const [user, setUser] = useState(null);

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
            const result = await performLogout();
            if (result.success) {
              return;
            } else {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <Avatar.Text size={64} label={`${user?.name?.charAt(0) || 'U'}`} />
          <View style={styles.welcomeText}>
            <Text variant="titleLarge" style={styles.userName}>
              Welcome, {user?.name || 'User'}
            </Text>
            <Text variant="bodyMedium" style={styles.userEmail}>
              {user?.email || ''}
            </Text>
            <Chip icon="shield-check" style={styles.userRole}>
              User
            </Chip>
          </View>
        </View>

        <View style={styles.accountSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account
          </Text>
          <List.Section>
            <List.Item
              title="My Posts"
              description="View posts you have listed"
              left={(props) => <List.Icon {...props} icon="post-outline" />}
              onPress={() => navigation.navigate('MyPosts')}
            />
            <List.Item
              title="Profile Settings"
              description="Update your profile information"
              left={(props) => <List.Icon {...props} icon="account-cog" />}
            />
            <List.Item
              title="Security"
              description="Change password and security settings"
              left={(props) => <List.Icon {...props} icon="security" />}
              onPress={() => navigation.navigate('Security')}
            />
            <List.Item
              title="Help & Support"
              description="Get help and support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              onPress={() => navigation.navigate('Help')}
            />
            <List.Item
              title="Logout"
              description="Sign out of your account"
              left={(props) => <List.Icon {...props} icon="logout" />}
              onPress={handleLogout}
              style={styles.logoutItem}
            />
          </List.Section>
        </View>
      </ScrollView>

      <UserBottomNav activeTab="profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 96,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 12,
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
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginHorizontal: 0,
  },
  accountSection: {
    paddingHorizontal: 8,
  },
  logoutItem: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
});

export default ProfileScreen;
