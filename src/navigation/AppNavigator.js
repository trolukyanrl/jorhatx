import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import UserDashboard from '../screens/user/UserDashboard';
import ChatScreen from '../screens/user/ChatScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import UserCreateListingScreen from '../screens/user/UserCreateListingScreen';
import WishlistScreen from '../screens/user/WishlistScreen';
import UserPostDetailScreen from '../screens/user/UserPostDetailScreen';
import MyPostsScreen from '../screens/user/MyPostsScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import CategoryManagementScreen from '../screens/admin/CategoryManagementScreen';
import AdminCreateListingScreen from '../screens/admin/AdminCreateListingScreen';
import AdminListedItemsScreen from '../screens/admin/AdminListedItemsScreen';
import AdminListedItemDetailScreen from '../screens/admin/AdminListedItemDetailScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminChatScreen from '../screens/admin/AdminChatScreen';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import ChatConversationScreen from '../screens/common/ChatConversationScreen';
import { authService } from '../services/auth';
import { AuthContext } from '../context/AuthContext';
import { paperTheme, navigationTheme } from '../theme';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      if (authenticated) {
        const role = await authService.getUserRole();
        setIsAuthenticated(true);
        setUserRole(role);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (role) => {
    setIsAuthenticated(true);
    setUserRole(role || 'user');
  };

  const handleLogout = async () => {
    const result = await authService.logout();
    if (result.success) {
      setIsAuthenticated(false);
      setUserRole(null);
    }
    return result;
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <PaperProvider theme={paperTheme}>
      <AuthContext.Provider value={{ handleLoginSuccess, handleLogout }}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: '#6200ea',
                height: 40,
              },
              headerTintColor: '#fff',
              headerTitle: '',
              headerLeft: () => null,
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
            }}
          >
            {!isAuthenticated ? (
              <>
                <Stack.Screen 
                  name="Login" 
                  component={LoginScreen}
                  options={{ 
                    title: 'JorhatX - Login',
                    headerShown: false // Hide header for login screen
                  }}
                />
                <Stack.Screen 
                  name="Register" 
                  component={RegisterScreen} 
                  options={{ title: 'JorhatX - Register' }}
                />
                <Stack.Screen 
                  name="ForgotPassword" 
                  component={ForgotPasswordScreen} 
                  options={{ title: 'Forgot Password' }}
                />
                <Stack.Screen 
                  name="VerifyOtp" 
                  component={VerifyOtpScreen} 
                  options={{ title: 'Verify OTP' }}
                />
              </>
            ) : (
              <>
                {userRole === 'admin' ? (
                  <>
                    <Stack.Screen 
                      name="AdminHome" 
                      component={AdminHomeScreen}
                      options={{}}
                    />
                    <Stack.Screen 
                      name="AdminDashboard" 
                      component={AdminDashboard}
                      options={{}}
                    />
                    <Stack.Screen
                      name="UserManagement"
                      component={UserManagementScreen}
                      options={{}}
                    />
                    <Stack.Screen
                      name="CategoryManagement"
                      component={CategoryManagementScreen}
                      options={{}}
                    />
                    <Stack.Screen
                      name="AdminCreateListing"
                      component={AdminCreateListingScreen}
                      options={{}}
                    />
                    <Stack.Screen
                      name="AdminListedItems"
                      component={AdminListedItemsScreen}
                      options={{}}
                    />
                    <Stack.Screen
                      name="AdminListedItemDetail"
                      component={AdminListedItemDetailScreen}
                      options={{}}
                    />
                    <Stack.Screen
                      name="AdminProfile"
                      component={AdminProfileScreen}
                      options={{}}
                    />
                    <Stack.Screen
                      name="AdminChat"
                      component={AdminChatScreen}
                      options={{
                        headerTitle: 'Admin Chat',
                      }}
                    />
                    <Stack.Screen
                      name="ChatConversation"
                      component={ChatConversationScreen}
                      options={({ navigation, route }) => ({
                        animationEnabled: false,
                        headerTitle: route.params?.otherUserName || 'Conversation',
                      })}
                    />
                    <Stack.Screen
                      name="Wishlist"
                      component={WishlistScreen}
                      options={{
                        animationEnabled: false,
                      }}
                    />
                    <Stack.Screen
                      name="UserPostDetail"
                      component={UserPostDetailScreen}
                      options={{
                        animationEnabled: false,
                        headerLeft: () => null,
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Stack.Screen 
                      name="UserDashboard" 
                      component={UserDashboard}
                      options={{ 
                        animationEnabled: false,
                        headerStyle: {
                          backgroundColor: '#6200ea',
                          height: 40,
                        },
                        headerTitleStyle: {
                          fontWeight: 'bold',
                          fontSize: 18,
                        },
                      }}
                    />
                    <Stack.Screen 
                      name="Chat" 
                      component={ChatScreen}
                      options={{ 
                        animationEnabled: false,
                        headerTitle: 'Chats',
                      }}
                    />
                    <Stack.Screen
                      name="ChatConversation"
                      component={ChatConversationScreen}
                      options={({ navigation, route }) => ({
                        animationEnabled: false,
                        headerTitle: route.params?.otherUserName || 'Conversation',
                      })}
                    />
                    <Stack.Screen 
                      name="Profile" 
                      component={ProfileScreen}
                      options={{ 
                        animationEnabled: false,
                      }}
                    />
                    <Stack.Screen 
                      name="CreateListing" 
                      component={UserCreateListingScreen}
                      options={{ 
                        animationEnabled: false,
                      }}
                    />
                    <Stack.Screen 
                      name="Wishlist" 
                      component={WishlistScreen}
                      options={{ 
                        animationEnabled: false,
                      }}
                    />
                    <Stack.Screen 
                      name="UserPostDetail" 
                      component={UserPostDetailScreen}
                      options={{ 
                        animationEnabled: false,
                        headerLeft: () => null,
                      }}
                    />
                    <Stack.Screen 
                      name="MyPosts" 
                      component={MyPostsScreen}
                      options={{ 
                        animationEnabled: false,
                      }}
                    />
                  </>
                )}
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AuthContext.Provider>
    </PaperProvider>
  );
};

export default AppNavigator;
