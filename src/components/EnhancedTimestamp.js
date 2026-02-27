import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';

const EnhancedTimestamp = ({ timestamp, isMine }) => {
  const [showExactTime, setShowExactTime] = useState(false);

  if (!timestamp) return null;

  const date = new Date(timestamp);
  
  // Format relative time
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relativeTime = '';

  if (diffMins < 1) {
    relativeTime = 'Just now';
  } else if (diffMins < 60) {
    relativeTime = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    relativeTime = `${diffHours}h ago`;
  } else if (diffDays < 7) {
    relativeTime = `${diffDays}d ago`;
  } else {
    // Show date for older messages
    const options = { month: 'short', day: 'numeric' };
    relativeTime = date.toLocaleDateString(undefined, options);
  }

  // Format exact time
  const exactTime = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const exactDate = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isMine ? styles.mineContainer : styles.otherContainer
      ]}
      onPress={() => setShowExactTime(!showExactTime)}
      activeOpacity={0.7}
    >
      <Text 
        style={[
          styles.timeText,
          isMine ? styles.mineTimeText : styles.otherTimeText
        ]}
      >
        {showExactTime ? exactTime : relativeTime}
      </Text>
      {showExactTime && (
        <Text 
          style={[
            styles.dateText,
            isMine ? styles.mineDateText : styles.otherDateText
          ]}
        >
          {exactDate}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  mineContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 11,
    color: '#777',
  },
  mineTimeText: {
    color: '#555',
  },
  otherTimeText: {
    color: '#777',
  },
  dateText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  mineDateText: {
    color: '#777',
  },
  otherDateText: {
    color: '#999',
  },
});

export default EnhancedTimestamp;