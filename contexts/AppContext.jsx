import { createContext, useEffect, useState } from 'react';
import { themes } from '../styles/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const AppProvider = ({ children }) => {
  // Set default theme to 'GovSoftTheme' (or any key from themes object)
  const [theme, setTheme] = useState(themes.GovSoftTheme);

  const [userType, setUserType] = useState(null);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [profile, setProfile] = useState(null);
  const [verified, setVerified] = useState(false);
  const [designation, setDesignation] = useState(null);

  // Load initial state from AsyncStorage
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const savedUserType = await AsyncStorage.getItem('userType');
        if (savedUserType) setUserType(JSON.parse(savedUserType));

        const savedToken = await AsyncStorage.getItem('token');
        if (savedToken) setToken(savedToken);

        const savedUsername = await AsyncStorage.getItem('username');
        if (savedUsername) setUsername(JSON.parse(savedUsername));

        const savedProfile = await AsyncStorage.getItem('profile');
        if (savedProfile) setProfile(JSON.parse(savedProfile));

        const savedVerified = await AsyncStorage.getItem('verified');
        if (savedVerified) setVerified(JSON.parse(savedVerified));

        const savedDesignation = await AsyncStorage.getItem('designation');
        if (savedDesignation) setDesignation(JSON.parse(savedDesignation));
      } catch (error) {
        console.error('Failed to load AsyncStorage:', error);
      }
    };
    loadStoredData();
  }, []);

  // Persist state to AsyncStorage
  useEffect(() => {
    const saveData = async () => {
      try {
        if (userType) {
          await AsyncStorage.setItem('userType', JSON.stringify(userType));
        } else {
          await AsyncStorage.removeItem('userType');
        }
      } catch (error) {
        console.error('Failed to save userType:', error);
      }
    };
    saveData();
  }, [userType]);

  useEffect(() => {
    const saveData = async () => {
      try {
        if (token) {
          await AsyncStorage.setItem('token', token);
        } else {
          await AsyncStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Failed to save token:', error);
      }
    };
    saveData();
  }, [token]);

  useEffect(() => {
    const saveData = async () => {
      try {
        if (username) {
          await AsyncStorage.setItem('username', JSON.stringify(username));
        } else {
          await AsyncStorage.removeItem('username');
        }
      } catch (error) {
        console.error('Failed to save username:', error);
      }
    };
    saveData();
  }, [username]);

  useEffect(() => {
    const saveData = async () => {
      try {
        if (profile) {
          await AsyncStorage.setItem('profile', JSON.stringify(profile));
        } else {
          await AsyncStorage.removeItem('profile');
        }
      } catch (error) {
        console.error('Failed to save profile:', error);
      }
    };
    saveData();
  }, [profile]);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('verified', JSON.stringify(verified));
      } catch (error) {
        console.error('Failed to save verified:', error);
      }
    };
    saveData();
  }, [verified]);

  useEffect(() => {
    const saveData = async () => {
      try {
        if (designation) {
          await AsyncStorage.setItem(
            'designation',
            JSON.stringify(designation),
          );
        } else {
          await AsyncStorage.removeItem('designation');
        }
      } catch (error) {
        console.error('Failed to save designation:', error);
      }
    };
    saveData();
  }, [designation]);

  return (
    <AppContext.Provider
      value={{
        theme,
        userType,
        setUserType,
        token,
        setToken,
        username,
        setUsername,
        profile,
        setProfile,
        verified,
        setVerified,
        designation,
        setDesignation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export { AppContext, AppProvider };
