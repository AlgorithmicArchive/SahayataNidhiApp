import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../../../contexts/AppContext';
import { API_URL } from '@env';
import axiosInstance from '../../../services/axiosconfig';

export default function Index() {
  const { theme } = useContext(AppContext);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ file: '', url: '' });

  const getUserDetails = async () => {
    try {
      const response = await axiosInstance.get(
        `${API_URL}/User/GetUserDetails`,
      );
      const data = response.data;
      console.log('DATA', data);
      setUserDetails(data);
      setProfile({ file: '', url: data.profile || '' });
    } catch (error) {
      console.error('Error fetching user details:', error);
      Alert.alert('Error', 'Failed to load user details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSanctionDetails = async () => {
    try {
      const formData = new FormData();
      formData.append('applicationId', 'JK-PN-JMU/2025-2026/2');
      formData.append('serviceId', '1');
      const response = await fetch('/User/GetSanctionDetails', {
        method: 'GET',
        body: formData,
      });
      const data = await response.json();
      console.log('Sanction Details:', data);
    } catch (error) {
      console.error('Error fetching sanction details:', error);
      Alert.alert('Error', 'Failed to load sanction details.');
    }
  };

  useEffect(() => {
    getUserDetails();
    getSanctionDetails();
  }, []);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background.paper },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.main}
          accessibilityLabel="Loading user profile"
        />
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background.default }}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.innerContainer}>
        {/* Profile Section */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: theme.background.default },
          ]}
        >
          <Image
            source={{
              uri: API_URL + profile.url || 'https://via.placeholder.com/120',
            }}
            style={[styles.avatar, { borderColor: theme.main }]}
            accessibilityLabel={`${
              userDetails?.name || 'User'
            }'s profile picture`}
          />
          <Text style={[styles.name, { color: theme.main }]}>
            {userDetails?.name || 'User Name'}
          </Text>
          <TouchableOpacity
            style={[styles.editButton, { borderColor: theme.main }]}
            onPress={() =>
              Alert.alert('Info', 'Edit profile functionality coming soon!')
            }
            accessibilityLabel="Edit profile"
          >
            <Text style={[styles.editButtonText, { color: theme.main }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View
          style={[
            styles.detailsCard,
            { backgroundColor: theme.background.paper },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.main }]}>
            User Profile
          </Text>
          {[
            { label: 'Username', value: userDetails?.username },
            { label: 'Email', value: userDetails?.email },
            { label: 'Mobile Number', value: userDetails?.mobileNumber },
            { label: 'Initiated Applications', value: userDetails?.initiated },
            {
              label: 'Incomplete Applications',
              value: userDetails?.incomplete,
            },
            {
              label: 'Sanctioned Applications',
              value: userDetails?.sanctioned,
            },
          ].map((item, index) => (
            <View
              key={index}
              style={styles.detailRow}
              accessibilityLabel={`${item.label}: ${item.value || 'N/A'}`}
            >
              <Text
                style={[styles.detailLabel, { color: theme.text.secondary }]}
              >
                {item.label}
              </Text>
              <Text style={[styles.detailValue, { color: theme.text.primary }]}>
                {item.value || 'N/A'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    maxWidth: 900,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  profileCard: {
    minWidth: 300,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    marginBottom: 16,
    backgroundColor: '#E0E0E0',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay-Regular',
    textAlign: 'center',
    marginBottom: 12,
  },
  editButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsCard: {
    flex: 1,
    minWidth: 300,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    width: '50%',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '400',
    width: '50%',
    textAlign: 'right',
  },
});
