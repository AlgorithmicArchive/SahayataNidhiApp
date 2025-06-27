import { Text, View } from 'react-native';
import { AppProvider } from './contexts/AppContext';
import { NavigationContainer } from '@react-navigation/native';
import Header from './components/common/Header';
import AppNavigator from './navigations/AppNavigator';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function App() {
  useEffect(() => {
    const resetLocalStorage = async () => {
      await AsyncStorage.clear();
    };
    resetLocalStorage();
  }, []);
  return (
    <AppProvider>
      <View style={{ flex: 1 }}>
        <Header />
        <View style={{ flex: 1 }}>
          <AppNavigator />
        </View>
      </View>
    </AppProvider>
  );
}

export default App;
