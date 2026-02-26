import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { authService } from '../../services/auth';
import AdminBottomNav from '../../components/AdminBottomNav';

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const result = await authService.getRegisteredUsers();
    if (result.success) {
      setUsers(result.users);
    } else {
      setUsers([]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const renderUser = ({ item }) => {
    const createdAt = item.$createdAt
      ? new Date(item.$createdAt).toLocaleDateString()
      : 'N/A';

    return (
      <Card style={styles.userCard}>
        <Card.Content>
          <View style={styles.row}>
            <Text variant="titleSmall" style={styles.userTitle}>
              {item.name || item.email || item.$id}
            </Text>
            <Chip
              compact
              style={item.banned ? styles.bannedChip : styles.activeChip}
              textStyle={styles.chipText}
            >
              {item.banned ? 'Banned' : 'Active'}
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.metaText}>
            Email: {item.email || 'Not available'}
          </Text>
          <Text variant="bodySmall" style={styles.metaText}>
            Role: {item.role || 'user'}
          </Text>
          <Text variant="bodySmall" style={styles.metaText}>
            Registered: {createdAt}
          </Text>
          <Text variant="bodySmall" style={styles.metaText}>
            User ID: {item.$id}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text>Loading users...</Text>
        </View>
        <AdminBottomNav activeTab="main" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.heading}>
        Registered Users ({users.length})
      </Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.$id}
        renderItem={renderUser}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>No users found.</Text>
          </View>
        }
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : styles.listContent}
      />
      <AdminBottomNav activeTab="main" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  heading: {
    fontWeight: '700',
    marginBottom: 10,
    color: '#333',
  },
  listContent: {
    paddingBottom: 96,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 96,
  },
  userCard: {
    marginBottom: 10,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userTitle: {
    fontWeight: '700',
    color: '#222',
    flex: 1,
    marginRight: 8,
  },
  metaText: {
    color: '#555',
    marginTop: 2,
  },
  activeChip: {
    backgroundColor: '#e8f5e9',
  },
  bannedChip: {
    backgroundColor: '#ffebee',
  },
  chipText: {
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserManagementScreen;
