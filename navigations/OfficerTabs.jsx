import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { AppContext } from '../contexts/AppContext';
import OfficerHome from '../components/screens/officer/OfficerHome';
import Reports from '../components/screens/officer/Reports';
import RegisterDSC from '../components/screens/officer/RegisterDSC';
import BankFile from '../components/screens/officer/BankFile';
import ResponseFile from '../components/screens/officer/ResponseFile';
import LogoutScreen from '../components/screens/LogoutScreen';
import UserDetails from '../components/screens/officer/UserDetails';
import ViewUserDetails from '../components/screens/officer/ViewUserDetails';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const SubStack = createNativeStackNavigator();

const BankFileStack = () => (
  <SubStack.Navigator screenOptions={{ headerShown: false }}>
    <SubStack.Screen name="BankFile" component={BankFile} />
    <SubStack.Screen name="ResponseFile" component={ResponseFile} />
  </SubStack.Navigator>
);

const DSCStack = () => (
  <SubStack.Navigator screenOptions={{ headerShown: false }}>
    <SubStack.Screen name="RegisterDSC" component={RegisterDSC} />
  </SubStack.Navigator>
);

const OfficerTabs = () => {
  const { userType, verified, theme, designation } = useContext(AppContext);

  if (userType !== 'Officer' || !verified) return <Text>Unauthorized</Text>;

  const isDirector = designation?.toLowerCase().includes('director');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.main },
        tabBarActiveTintColor: theme.background.default,
        tabBarInactiveTintColor: theme.text.primary,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home-outline';
          if (route.name === 'Reports') iconName = 'document-text-outline';
          else if (route.name === 'BankFile') iconName = 'cash-outline';
          else if (route.name === 'DSC') iconName = 'key-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={OfficerHome} />
      <Tab.Screen name="Reports" component={Reports} />
      {isDirector && (
        <Tab.Screen
          name="BankFile"
          component={BankFileStack}
          options={{ title: 'Manage Bank File' }}
        />
      )}
      <Tab.Screen
        name="DSC"
        component={DSCStack}
        options={{ title: 'DSC Management' }}
      />
      <Tab.Screen name="Logout" component={LogoutScreen} />
    </Tab.Navigator>
  );
};

// Root navigator with additional screens not in the tab bar
const OfficerNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={OfficerTabs} />
    <RootStack.Screen name="UserDetails" component={UserDetails} />
    <RootStack.Screen name="ViewUserDetails" component={ViewUserDetails} />
  </RootStack.Navigator>
);

export default OfficerNavigator;
