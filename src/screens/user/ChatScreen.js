import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, List } from 'react-native-paper';
import UserBottomNav from '../../components/UserBottomNav';

const ChatScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              Chats
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Recent conversations with buyers and sellers
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.chatListCard}>
          <List.Section>
            <List.Item
              title="No chats yet"
              description="Your conversations will appear here."
              left={(props) => <List.Icon {...props} icon="chat-processing-outline" />}
            />
          </List.Section>
        </Card>
      </ScrollView>

      <UserBottomNav activeTab="chat" />
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
  headerCard: {
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    marginTop: 6,
    color: '#666',
  },
  chatListCard: {
    marginBottom: 12,
  },
});

export default ChatScreen;
