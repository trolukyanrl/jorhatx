import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, Button } from 'react-native-paper';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import UserDashboard from '../screens/user/UserDashboard';
import AdminDashboard from '../screens/admin/AdminDashboard';
import { authService } from '../services/auth';
import { AuthContext } from '../context/AuthContext';

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
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <PaperProvider>
      <AuthContext.Provider value={{ handleLoginSuccess, handleLogout }}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: '#6200ea',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
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
                  <Stack.Screen 
                    name="AdminDashboard" 
                    component={AdminDashboard}
                    options={{ 
                      title: 'Admin Dashboard',
                      headerRight: () => (
                        <Button 
                          mode="text" 
                          onPress={handleLogout}
                          labelStyle={{ color: '#fff' }}
                        >
                          Logout
                        </Button>
                      )
                    }}
                  />
                ) : (
                  <Stack.Screen 
                    name="UserDashboard" 
                    component={UserDashboard}
                    options={{ 
                      title: 'User Dashboard',
                      headerRight: () => (
                        <Button 
                          mode="text" 
                          onPress={handleLogout}
                          labelStyle={{ color: '#fff' }}
                        >
                          Logout
                        </Button>
                      )
                    }}
                  />
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
