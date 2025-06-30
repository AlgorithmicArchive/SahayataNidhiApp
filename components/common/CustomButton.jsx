import { useTheme } from '@react-navigation/native';
import React, { useContext } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { AppContext } from '../../contexts/AppContext';

const CutomButton = ({ name, onPress }) => {
  const { theme } = useContext(AppContext);
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: theme.main }]}
      onPress={onPress ? onPress : () => {}} // Do nothing if no onPress is provided
    >
      <Text style={[styles.buttonText, { color: theme.background.default }]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CutomButton;
