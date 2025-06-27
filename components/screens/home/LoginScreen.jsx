import React, { useState, useContext } from 'react';
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
import { Login } from '../../../services/api';

const schema = yup.object().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().min(6).required('Password is required'),
});

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const {
    setUserType,
    setToken,
    setProfile,
    setUsername,
    setVerified,
    setDesignation,
  } = useContext(AppContext);

  const { theme } = useContext(AppContext);

  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const onSubmit = async data => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('password', data.password);
      const response = await Login(formData);

      if (response.status) {
        console.log('IN LOGIN FORM Response', formData);

        setToken(response.token);
        setUserType(response.userType);
        setProfile(response.profile);
        setUsername(response.username[0]);
        setDesignation(response.designation);
        navigation.navigate('Verification'); // ✅ String
      } else if (response.isEmailVerified === false) {
        setEmail(response.email);
        setUsername(response.username);
        setOtpVisible(true);
      } else {
        Alert(response.response || 'Invalid credentials.');
      }
    } catch (e) {
      Alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      Alert('OTP must be 6 digits');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp', otp);
      const res = await fetch('/Home/VerifyEmailOtp', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.status) {
        Alert('Email verified. Please login again.');
        setOtpVisible(false);
      } else {
        Alert(result.message || 'OTP verification failed');
      }
    } catch (e) {
      Alert('Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.main }]}>Welcome Back</Text>
      <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
        Sign in to continue
      </Text>

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

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.main }]}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={[styles.buttonText, { color: theme.background.default }]}
          >
            Log In
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={[styles.link, { color: theme.text.secondary }]}>
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>

      <Modal visible={otpVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Enter the 6-digit OTP sent to {email}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
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
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 6,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: 'red',
    alignSelf: 'flex-start',
  },
  link: {
    marginTop: 10,
    color: '#1976d2',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
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
