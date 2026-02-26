import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authService } from '../../services/auth';
import { AuthContext } from '../../context/AuthContext';

const otpSchema = yup.object().shape({
  otp: yup
    .string()
    .min(6, 'OTP must be at least 6 characters')
    .required('OTP is required'),
});

const VerifyOtpScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { handleLoginSuccess } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const userId = route.params?.userId;
  const email = route.params?.email;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onSubmit = async (data) => {
    if (!userId) {
      Alert.alert('Missing Data', 'Registration session expired. Please register again.');
      navigation.replace('Register');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyEmailOtp(userId, data.otp);
      if (result.success) {
        const userRole = await authService.getUserRole();
        handleLoginSuccess(userRole);
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userId || !email) {
      Alert.alert('Missing Data', 'Cannot resend OTP. Please register again.');
      navigation.replace('Register');
      return;
    }

    setResending(true);
    try {
      const result = await authService.resendEmailOtp(userId, email);
      if (result.success) {
        Alert.alert('OTP Sent', 'A new OTP has been sent to your email.');
      } else {
        Alert.alert('Resend Failed', result.error || 'Could not resend OTP. Try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setResending(false);
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
              <Text variant="displaySmall" style={styles.title}>
                Verify OTP
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Enter the OTP sent to {email || 'your email'}
              </Text>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="otp"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Email OTP"
                    mode="outlined"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={!!errors.otp}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                )}
              />
              {errors.otp && (
                <Text style={styles.errorText}>{errors.otp.message}</Text>
              )}

              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
                style={styles.verifyButton}
                labelStyle={styles.buttonLabel}
              >
                Verify OTP
              </Button>

              <Button
                mode="text"
                onPress={handleResendOtp}
                loading={resending}
                disabled={resending}
                style={styles.resendButton}
              >
                Resend OTP
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.replace('Login')}
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
    marginBottom: 24,
  },
  title: {
    color: '#6200ea',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#b00020',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  verifyButton: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#6200ea',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 6,
  },
});

export default VerifyOtpScreen;

