import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { useNavigation } from '@react-navigation/native';

export default function LogoutScreen() {
  const { theme, setUserType, setVerified } = useContext(AppContext);
  const navigation = useNavigation();

  const handleLogout = () => {
    setUserType(null);
    setVerified(null);
    navigation.navigate('HomeTabs', { screen: 'Home' });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background.paper }]}
    >
      <View style={styles.content}>
        <Text style={[styles.message, { color: theme.text.primary }]}>
          Are you sure you want to logout?
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.main }]}
            onPress={handleLogout}
          >
            <Text
              style={[styles.buttonText, { color: theme.background.default }]}
            >
              Logout
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, { color: theme.text.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  message: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
