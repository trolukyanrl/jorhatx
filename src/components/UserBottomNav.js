import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const UserBottomNav = ({ activeTab = 'home' }) => {
  const navigation = useNavigation();

  const tabMode = (tabName) => (activeTab === tabName ? 'contained' : 'text');
  const switchTab = (tabName, routeName) => {
    if (activeTab === tabName) return;
    navigation.replace(routeName);
  };

  return (
    <View style={styles.bottomFooter}>
      <Button
        mode={tabMode('home')}
        icon="home"
        onPress={() => switchTab('home', 'UserDashboard')}
        style={styles.footerButton}
        labelStyle={styles.footerButtonLabel}
        buttonColor={activeTab === 'home' ? '#6200ea' : undefined}
      >
        Home
      </Button>
      <Button
        mode={tabMode('chat')}
        icon="chat-outline"
        onPress={() => switchTab('chat', 'Chat')}
        style={styles.footerButton}
        labelStyle={styles.footerButtonLabel}
        buttonColor={activeTab === 'chat' ? '#6200ea' : undefined}
      >
        Chat
      </Button>
      <Button
        mode={tabMode('sell')}
        icon="plus-circle"
        onPress={() => switchTab('sell', 'CreateListing')}
        style={styles.footerSellButton}
        labelStyle={styles.footerSellLabel}
        buttonColor={activeTab === 'sell' ? '#6200ea' : undefined}
      >
        Sell
      </Button>
      <Button
        mode={tabMode('profile')}
        icon="account-outline"
        onPress={() => switchTab('profile', 'Profile')}
        style={styles.footerButton}
        labelStyle={styles.footerButtonLabel}
        buttonColor={activeTab === 'profile' ? '#6200ea' : undefined}
      >
        Profile
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  footerButtonLabel: {
    fontSize: 11,
  },
  footerSellButton: {
    flex: 1,
    marginHorizontal: 6,
  },
  footerSellLabel: {
    fontSize: 11,
  },
});

export default UserBottomNav;
