import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const MessageStatus = ({ status, isMine, createdAt }) => {
  if (!isMine) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '✓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return '#9e9e9e';
      case 'delivered':
        return '#616161';
      case 'read':
        return '#2e7d32';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <View style={styles.container}>
      <Text 
        style={[
          styles.statusText, 
          { color: getStatusColor(status) }
        ]}
      >
        {getStatusIcon(status)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 8,
    justifyContent: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MessageStatus;