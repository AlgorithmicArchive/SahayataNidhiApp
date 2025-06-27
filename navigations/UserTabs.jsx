import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import Services from '../components/screens/user/Services';
import Index from '../components/screens/user/Index';
import LogoutScreen from '../components/screens/LogoutScreen';
import DynamicModalDropdown from '../components/DynamicModalDropDown';

const Tab = createBottomTabNavigator();

// Create a separate component for Status to avoid inline function
const StatusScreenPlaceholder = () => <View />;

const UserTabs = () => {
  const { colors } = useTheme(); // Get colors from the theme
  const [modalVisible, setModalVisible] = useState(false);

  const navigationOptions = [
    { label: 'Track Application Status', screenName: 'ApplicationStatus' },
    { label: 'Incomplete Application', screenName: 'IncompleteApplications' },
  ];

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: colors.primary }, // Set background color of tab bar
          tabBarActiveTintColor: colors.card, // Active tab icon color
          tabBarInactiveTintColor: colors.background, // Inactive tab icon color
          tabBarIcon: ({ color, size }) => {
            let iconName = '';

            // Dynamically set icon based on route name
            if (route.name === 'Home') {
              iconName = 'home-outline';
            } else if (route.name === 'Services') {
              iconName = 'list-outline';
            } else if (route.name === 'Logout') {
              iconName = 'log-out-outline';
            } else if (route.name === 'Status') {
              iconName = 'information-circle-outline';
            }

            return <Ionicons name={iconName} color={color} size={size} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={Index} />
        <Tab.Screen name="Services" component={Services} />
        {/* Use a separate component for Status screen */}
        <Tab.Screen
          name="Status"
          component={StatusScreenPlaceholder}
          options={{
            tabBarButton: props => {
              // Check if accessibilityState is defined and get the selected property safely
              const isSelected = props.accessibilityState?.selected || false;
              const iconColor = isSelected ? colors.card : colors.background;
              const textColor = isSelected ? colors.card : colors.background;

              return (
                <TouchableOpacity
                  {...props}
                  onPress={() => setModalVisible(true)} // Show the modal when the tab is pressed
                >
                  <View
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                    }}
                  >
                    {/* Use the determined color */}
                    <Ionicons
                      name="information-circle-outline"
                      color={iconColor}
                      size={25}
                    />
                    <Text style={{ color: textColor }}>Status</Text>
                  </View>
                </TouchableOpacity>
              );
            },
          }}
        />
        <Tab.Screen name="Logout" component={LogoutScreen} />
      </Tab.Navigator>

      {/* Modal for Status Tab */}
      <DynamicModalDropdown
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        screens={navigationOptions} // Pass the list of objects with labels and screen names
      />
    </>
  );
};

export default UserTabs;
