import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { AppContext } from '../../contexts/AppContext';

const Header = () => {
  const { theme } = useContext(AppContext);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: theme.main,
      elevation: 4,
    },
    logo: {
      width: 48,
      height: 48,
      marginRight: 10,
      resizeMode: 'contain',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text.primary,
    },
  });

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Sahayata Nidhi</Text>
    </View>
  );
};

export default Header;
