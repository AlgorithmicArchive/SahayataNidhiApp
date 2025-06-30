import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../components/screens/home/HomeScreen';
import UserHomeScreen from '../components/screens/user/Index';
import { AppContext } from '../contexts/AppContext';
import LoginScreen from '../components/screens/home/LoginScreen';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  const { userType, verified, theme } = useContext(AppContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.main },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name == 'Login') {
            iconName = focused ? 'log-in' : 'log-in-outline';
          } else if (route.name === 'User') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {!verified && (
        <>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Login" component={LoginScreen} />
        </>
      )}
      {userType === 'Citizen' && verified && (
        <Tab.Screen name="UserHome" component={UserHomeScreen} />
      )}
    </Tab.Navigator>
  );
};

export default BottomTabs;
