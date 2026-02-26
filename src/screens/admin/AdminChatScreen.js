import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, List } from 'react-native-paper';
import AdminBottomNav from '../../components/AdminBottomNav';

const AdminChatScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              Admin Chat
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Manage conversations with users and support requests.
            </Text>
          </Card.Content>
        </Card>

        <Card>
          <List.Section>
            <List.Item
              title="No chats yet"
              description="New admin chats will appear here."
              left={(props) => <List.Icon {...props} icon="chat-processing-outline" />}
            />
          </List.Section>
        </Card>
      </View>

      <AdminBottomNav activeTab="chat" />
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
    padding: 12,
    paddingBottom: 90,
  },
  headerCard: {
    marginBottom: 12,
    borderRadius: 10,
  },
  title: {
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    marginTop: 6,
    color: '#666',
  },
});

export default AdminChatScreen;
