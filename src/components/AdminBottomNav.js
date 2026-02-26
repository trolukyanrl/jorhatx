import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const AdminBottomNav = ({ activeTab = 'main' }) => {
  const navigation = useNavigation();

  const switchTab = (tab, routeName) => {
    if (activeTab === tab) return;
    navigation.replace(routeName);
  };

  return (
    <View style={styles.bottomBar}>
      <Button
        mode={activeTab === 'home' ? 'contained' : 'text'}
        icon="home-city-outline"
        onPress={() => switchTab('home', 'AdminHome')}
        style={styles.navButton}
        labelStyle={styles.navLabel}
        buttonColor={activeTab === 'home' ? '#6200ea' : undefined}
      >
        Home
      </Button>
      <Button
        mode={activeTab === 'main' ? 'contained' : 'text'}
        icon="home"
        onPress={() => switchTab('main', 'AdminDashboard')}
        style={styles.navButton}
        labelStyle={styles.navLabel}
        buttonColor={activeTab === 'main' ? '#6200ea' : undefined}
      >
        Main
      </Button>
      <Button
        mode={activeTab === 'chat' ? 'contained' : 'text'}
        icon="chat-outline"
        onPress={() => switchTab('chat', 'AdminChat')}
        style={styles.navButton}
        labelStyle={styles.navLabel}
        buttonColor={activeTab === 'chat' ? '#6200ea' : undefined}
      >
        Chat
      </Button>
      <Button
        mode={activeTab === 'profile' ? 'contained' : 'text'}
        icon="account-outline"
        onPress={() => switchTab('profile', 'AdminProfile')}
        style={styles.navButton}
        labelStyle={styles.navLabel}
        buttonColor={activeTab === 'profile' ? '#6200ea' : undefined}
      >
        Profile
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 6,
  },
  navLabel: {
    fontSize: 12,
  },
});

export default AdminBottomNav;
