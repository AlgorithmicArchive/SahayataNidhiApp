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
import RNFS from 'react-native-fs';
import ServerSideTable from '../../common/ServerSideTable';
import { API_URL } from '@env';

const InitatedApplications = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [table, setTable] = useState(null);
  const navigation = useNavigation();

  const handleOpen = () => setModalVisible(true);
  const handleClose = () => setModalVisible(false);

  const actionFunctions = {
    CreateTimeLine: row => {
      const userdata = row;
      handleOpen();
      setTable({
        url: `/User/GetApplicationHistory`,
        params: { ApplicationId: userdata.referenceNumber },
      });
    },
    EditForm: row => {
      const userdata = row.original;
      navigation.navigate('EditForm', {
        referenceNumber: userdata.referenceNumber,
        ServiceId: userdata.serviceId,
      });
    },
    DownloadSanctionLetter: async row => {
      try {
        const userdata = row.original;
        const applicationId = userdata.referenceNumber;
        const fileName =
          applicationId.replace(/\//g, '_') + 'SanctionLetter.pdf';
        const url = `/files/${fileName}`;
        const downloadPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

        const { promise } = RNFS.downloadFile({
          fromUrl: url,
          toFile: downloadPath,
        });

        await promise;
        Alert.alert('Success', `File downloaded to ${downloadPath}`);
      } catch (error) {
        console.error('Download error:', error);
        Alert.alert('Error', 'Failed to download sanction letter.');
      }
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.tableContainer}>
        <ServerSideTable
          url="/User/GetInitiatedApplications"
          extraParams={{}}
          actionFunctions={actionFunctions}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Application History</Text>
            {table && (
              <ServerSideTable
                url={table.url}
                extraParams={table.params}
                actionFunctions={actionFunctions}
              />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
