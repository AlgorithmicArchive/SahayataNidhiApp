import React, { useContext, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Verification from '../components/screens/home/Verification';
import { AppContext } from '../contexts/AppContext';
import { NavigationContainer } from '@react-navigation/native';
import HomeTabs from './HomeTabs';
import UserTabs from './UserTabs';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { userType, verified } = useContext(AppContext);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!userType ? (
          // HomeTabs before login
          <Stack.Screen name="HomeTabs" component={HomeTabs} />
        ) : !verified ? (
          // Verification after login but before verification
          <Stack.Screen name="Verification" component={Verification} />
        ) : (
          // UserTabs or OfficerTabs after verification
          <Stack.Screen name="Tabs">
            {() => (userType === 'Citizen' ? <UserTabs /> : <UserTabs />)}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
