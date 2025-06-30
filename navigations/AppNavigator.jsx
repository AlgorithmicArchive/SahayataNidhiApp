import React, { useContext, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Verification from '../components/screens/home/Verification';
import { AppContext } from '../contexts/AppContext';
import HomeTabs from './HomeTabs';
import UserTabs from './UserTabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../services/navigationRef'; // adjust path as needed

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { userType, verified, setToken, setUserType, setVerified } =
    useContext(AppContext);
  console.log('Navigator - userType:', userType, 'verified:', verified);

  // Restore session from AsyncStorage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userType = await AsyncStorage.getItem('userType');
        const verified = await AsyncStorage.getItem('verified');
        if (token && userType) {
          setToken(token);
          setUserType(userType);
          setVerified(verified === 'true');
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      }
    };
    restoreSession();
  }, [setToken, setUserType, setVerified]);

  // Determine initial route based on userType and verified
  const initialRouteName = !userType
    ? 'HomeTabs'
    : !verified
    ? 'Verification'
    : 'Tabs';

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="HomeTabs" component={HomeTabs} />
        <Stack.Screen name="Verification" component={Verification} />
        <Stack.Screen name="Tabs" component={TabsNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Tabs navigator for different user types
const TabsNavigator = () => {
  const { userType } = useContext(AppContext);
  return <>{userType === 'Citizen' && <UserTabs />}</>;
};

export default AppNavigator;
