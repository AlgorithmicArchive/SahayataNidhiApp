import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useContext } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../components/screens/home/HomeScreen';
import LoginScreen from '../components/screens/home/LoginScreen';
import { AppContext } from '../contexts/AppContext';
import RegisterScreen from '../components/screens/home/RegisterScreen';

const Tab = createBottomTabNavigator();

const HomeTabs = () => {
  const { theme } = useContext(AppContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.main },
        tabBarIcon: ({ color, size }) => {
          let iconName = '';

          if (route.name === 'Home') {
            iconName = 'home-outline';
          } else if (route.name === 'Login') {
            iconName = 'log-in-outline';
          } else if (route.name === 'Register') {
            iconName = 'person-add-outline';
          }

          return <Ionicons name={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: theme.background.default,
        tabBarInactiveTintColor: theme.text.primary,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Login" component={LoginScreen} />
      <Tab.Screen name="Register" component={RegisterScreen} />
    </Tab.Navigator>
  );
};

export default HomeTabs;
