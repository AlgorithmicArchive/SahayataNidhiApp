import React, { useState, useContext } from 'react';
import { API_URL } from '@env';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AppContext } from '../../../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

const schema = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  username: yup
    .string()
    .required('Username is required')
    .test('unique-username', 'Username already exists', async value => {
      if (!value) return false;
      try {
        const res = await fetch(
          `${API_URL}/Home/CheckUsername?username=${value}`,
        );
        const result = await res.json();
        return result.isUnique;
      } catch (error) {
        console.error('Username validation error:', error);
        return false;
      }
    }),
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format')
    .test('unique-email', 'Email already exists', async value => {
      if (!value) return false;
      try {
        const res = await fetch(`${API_URL}/Home/CheckEmail?email=${value}`);
        const result = await res.json();
        return result.isUnique;
      } catch (error) {
        console.error('Email validation error:', error);
        return false;
      }
    }),
  mobileNumber: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Enter a valid 10-digit number')
    .test('unique-mobile', 'Mobile number already exists', async value => {
      if (!value) return false;
      try {
        const res = await fetch(
          `${API_URL}/Home/CheckMobileNumber?number=${value}`,
        );
        const result = await res.json();
        return result.isUnique;
      } catch (error) {
        console.error('Mobile number validation error:', error);
        return false;
      }
    }),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup
    .string()
    .required('Confirm password is required')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

export default function RegisterScreen() {
  const {
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const { theme } = useContext(AppContext);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(0);
  const [email, setEmail] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      reset(); // 👈 Reset form values
      setOtp(''); // 👈 Reset any additional states you want
      setOtpVisible(false);
      setUserId(0);
      setEmail('');
      return () => {}; // Optional cleanup
    }, []),
  );

  const onSubmit = async data => {
    if (data.password !== data.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('username', data.username);
    formData.append('email', data.email);
    formData.append('mobileNumber', data.mobileNumber);
    formData.append('password', data.password);

    try {
      const response = await fetch(`${API_URL}/Home/Register`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.status) {
        setUserId(result.userId);
        setEmail(data.email);
        setOtpVisible(true);
      } else {
        Alert.alert(
          'Error',
          result.message || 'Registration failed. Please try again.',
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'OTP must be 6 digits');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('otp', otp);
    formData.append('UserId', userId);

    try {
      const response = await fetch(`${API_URL}/Home/OTPValidation`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.status) {
        Alert.alert(
          'Success',
          'Registration successful! Redirecting to login...',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ],
        );
        setOtpVisible(false);
      } else {
        Alert.alert(
          'Error',
          result.message || 'Invalid OTP. Please try again.',
        );
      }
    } catch (error) {
      console.error('OTP validation error:', error);
      Alert.alert('Error', 'Error validating OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background.paper }]}
    >
      <Text style={[styles.title, { color: theme.main }]}>
        Create an Account
      </Text>
      <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
        Sign up to get started
      </Text>

      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              { color: theme.text.primary, borderColor: theme.main },
            ]}
            placeholder="Full Name"
            placeholderTextColor={theme.text.secondary}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.fullName && (
        <Text style={styles.error}>{errors.fullName.message}</Text>
      )}

      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              { color: theme.text.primary, borderColor: theme.main },
            ]}
            placeholder="Username"
            placeholderTextColor={theme.text.secondary}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.username && (
        <Text style={styles.error}>{errors.username.message}</Text>
      )}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              { color: theme.text.primary, borderColor: theme.main },
            ]}
            placeholder="Email"
            placeholderTextColor={theme.text.secondary}
            keyboardType="email-address"
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <Controller
        control={control}
        name="mobileNumber"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              { color: theme.text.primary, borderColor: theme.main },
            ]}
            placeholder="Mobile Number"
            placeholderTextColor={theme.text.secondary}
            keyboardType="phone-pad"
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.mobileNumber && (
        <Text style={styles.error}>{errors.mobileNumber.message}</Text>
      )}

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              { color: theme.text.primary, borderColor: theme.main },
            ]}
            placeholder="Password"
            placeholderTextColor={theme.text.secondary}
            secureTextEntry
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.password && (
        <Text style={styles.error}>{errors.password.message}</Text>
      )}

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              { color: theme.text.primary, borderColor: theme.main },
            ]}
            placeholder="Confirm Password"
            placeholderTextColor={theme.text.secondary}
            secureTextEntry
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.confirmPassword && (
        <Text style={styles.error}>{errors.confirmPassword.message}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.main }]}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.background.default} />
        ) : (
          <Text
            style={[styles.buttonText, { color: theme.background.default }]}
          >
            Register
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={[styles.link, { color: theme.text.secondary }]}>
          Already have an account? Sign In
        </Text>
      </TouchableOpacity>

      <Modal visible={otpVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.background.paper },
            ]}
          >
            <Text style={{ color: theme.text.primary }}>
              Enter the 6-digit OTP sent to {email}
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: theme.text.primary, borderColor: theme.main },
              ]}
              placeholder="Enter OTP"
              placeholderTextColor={theme.text.secondary}
              keyboardType="numeric"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Pressable onPress={() => setOtpVisible(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              <TouchableOpacity onPress={handleOtpVerify} disabled={loading}>
                <Text style={styles.verify}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  error: {
    color: 'red',
    alignSelf: 'flex-start',
  },
  link: {
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 10,
    padding: 20,
  },
  cancel: {
    color: 'red',
    marginTop: 15,
  },
  verify: {
    color: 'green',
    marginTop: 15,
  },
});
