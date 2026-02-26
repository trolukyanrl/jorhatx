import React from 'react';
import { View, StyleSheet } from 'react-native';
import UserDashboard from '../user/UserDashboard';
import AdminBottomNav from '../../components/AdminBottomNav';

const AdminHomeScreen = () => {
  return (
    <View style={styles.container}>
      <UserDashboard showBottomNav={false} />
      <AdminBottomNav activeTab="home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AdminHomeScreen;
