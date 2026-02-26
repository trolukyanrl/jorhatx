import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { authService } from '../../services/auth';
import { useNavigation } from '@react-navigation/native';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleSendOtp = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.forgotPassword(email.trim());
      if (result.success) {
        setUserId(result.userId);
        setOtpSent(true);
        Alert.alert('OTP Sent', 'Check your email and enter the recovery secret/OTP to reset password.');
      } else {
        Alert.alert('Error', result.error || 'Could not send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim()) {
      Alert.alert('Missing OTP', 'Please enter the OTP sent to your email.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirm password must match.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPasswordWithOtp(
        userId,
        otp.trim(),
        newPassword
      );

      if (result.success) {
        Alert.alert('Password Updated', 'Your password has been reset successfully.', [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login'),
          },
        ]);
      } else {
        Alert.alert('Reset Failed', result.error || 'Could not reset password. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const result = await authService.resendForgotPasswordOtp(userId, email.trim());
      if (result.success) {
        Alert.alert('OTP Sent', 'A new OTP has been sent to your email.');
      } else {
        Alert.alert('Error', result.error || 'Could not resend OTP.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const keyboardBehavior = Platform.select({
    ios: 'padding',
    android: 'height',
    default: undefined,
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardBehavior}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="displayMedium" style={styles.title}>
                Forgot Password
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {otpSent ? 'Enter OTP and set a new password' : 'Reset your password'}
              </Text>
            </View>

            <View style={styles.form}>
              <TextInput
                label="Email"
                mode="outlined"
                onChangeText={setEmail}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                editable={!otpSent}
              />

              {!otpSent ? (
                <Button
                  mode="contained"
                  onPress={handleSendOtp}
                  loading={loading}
                  disabled={loading}
                  style={styles.actionButton}
                  labelStyle={styles.buttonLabel}
                >
                  Send OTP
                </Button>
              ) : (
                <>
                  <TextInput
                    label="OTP / Recovery Secret"
                    mode="outlined"
                    onChangeText={setOtp}
                    value={otp}
                    style={styles.input}
                  />

                  <TextInput
                    label="New Password"
                    mode="outlined"
                    onChangeText={setNewPassword}
                    value={newPassword}
                    secureTextEntry
                    style={styles.input}
                  />

                  <TextInput
                    label="Confirm New Password"
                    mode="outlined"
                    onChangeText={setConfirmPassword}
                    value={confirmPassword}
                    secureTextEntry
                    style={styles.input}
                  />

                  <Button
                    mode="contained"
                    onPress={handleResetPassword}
                    loading={loading}
                    disabled={loading}
                    style={styles.actionButton}
                    labelStyle={styles.buttonLabel}
                  >
                    Reset Password
                  </Button>

                  <Button
                    mode="text"
                    onPress={handleResendOtp}
                    disabled={loading}
                  >
                    Resend OTP
                  </Button>
                </>
              )}

              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                style={styles.backButton}
                labelStyle={styles.backButtonLabel}
              >
                Back to Login
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200ea',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  actionButton: {
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#6200ea',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 8,
  },
  backButtonLabel: {
    color: '#6200ea',
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;
