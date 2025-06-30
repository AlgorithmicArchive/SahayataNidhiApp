import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Services from '../components/screens/user/Services';
import Index from '../components/screens/user/Index';
import LogoutScreen from '../components/screens/LogoutScreen';
import InitiatedApplications from '../components/screens/user/InitiatedApplications';
import IncompleteApplications from '../components/screens/user/IncompleteApplications';
import DynamicModalDropdown from '../components/common/DynamicModalDropDown';
import { AppContext } from '../contexts/AppContext';
import Form from '../components/screens/user/Form';
import Acknowledgement from '../components/screens/user/Acknowledgement';

const Tab = createBottomTabNavigator();
const StatusStack = createNativeStackNavigator();

// 👇 Stack for Status-related screens (to keep tabs visible)
const StatusNavigator = () => (
  <StatusStack.Navigator screenOptions={{ headerShown: false }}>
    <StatusStack.Screen name="StatusHome" component={StatusScreenPlaceholder} />
    <StatusStack.Screen
      name="InitiatedApplications"
      component={InitiatedApplications}
    />
    <StatusStack.Screen
      name="IncompleteApplications"
      component={IncompleteApplications}
    />
    <StatusStack.Screen name="Form" component={Form} />
    <StatusStack.Screen name="Acknowledgement" component={Acknowledgement} />
  </StatusStack.Navigator>
);

const StatusScreenPlaceholder = () => <View />;

const Tabs = ({ theme, setModalVisible }) => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor: theme.main },
      tabBarActiveTintColor: theme.background.default,
      tabBarInactiveTintColor: theme.text.primary,
      tabBarIcon: ({ color, size }) => {
        let iconName = '';
        if (route.name === 'Home') iconName = 'home-outline';
        else if (route.name === 'Services') iconName = 'list-outline';
        else if (route.name === 'Logout') iconName = 'log-out-outline';
        else if (route.name === 'Status')
          iconName = 'information-circle-outline';
        return <Ionicons name={iconName} color={color} size={size} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={Index} />
    <Tab.Screen name="Services" component={Services} />
    <Tab.Screen
      name="Status"
      component={StatusNavigator}
      options={{
        tabBarButton: props => {
          const isSelected = props.accessibilityState?.selected || false;
          const iconColor = isSelected
            ? theme.background.default
            : theme.text.primary;
          const textColor = isSelected
            ? theme.background.default
            : theme.text.primary;

          return (
            <TouchableOpacity {...props} onPress={() => setModalVisible(true)}>
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
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
);

const UserTabs = () => {
  const { theme } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);

  const navigationOptions = [
    {
      label: 'Initiated Applications',
      screenName: 'InitiatedApplications',
    },
    {
      label: 'Incomplete Application',
      screenName: 'IncompleteApplications',
    },
  ];

  return (
    <>
      <Tabs theme={theme} setModalVisible={setModalVisible} />

      <DynamicModalDropdown
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        screens={navigationOptions}
        parent="Status"
      />
    </>
  );
};

export default UserTabs;
