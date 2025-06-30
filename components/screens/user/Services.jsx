import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ServerSideTable from '../../common/ServerSideTable';
import { API_URL } from '@env';

const InitatedApplications = () => {
  const navigation = useNavigation();

  const actionFunctions = {
    OpenForm: row => {
      const userdata = row;
      navigation.navigate('Status', {
        screen: 'Form',
        params: { serviceId: userdata.serviceId },
      });
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.tableContainer}>
        <ServerSideTable
          url="/User/GetServices"
          extraParams={{}}
          actionFunctions={actionFunctions}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableContainer: {
    width: '90%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    height: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1976d2',
    borderRadius: 5,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default InitatedApplications;
