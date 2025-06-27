import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { Validate } from '../../../services/api';
import { AppContext } from '../../../contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Verification() {
  const [selectedOption, setSelectedOption] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();
  const { theme, setVerified, setUserType, setUsername, setProfile } =
    useContext(AppContext);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async data => {
    // await AsyncStorage.clear();
    const formData = {
      [selectedOption === 'otp' ? 'otp' : 'backupCode']:
        data[selectedOption === 'otp' ? 'otp' : 'backupCode'],
    };
    try {
      const response = await Validate(formData);
      console.log('VERIFICATION', response);
      if (response.status) {
        setVerified(true);
        setUserType(response.userType);
        setProfile(response.profile);
        setUsername(response.username);
        const url =
          response.userType === 'Admin'
            ? 'AdminHome'
            : response.userType === 'Officer'
            ? 'OfficerHome'
            : response.userType === 'Designer'
            ? 'DesignerDashboard'
            : 'UserHome';
        navigation.navigate('Main', { screen: url });
      } else {
        setErrorMessage(response.message || 'Verification failed.');
      }
    } catch (error) {
      console.error('Verification error:', error.message);
      setErrorMessage('An error occurred during verification.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification</Text>

      {!selectedOption && (
        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setSelectedOption('otp')}
          >
            <Text style={styles.optionButtonText}>Use OTP Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              styles.outlinedButton,
              { backgroundColor: theme.main, color: theme.text.primary },
            ]}
            onPress={() => setSelectedOption('backup')}
          >
            <Text style={styles.optionButtonText}>Use Backup Codes</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedOption && (
        <View style={styles.formContainer}>
          <Controller
            control={control}
            name={selectedOption === 'otp' ? 'otp' : 'backupCode'}
            rules={{ required: 'This field is required.' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder={
                  selectedOption === 'otp'
                    ? 'Enter OTP sent to your email'
                    : 'Enter your backup code'
                }
                placeholderTextColor={theme.text.secondary}
                value={value}
                onChangeText={onChange}
                style={[
                  styles.input,
                  errors[selectedOption === 'otp' ? 'otp' : 'backupCode'] &&
                    styles.inputError,
                ]}
              />
            )}
          />

          {errors[selectedOption === 'otp' ? 'otp' : 'backupCode'] && (
            <Text style={styles.errorText}>
              {errors[selectedOption === 'otp' ? 'otp' : 'backupCode'].message}
            </Text>
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
          >
            <Text style={[styles.submitButtonText]}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}

      {errorMessage !== '' && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 24,
  },
  optionContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
  },
  outlinedButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  optionButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  formContainer: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 8,
  },
  inputError: {
    borderColor: 'red',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});
