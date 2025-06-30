import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import axiosInstance from '../../../services/axiosconfig';
import ServerSideTable from '../../common/ServerSideTable';
import { AppContext } from '../../../contexts/AppContext';
import { fetchServiceList } from '../../../services/api';

// Placeholder for ServiceSelectionForm
const ServiceSelectionForm = ({ services, onServiceSelect, theme }) => {
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    console.log('Services in ServiceSelectionForm:', services);
  }, [services]);

  if (!services || services.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: theme.text }]}>
        No services available
      </Text>
    );
  }

  return (
    <View style={styles.formContainer}>
      <Text style={[styles.label, { color: theme.text }]}>Select Service</Text>
      {services.map(item => (
        <TouchableOpacity
          key={item.value}
          style={[
            styles.serviceItem,
            { backgroundColor: theme.backgroundSecondary },
          ]}
          onPress={() => {
            setSelectedService(item.value);
            onServiceSelect(item.value);
          }}
        >
          <Text style={[styles.serviceText, { color: theme.text }]}>
            {item.label || 'Unnamed Service'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Placeholder for StatusCountCard
const StatusCountCard = ({
  statusName,
  count,
  bgColor,
  textColor,
  onClick,
}) => (
  <TouchableOpacity
    style={[styles.card, { backgroundColor: bgColor }]}
    onPress={onClick}
  >
    <Text style={[styles.cardText, { color: textColor }]}>{statusName}</Text>
    <Text style={[styles.cardCount, { color: textColor }]}>{count}</Text>
  </TouchableOpacity>
);

// Main OfficerHome Component
export default function OfficerHome() {
  const { theme } = useContext(AppContext);
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(null);
  const [countList, setCountList] = useState([]);
  const [canSanction, setCanSanction] = useState(false);
  const [canHavePool, setCanHavePool] = useState(false);
  const [type, setType] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [selectedAction, setSelectedAction] = useState('Reject');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [isSignedPdf, setIsSignedPdf] = useState(false);
  const [currentApplicationId, setCurrentApplicationId] = useState('');
  const [pendingIds, setPendingIds] = useState([]);
  const [currentIdIndex, setCurrentIdIndex] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tableRef = useRef(null);
  const navigation = useNavigation();

  // Fetch application counts
  const handleRecords = async serviceId => {
    try {
      setServiceId(serviceId);
      const response = await axiosInstance.get(
        '/Officer/GetApplicationsCount',
        {
          params: { ServiceId: serviceId },
        },
      );
      setCountList(response.data.countList);
      setCanSanction(response.data.canSanction);
      setCanHavePool(response.data.canHavePool);
    } catch (error) {
      console.error('Failed to fetch application counts:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load application counts. Please try again.',
        position: 'top',
      });
    }
  };

  // Handle card click
  const handleCardClick = statusName => {
    setType(statusName);
    setShowTable(true);
    setTimeout(() => {
      tableRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  // Action functions for row actions
  const actionFunctions = {
    handleOpenApplication: row => {
      navigation.navigate('UserDetails', {
        applicationId: row.referenceNumber,
      });
    },
    handleViewApplication: row => {
      navigation.navigate('ViewUserDetails', {
        applicationId: row.referenceNumber,
      });
    },
    pullApplication: async row => {
      try {
        const response = await axiosInstance.get('/Officer/PullApplication', {
          params: { applicationId: row.referenceNumber },
        });
        if (response.data.status) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Successfully pulled application!',
            position: 'top',
          });
          setRefreshTrigger(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error pulling application:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to pull application. Please try again.',
          position: 'top',
        });
      }
    },
  };

  // Handle Push to Pool
  const handlePushToPool = async selectedRows => {
    if (selectedRows.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No applications selected.',
        position: 'top',
      });
      return;
    }

    const list = JSON.stringify(selectedRows);
    try {
      await axiosInstance.get('/Officer/UpdatePool', {
        params: {
          serviceId: serviceId,
          list: list,
        },
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Successfully pushed to pool!',
        position: 'top',
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error pushing to pool:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to push to pool. Please try again.',
        position: 'top',
      });
    }
  };

  // Sign PDF (Adjust backend URL for mobile access)
  const signPdf = async (pdfBlob, pin) => {
    const formData = new FormData();
    formData.append('pdf', pdfBlob, 'document.pdf');
    formData.append('pin', pin);
    formData.append(
      'original_path',
      currentApplicationId.replace(/\//g, '_') + 'SanctionLetter.pdf',
    );
    try {
      const response = await fetch('http://<your-machine-ip>:8000/sign', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Signing failed: ${errorText}`);
      }
      const signedBlob = await response.blob();
      // Since WebView needs a URL, assume the backend returns the signed PDF URL
      const signedUrl =
        response.headers.get('X-Signed-Pdf-Url') ||
        'http://<your-machine-ip>:8000/signed.pdf'; // Adjust based on backend
      return { blob: signedBlob, url: signedUrl };
    } catch (error) {
      throw new Error(
        'Error signing PDF: ' +
          error.message +
          ' Check if the signing service is accessible.',
      );
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setPdfModalOpen(false);
    setPdfUrl(null);
    setPdfBlob(null);
    setIsSignedPdf(false);
  };

  // Process single ID
  const processSingleId = async id => {
    setCurrentApplicationId(id);
    const formData = new FormData();
    formData.append('applicationId', id);
    formData.append('defaultAction', selectedAction);
    formData.append(
      'Remarks',
      selectedAction === 'Sanction' ? 'Sanctioned' : 'Rejected',
    );

    try {
      const { data: result } = await axiosInstance.post(
        '/Officer/HandleAction',
        formData,
      );
      if (!result.status) {
        throw new Error(result.response || 'Something went wrong');
      }

      if (selectedAction === 'Sanction') {
        // Handle Sanction: Fetch PDF and open modal
        const pdfResponse = await fetch(result.path);
        if (!pdfResponse.ok) {
          throw new Error('Failed to fetch PDF from server');
        }
        const newPdfBlob = await pdfResponse.blob();
        setPdfBlob(newPdfBlob);
        setPdfUrl({ uri: result.path }); // Use server-provided URL for WebView
        setIsSignedPdf(false);
        setPdfModalOpen(true);
      } else {
        // Handle Reject: Remove from pool and proceed
        try {
          await axiosInstance.get('/Officer/RemoveFromPool', {
            params: {
              ServiceId: serviceId,
              itemToRemove: id,
            },
          });
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Application rejected and removed from pool!',
            position: 'top',
          });
        } catch (error) {
          console.error('Error removing from pool:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to remove application from pool.',
            position: 'top',
          });
        }

        // Move to the next ID
        const nextIndex = currentIdIndex + 1;
        if (nextIndex < pendingIds.length) {
          setCurrentIdIndex(nextIndex);
          await processSingleId(pendingIds[nextIndex]);
        } else {
          setPendingIds([]);
          setCurrentIdIndex(0);
          setCurrentApplicationId('');
          setRefreshTrigger(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Error processing ${selectedAction.toLowerCase()} request: ${
          error.message
        }`,
        position: 'top',
      });
    }
  };

  // Sign and update PDF
  const signAndUpdatePdf = async pinToUse => {
    try {
      const { blob: signedBlob, url: signedUrl } = await signPdf(
        pdfBlob,
        pinToUse,
      );
      const updateFormData = new FormData();
      updateFormData.append('signedPdf', signedBlob, 'signed.pdf');
      updateFormData.append('applicationId', currentApplicationId);
      const updateResponse = await axiosInstance.post(
        '/Officer/UpdatePdf',
        updateFormData,
      );
      if (!updateResponse.data.status) {
        throw new Error(
          'Failed to update PDF on server: ' +
            (updateResponse.data.response || 'Unknown error'),
        );
      }

      // Remove the application from the pool
      try {
        await axiosInstance.get('/Officer/RemoveFromPool', {
          params: {
            ServiceId: serviceId,
            itemToRemove: currentApplicationId,
          },
        });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Application sanctioned and removed from pool!',
          position: 'top',
        });
      } catch (error) {
        console.error('Error removing from pool:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to remove application from pool.',
          position: 'top',
        });
      }

      setPdfUrl({ uri: signedUrl }); // Use server-provided signed PDF URL
      setPdfBlob(null);
      setIsSignedPdf(true);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'PDF signed successfully!',
        position: 'top',
      });

      // Move to the next ID
      const nextIndex = currentIdIndex + 1;
      if (nextIndex < pendingIds.length) {
        setCurrentIdIndex(nextIndex);
        await processSingleId(pendingIds[nextIndex]);
      } else {
        setPendingIds([]);
        setCurrentIdIndex(0);
        setCurrentApplicationId('');
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Signing error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error signing PDF: ' + error.message,
        position: 'top',
      });
      throw error;
    }
  };

  // Handle PIN submission
  const handlePinSubmit = async () => {
    if (!pin) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter the USB token PIN.',
        position: 'top',
      });
      return;
    }
    try {
      await signAndUpdatePdf(pin);
      setStoredPin(pin);
    } catch (error) {
      // Error handled in signAndUpdatePdf
    } finally {
      setConfirmOpen(false);
      setPin('');
    }
  };

  // Handle Sign PDF button click
  const handleSignPdf = async () => {
    if (storedPin) {
      try {
        await signAndUpdatePdf(storedPin);
      } catch (error) {
        setStoredPin(null);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Signing failed with stored PIN. Please enter PIN again.',
          position: 'top',
        });
        setConfirmOpen(true);
      }
    } else {
      setConfirmOpen(true);
    }
  };

  // Handle bulk action execution
  const handleExecuteAction = async selectedRows => {
    if (!selectedRows || selectedRows.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No applications selected.',
        position: 'top',
      });
      return;
    }
    const ids = selectedRows; // ServerSideTable passes row IDs directly
    setPendingIds(ids);
    setCurrentIdIndex(0);
    await processSingleId(ids[0]);
  };

  // Get action options for bulk action dropdown
  const getActionOptions = () => {
    const options = [{ value: 'Reject', label: 'Reject' }];
    if (canSanction) {
      options.push({ value: 'Sanction', label: 'Sanction' });
    }
    return options;
  };

  // Extra params for ServerSideTable
  const extraParams = {
    ServiceId: serviceId,
    type: type,
  };

  // Fetch services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Assuming fetchServiceList is defined elsewhere
        await fetchServiceList(setServices);
      } catch (error) {
        console.error('Failed to fetch services:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load services. Please try again.',
          position: 'top',
        });
      }
    };
    fetchServices();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      ref={tableRef}
    >
      <ServiceSelectionForm
        services={services}
        onServiceSelect={handleRecords}
        theme={theme}
      />
      <View style={styles.cardsContainer}>
        {countList.map((item, index) => (
          <StatusCountCard
            key={index}
            statusName={item.label}
            count={item.count}
            bgColor={item.bgColor}
            textColor={item.textColor}
            onClick={() => handleCardClick(item.label)}
          />
        ))}
      </View>
      {showTable && (
        <ServerSideTable
          key={`${serviceId}-${type}`}
          url="/Officer/GetApplications"
          extraParams={extraParams}
          actionFunctions={actionFunctions}
          canSanction={canSanction}
          canHavePool={canHavePool}
          pendingApplications={type === 'Pending'}
          serviceId={serviceId}
          refreshTrigger={refreshTrigger}
          onPushToPool={handlePushToPool}
          onExecuteAction={handleExecuteAction}
          actionOptions={getActionOptions()}
          selectedAction={selectedAction}
          setSelectedAction={setSelectedAction}
        />
      )}
      <Modal
        visible={confirmOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Enter USB Token PIN
            </Text>
            <Text style={[styles.modalText, { color: theme.text }]}>
              Please enter the PIN for your USB token to sign the document.
            </Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: theme.border, color: theme.text },
              ]}
              secureTextEntry
              placeholder="USB Token PIN"
              placeholderTextColor={theme.textSecondary}
              value={pin}
              onChangeText={setPin}
            />
            <Text style={[styles.helperText, { color: theme.textSecondary }]}>
              Required to sign the document.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => setConfirmOpen(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: pin ? theme.main : theme.disabled },
                ]}
                onPress={handlePinSubmit}
                disabled={!pin}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Submit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={pdfModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.pdfModalContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {isSignedPdf ? 'Signed Document' : 'Document Preview'}
            </Text>
            {pdfUrl && (
              <WebView
                source={pdfUrl}
                style={styles.pdf}
                onError={syntheticEvent => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView error:', nativeEvent);
                }}
                javaScriptEnabled={true}
                allowFileAccess={true}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={handleModalClose}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Close
                </Text>
              </TouchableOpacity>
              {!isSignedPdf && (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.main }]}
                  onPress={handleSignPdf}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>
                    Sign PDF
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
      <Toast />
    </ScrollView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  serviceItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  serviceText: {
    fontSize: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardCount: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  pdfModalContainer: {
    width: width * 0.9,
    height: height * 0.8,
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pdf: {
    flex: 1,
    width: width * 0.85,
    borderRadius: 8,
  },
});
