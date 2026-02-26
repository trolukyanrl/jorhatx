import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Avatar, Chip, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../../services/auth';
import AdminBottomNav from '../../components/AdminBottomNav';
import { AuthContext } from '../../context/AuthContext';

const AdminProfileScreen = () => {
  const navigation = useNavigation();
  const { handleLogout: performLogout } = useContext(AuthContext);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userData = await authService.getCurrentUser();
    setUser(userData);
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
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text size={64} label={`${user?.name?.charAt(0) || 'A'}`} />
            <Text variant="titleLarge" style={styles.name}>
              {user?.name || 'Admin'}
            </Text>
            <Text variant="bodyMedium" style={styles.email}>
              {user?.email || ''}
            </Text>
            <Chip icon="shield-star" style={styles.roleChip}>
              Admin
            </Chip>
          </Card.Content>
        </Card>

        <Card>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <List.Section>
            <List.Item
              title="System Settings"
              description="Configure platform settings"
              left={(props) => <List.Icon {...props} icon="cog" />}
              onPress={() => navigation.navigate('SystemSettings')}
            />
            <List.Item
              title="Backup & Restore"
              description="Manage data backups"
              left={(props) => <List.Icon {...props} icon="database" />}
              onPress={() => navigation.navigate('BackupRestore')}
            />
            <List.Item
              title="Security Logs"
              description="View security events"
              left={(props) => <List.Icon {...props} icon="security" />}
              onPress={() => navigation.navigate('SecurityLogs')}
            />
            <List.Item
              title="Security"
              description="Manage account security"
              left={(props) => <List.Icon {...props} icon="security" />}
            />
            <List.Item
              title="Help & Support"
              description="Get admin support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              onPress={() => navigation.navigate('AdminHelp')}
            />
            <List.Item
              title="Logout"
              description="Sign out of admin account"
              left={(props) => <List.Icon {...props} icon="logout" />}
              onPress={handleLogout}
              style={styles.logoutItem}
            />
          </List.Section>
        </Card>
      </ScrollView>

      <AdminBottomNav activeTab="profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 90,
  },
  profileCard: {
    borderRadius: 10,
    marginBottom: 12,
  },
  profileContent: {
    alignItems: 'center',
  },
  name: {
    marginTop: 10,
    fontWeight: '700',
    color: '#222',
  },
  email: {
    marginTop: 4,
    color: '#666',
  },
  roleChip: {
    marginTop: 8,
    backgroundColor: '#fff3e0',
  },
  sectionTitle: {
    marginTop: 16,
    marginHorizontal: 16,
    fontWeight: '700',
    color: '#333',
  },
  logoutItem: {
    backgroundColor: '#ffebee',
  },
});

export default AdminProfileScreen;
