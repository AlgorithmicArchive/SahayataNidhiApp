import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import CutomButton from './CustomButton';

// Create the DynamicModalDropdown component
const DynamicModalDropdown = ({
  visible,
  onClose,
  screens,
  title = 'Navigate to',
}) => {
  const navigation = useNavigation();
  const slideAnim = useRef(
    new Animated.Value(-Dimensions.get('window').height),
  ).current; // Initial position off-screen
  const { colors } = useTheme();
  // Handle navigation and close modal
  const handleOptionPress = screenName => {
    onClose(); // Close the modal first
    navigation.navigate(screenName); // Then navigate to the selected screen
  };

  // Slide the modal in and out based on `visible` prop
  useEffect(() => {
    if (visible) {
      // Slide in from top
      Animated.timing(slideAnim, {
        toValue: 0, // Move to the top of the screen
        duration: 300, // Animation duration
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out of the screen
      Animated.timing(slideAnim, {
        toValue: -Dimensions.get('window').height, // Move back off-screen
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      animationType="none" // Disable default animation
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalView,
            {
              transform: [{ translateY: slideAnim }],
              backgroundColor: colors.background,
            },
          ]}
        >
          {/* Optional Title */}
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {title}
          </Text>

          {/* Render List of Buttons Dynamically from `screens` Array */}
          <FlatList
            data={screens}
            keyExtractor={item => item.screenName} // Use screenName as the key
            renderItem={({ item }) => (
              // Wrap the Button component in a full-width container
              <View style={styles.listItemContainer}>
                <CutomButton
                  key={item.label}
                  name={item.label}
                  onPress={() => handleOptionPress(item.screenName)}
                />
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />} // Separator between items
          />

          {/* Close Modal Button */}
          <CutomButton name="Close" onPress={onClose} />
        </Animated.View>
      </View>
    </Modal>
  );
};

// Styles for the DynamicModalDropdown component
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start', // Align modal to start from the top
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalView: {
    width: '100%', // Take full width of the screen
    height: '100%', // Take full height of the screen
    paddingTop: 40, // Padding from top for modal content
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  listItemContainer: {
    width: Dimensions.get('window').width, // Full width of the screen
    paddingHorizontal: 20, // Padding on the left and right sides
  },
  listButton: {
    width: '100%', // Make button take full width of the container
    backgroundColor: '#4287f5', // Example button background color
    paddingVertical: 10, // Vertical padding for button
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 10, // Height of the separator to create a gap between items
  },
  closeButton: {
    width: '90%', // Make the Close button slightly narrower
    marginTop: 20, // Margin from top of the list
    backgroundColor: '#FF6347', // Different color for Close button
    paddingVertical: 12, // Vertical padding for button
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DynamicModalDropdown;
