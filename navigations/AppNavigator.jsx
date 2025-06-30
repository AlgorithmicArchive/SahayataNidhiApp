import React, { useContext, useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Verification from '../components/screens/home/Verification';
import { AppContext } from '../contexts/AppContext';
import HomeTabs from './HomeTabs';
import UserTabs from './UserTabs';
import OfficerTabs from './OfficerTabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../services/navigationRef'; // adjust path

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { userType, verified, setToken, setUserType, setVerified } =
    useContext(AppContext);
  const [isAppReady, setIsAppReady] = useState(false);

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
      } finally {
        setIsAppReady(true); // Only render navigator after restoring session
      }
    };
    restoreSession();
  }, []);

  if (!isAppReady) return null; // or show a splash/loading screen

  // Dynamic routing AFTER session restoration
  let initialRouteName;
  if (!userType) {
    initialRouteName = 'HomeTabs';
  } else if (!verified) {
    initialRouteName = 'Verification';
  } else {
    initialRouteName = 'Tabs';
  }

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

// Tabs navigator
const TabsNavigator = () => {
  const { userType } = useContext(AppContext);
  console.log('Rendering TabsNavigator for userType:', userType);
  if (userType === 'Officer') return <OfficerTabs />;
  if (userType === 'Citizen') return <UserTabs />;
  return <HomeTabs />;
};

export default AppNavigator;
