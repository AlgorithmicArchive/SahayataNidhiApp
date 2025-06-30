// App.tsx
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { AppProvider } from './contexts/AppContext';
import AppNavigator from './navigations/AppNavigator';
import Header from './components/common/Header';
import Toast from 'react-native-toast-message';

<Toast position="top" visibilityTime={3000} autoHide topOffset={50} />;

export default function App() {
  return (
    <AppProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Header />
          </View>
          <View style={styles.navigator}>
            <AppNavigator />
          </View>
        </View>
      </SafeAreaView>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    height: 60, // or whatever fixed height you want
  },
  navigator: {
    flex: 1, // fills remaining space between Header and Bottom Tabs
  },
});
