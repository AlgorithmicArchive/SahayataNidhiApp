import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { Picker } from '@react-native-picker/picker';
import { pick, types } from '@react-native-documents/picker';
import { Controller, useForm } from 'react-hook-form';
import axiosInstance from '../../../services/axiosconfig';
import { API_URL } from '@env';
import {
  fetchCertificateDetails,
  fetchUserDetail,
} from '../../../services/api';
import { formatKey, runValidations } from '../../../services/formvalidations';
import { AppContext } from '../../../contexts/AppContext';
import { CollapsibleFormDetails } from '../../CollapsibleFormDetails';

// Placeholder for CollapsibleFormDetails
// const CollapsibleFormDetails = ({
//   formDetails,
//   formatKey,
//   detailsOpen,
//   setDetailsOpen,
//   onViewPdf,
//   theme,
// }) => (
//   <View style={styles.collapsibleContainer}>
//     <TouchableOpacity
//       style={styles.collapsibleHeader}
//       onPress={() => setDetailsOpen(!detailsOpen)}
//     >
//       <Text style={[styles.collapsibleTitle, { color: theme.text }]}>
//         {detailsOpen ? 'Hide Details' : 'Show Details'}
//       </Text>
//     </TouchableOpacity>

//     {detailsOpen && (
//       <View style={styles.collapsibleContent}>
//         {Object.entries(formDetails).map(([key, value]) => (
//           <View key={key} style={styles.detailItem}>
//             <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
//               {formatKey(key)}:
//             </Text>

//             {Array.isArray(value) ? (
//               value.map((item, index) => (
//                 <View key={index} style={{ marginLeft: 10, marginVertical: 2 }}>
//                   {typeof item === 'object' && item !== null ? (
//                     Object.entries(item).map(([subKey, subVal]) => (
//                       <Text
//                         key={subKey}
//                         style={[styles.detailValue, { color: theme.text }]}
//                       >
//                         {formatKey(subKey)}: {subVal?.toString() || 'N/A'}
//                       </Text>
//                     ))
//                   ) : (
//                     <Text style={[styles.detailValue, { color: theme.text }]}>
//                       {item?.toString() || 'N/A'}
//                     </Text>
//                   )}
//                 </View>
//               ))
//             ) : typeof value === 'string' && value.startsWith('http') ? (
//               <TouchableOpacity onPress={() => onViewPdf(value)}>
//                 <Text style={[styles.detailValue, { color: theme.main }]}>
//                   View PDF
//                 </Text>
//               </TouchableOpacity>
//             ) : typeof value === 'object' && value !== null ? (
//               Object.entries(value).map(([subKey, subVal]) => (
//                 <Text
//                   key={subKey}
//                   style={[styles.detailValue, { color: theme.text }]}
//                 >
//                   {formatKey(subKey)}: {subVal?.toString() || 'N/A'}
//                 </Text>
//               ))
//             ) : (
//               <Text style={[styles.detailValue, { color: theme.text }]}>
//                 {value?.toString() || 'N/A'}
//               </Text>
//             )}
//           </View>
//         ))}
//       </View>
//     )}
//   </View>
// );

// Placeholder for SectionSelectCheckboxes
const SectionSelectCheckboxes = ({
  formDetails,
  control,
  name,
  value,
  onChange,
  formatKey,
  theme,
}) => {
  const sections = Object.keys(formDetails).map(key => ({
    label: formatKey(key),
    value: key,
  }));

  return (
    <View style={styles.checkboxContainer}>
      {sections.map(section => (
        <View key={section.value} style={styles.checkboxItem}>
          <TouchableOpacity
            onPress={() => {
              const newValue = value.includes(section.value)
                ? value.filter(v => v !== section.value)
                : [...value, section.value];
              onChange(newValue);
            }}
            style={styles.checkbox}
          >
            <Text style={[styles.checkboxText, { color: theme.text }]}>
              {value.includes(section.value) ? '☑' : '☐'} {section.label}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default function UserDetails() {
  const { theme } = React.useContext(AppContext);
  const { params } = useRoute();
  const { applicationId } = params || {};
  const [formDetails, setFormDetails] = useState({});
  const [actionForm, setActionForm] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [isSignedPdf, setIsSignedPdf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [certificateDetails, setCertificateDetails] = useState(null);
  const [isSanctionLetter, setIsSanctionLetter] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  const navigation = useNavigation();
  const {
    control,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm({ mode: 'onChange' });

  // Fetch user details
  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      try {
        await fetchUserDetail(applicationId, setFormDetails, setActionForm);
      } catch (error) {
        console.error('Error fetching user details:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load user details. Please try again.',
          position: 'top',
        });
      } finally {
        setLoading(false);
      }
    }
    if (applicationId) loadDetails();
  }, [applicationId]);

  // Handle PDF view
  const handleViewPdf = url => {
    setPdfUrl({ uri: url });
    setIsSignedPdf(false);
    setPdfModalOpen(true);
  };

  // Sign PDF
  const signPdf = async (pdfBlob, pin) => {
    const formData = new FormData();
    formData.append('pdf', pdfBlob, 'document.pdf');
    formData.append('pin', pin);
    formData.append(
      'original_path',
      applicationId.replace(/\//g, '_') + 'SanctionLetter.pdf',
    );
    try {
      const response = await fetch(`${API_URL}/sign`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Signing failed: ${errorText}`);
      }
      const signedBlob = await response.blob();
      const signedUrl =
        response.headers.get('X-Signed-Pdf-Url') || `${API_URL}/signed.pdf`;
      return { blob: signedBlob, url: signedUrl };
    } catch (error) {
      throw new Error(
        'Error signing PDF: ' +
          error.message +
          ' Check if the signing service is accessible.',
      );
    }
  };

  // Check desktop app
  const checkDesktopApp = async () => {
    try {
      const response = await fetch(`${API_URL}/`);
      if (!response.ok) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Desktop application is not running.',
          position: 'top',
        });
        return false;
      }
      return true;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please start the USB Token PDF Signer desktop application.',
        position: 'top',
      });
      return false;
    }
  };

  // Fetch certificates
  const fetchCertificates = async pin => {
    const formData = new FormData();
    formData.append('pin', pin);
    const response = await fetch(`${API_URL}/certificates`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  };

  // Handle PIN submission and sign PDF
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

    const normalizeSerial = value =>
      value?.toString().replace(/\s+/g, '').toUpperCase();

    setButtonLoading(true);
    try {
      const certificates = await fetchCertificates(pin);
      if (!certificates || certificates.length === 0) {
        throw new Error('No certificates found on the USB token.');
      }

      const selectedCertificate = certificates[0];
      const expiration = new Date(certificateDetails?.expirationDate);
      const now = new Date();
      const tokenSerial = normalizeSerial(selectedCertificate.serial_number);
      const registeredSerial = normalizeSerial(
        certificateDetails?.serial_number,
      );

      if (tokenSerial !== registeredSerial) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Not the registered certificate.',
          position: 'top',
        });
        return;
      } else if (expiration < now) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'The registered certificate has expired.',
          position: 'top',
        });
        return;
      }

      const { blob: signedBlob, url: signedUrl } = await signPdf(pdfBlob, pin);

      const updateFormData = new FormData();
      updateFormData.append('signedPdf', signedBlob, 'signed.pdf');
      updateFormData.append('applicationId', applicationId);
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

      setPdfUrl({ uri: signedUrl });
      setPdfBlob(null);
      setIsSignedPdf(true);
      setConfirmOpen(false);
      setPdfModalOpen(true);

      if (pendingFormData) {
        await handleFinalSubmit(pendingFormData);
        setPendingFormData(null);
      }
    } catch (error) {
      console.error('Signing error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error signing PDF: ' + error.message,
        position: 'top',
      });
    } finally {
      setButtonLoading(false);
      setPin('');
    }
  };

  // Fetch sanction letter
  const sanctionAction = async () => {
    try {
      const response = await axiosInstance.get('/Officer/GetSanctionLetter', {
        params: { applicationId: applicationId },
      });
      const result = response.data;
      if (!result.status) {
        throw new Error(result.response || 'Something went wrong');
      }
      const pdfResponse = await fetch(result.path);
      if (!pdfResponse.ok) {
        throw new Error('Failed to fetch PDF from server');
      }
      const newPdfBlob = await pdfResponse.blob();
      setPdfBlob(newPdfBlob);
      setPdfUrl({ uri: result.path });
      setIsSignedPdf(false);
      setPdfModalOpen(true);
      setIsSanctionLetter(true);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
        position: 'top',
      });
    }
  };

  // Handle final form submission
  const handleFinalSubmit = async data => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value && value.uri) {
        // Handle DocumentPicker file
        formData.append(key, {
          uri: value.uri,
          name: value.name,
          type: value.type,
        });
      } else if (value && typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value ?? '');
      }
    });
    formData.append('applicationId', applicationId);
    try {
      const { data: result } = await axiosInstance.post(
        '/Officer/HandleAction',
        formData,
      );
      if (!result.status) {
        throw new Error(result.response || 'Something went wrong');
      }
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Action completed successfully!',
        position: 'top',
        autoClose: 6000,
      });
      setTimeout(() => {
        navigation.navigate('OfficerHome');
      }, 6000);
    } catch (error) {
      console.error('Submission error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error processing request: ' + error.message,
        position: 'top',
      });
    } finally {
      setButtonLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async data => {
    const defaultAction = data.defaultAction?.toLowerCase();
    setButtonLoading(true);

    if (defaultAction === 'sanction') {
      const certDetails = await fetchCertificateDetails();
      if (!certDetails) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2:
            'You have not registered DSC, so you can’t sanction this application.',
          position: 'top',
        });
        setButtonLoading(false);
        return;
      }

      const isAppRunning = await checkDesktopApp();
      if (!isAppRunning) {
        setButtonLoading(false);
        return;
      }

      setCertificateDetails(certDetails);
      setPendingFormData(data);
      await sanctionAction();
      setButtonLoading(false);
      return;
    }

    await handleFinalSubmit(data);
  };

  // Handle modal close
  const handleModalClose = () => {
    setPdfModalOpen(false);
    setPdfUrl(null);
    setPdfBlob(null);
    setIsSignedPdf(false);
    setIsSanctionLetter(false);
  };

  // Render form fields
  const renderField = (field, sectionIndex) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'date':
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            defaultValue=""
            rules={{
              validate: async value =>
                await runValidations(field, value, getValues()),
            }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  {field.label}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { borderColor: theme.border, color: theme.text },
                  ]}
                  value={value || ''}
                  onChangeText={onChange}
                  keyboardType={
                    field.type === 'email'
                      ? 'email-address'
                      : field.type === 'date'
                      ? 'default'
                      : 'default'
                  }
                  maxLength={
                    field.validationFunctions?.includes('specificLength')
                      ? field.maxLength
                      : undefined
                  }
                  placeholder={field.label}
                  placeholderTextColor={theme.textSecondary}
                />
                {error && (
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />
        );
      case 'file':
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            defaultValue={null}
            rules={{
              validate: async value => await runValidations(field, value),
            }}
            render={({ field: { onChange }, fieldState: { error } }) => (
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  {field.label}
                </Text>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.main }]}
                  onPress={async () => {
                    console.log('onPress triggered');
                    const hasPermission = await requestStoragePermission();
                    console.log('Permission granted:', hasPermission);
                    if (!hasPermission) {
                      console.log('Permission denied, exiting');
                      Alert.alert(
                        'Permission Denied',
                        'Storage permission is required to pick files.',
                      );
                      return;
                    }

                    try {
                      console.log('Attempting to open file picker');
                      const [file] = await pick({
                        type: [types.images, types.pdf],
                      });
                      console.log('File picked:', file);

                      onChange({
                        uri: file.uri,
                        type: file.type,
                        name: file.name,
                      });
                    } catch (err) {
                      console.log('Error in pick:', err);
                      if (!isCancel(err)) {
                        console.error('Document Picker error:', err);
                        Alert.alert(
                          'Error',
                          `Failed to pick a document: ${err.message}`,
                        );
                      } else {
                        console.log('User cancelled the picker');
                      }
                    }
                  }}
                >
                  <Text style={[styles.buttonText, { color: theme.text }]}>
                    Upload {field.label}
                  </Text>
                </TouchableOpacity>
                {error && (
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />
        );
      case 'select':
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            defaultValue={field.options[0]?.value || ''}
            rules={{
              validate: async value =>
                await runValidations(field, value, getValues()),
            }}
            render={({ field: { onChange, value }, fieldState: { error } }) => {
              let options =
                field.optionsType === 'dependent' && field.dependentOn
                  ? field.dependentOptions?.[watch(field.dependentOn)] || []
                  : field.options || [];
              return (
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    {field.label}
                  </Text>
                  <View
                    style={[
                      styles.pickerContainer,
                      { borderColor: theme.border },
                    ]}
                  >
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={{ color: theme.text }}
                    >
                      {options.map(option => (
                        <Picker.Item
                          key={`${field.name}-${option.value}`}
                          label={option.label}
                          value={option.value}
                        />
                      ))}
                    </Picker>
                  </View>
                  {error && (
                    <Text style={[styles.errorText, { color: theme.error }]}>
                      {error.message}
                    </Text>
                  )}
                  {field.additionalFields && field.additionalFields[value] && (
                    <View style={styles.additionalFields}>
                      {field.additionalFields[value].map(additionalField => {
                        const additionalFieldName =
                          additionalField.name ||
                          `${field.name}_${additionalField.id}`;
                        return (
                          <View
                            key={additionalField.id}
                            style={styles.additionalField}
                          >
                            {renderField(
                              { ...additionalField, name: additionalFieldName },
                              sectionIndex,
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            }}
          />
        );
      case 'enclosure':
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            defaultValue={{
              selected: field.options[0]?.value || '',
              file: null,
            }}
            rules={{
              validate: async value =>
                await runValidations(field, value, getValues()),
            }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  {field.label}
                </Text>
                <View
                  style={[
                    styles.pickerContainer,
                    { borderColor: theme.border },
                  ]}
                >
                  <Picker
                    selectedValue={value?.selected || ''}
                    onValueChange={newValue =>
                      onChange({ ...value, selected: newValue })
                    }
                    style={{ color: theme.text }}
                  >
                    {field.options.map(option => (
                      <Picker.Item
                        key={`${field.name}-${option.value}`}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                  </Picker>
                </View>
                {error?.selected && (
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {error.selected.message}
                  </Text>
                )}
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: value?.selected
                        ? theme.main
                        : theme.disabled,
                    },
                  ]}
                  disabled={!value?.selected}
                  onPress={async () => {
                    try {
                      const res = await DocumentPicker.pickSingle({
                        type: [DocumentPicker.types.allFiles],
                      });
                      onChange({ ...value, file: res });
                    } catch (err) {
                      if (DocumentPicker.isCancel(err)) {
                        // User cancelled
                      } else {
                        Toast.show({
                          type: 'error',
                          text1: 'Error',
                          text2: 'Failed to pick file.',
                          position: 'top',
                        });
                      }
                    }
                  }}
                >
                  <Text style={[styles.buttonText, { color: theme.text }]}>
                    Upload File
                  </Text>
                </TouchableOpacity>
                {error?.file && (
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {error.file.message}
                  </Text>
                )}
              </View>
            )}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.main} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading user details...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: theme.main }]}>User Details</Text>

      {/* Collapsible Form Details */}
      <CollapsibleFormDetails
        formDetails={formDetails}
        formatKey={formatKey}
        detailsOpen={detailsOpen}
        setDetailsOpen={setDetailsOpen}
        onViewPdf={handleViewPdf}
        theme={theme}
      />

      {/* Action Form */}
      <Text style={[styles.sectionTitle, { color: theme.main }]}>
        Action Form
      </Text>
      <View
        style={[
          styles.formContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <View style={styles.formInner}>
          {actionForm.length > 0 ? (
            <View component="form" onSubmit={handleSubmit(onSubmit)}>
              {actionForm.map((field, index) => {
                const selectedValue =
                  field.type === 'select' ? watch(field.name) : null;
                return (
                  <View key={index} style={styles.fieldWrapper}>
                    {renderField(field, index)}
                    {field.type === 'select' &&
                      selectedValue === 'ReturnToCitizen' && (
                        <Controller
                          name="returnFields"
                          control={control}
                          defaultValue={[]}
                          rules={{
                            validate: value =>
                              value.length > 0 ||
                              'Select at least one user detail field.',
                          }}
                          render={({
                            field: { onChange, value },
                            fieldState: { error },
                          }) => (
                            <View style={styles.checkboxWrapper}>
                              <Text
                                style={[
                                  styles.checkboxLabel,
                                  { color: theme.textSecondary },
                                ]}
                              >
                                Select Fields to Return
                              </Text>
                              <SectionSelectCheckboxes
                                formDetails={formDetails}
                                control={control}
                                name="returnFields"
                                value={value}
                                onChange={onChange}
                                formatKey={formatKey}
                                theme={theme}
                              />
                              {error && (
                                <Text
                                  style={[
                                    styles.errorText,
                                    { color: theme.error },
                                  ]}
                                >
                                  {error.message}
                                </Text>
                              )}
                            </View>
                          )}
                        />
                      )}
                  </View>
                );
              })}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: buttonLoading
                      ? theme.disabled
                      : theme.main,
                  },
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={buttonLoading}
              >
                {buttonLoading ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <Text style={[styles.buttonText, { color: theme.text }]}>
                    Take Action
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.noFieldsText, { color: theme.textSecondary }]}>
              No action form fields available.
            </Text>
          )}
        </View>
      </View>

      {/* Confirmation Modal */}
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
                disabled={!pin || buttonLoading}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Submit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PDF Modal */}
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
                  Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to load PDF.',
                    position: 'top',
                  });
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
              {isSanctionLetter && !isSignedPdf && (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.main }]}
                  onPress={() => setConfirmOpen(true)}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  formContainer: {
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    marginBottom: 20,
  },
  formInner: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  collapsibleContainer: {
    marginBottom: 20,
  },
  collapsibleHeader: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  collapsibleTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  collapsibleContent: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    flex: 2,
  },
  checkboxContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  checkboxWrapper: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  checkboxItem: {
    marginBottom: 8,
  },
  checkboxText: {
    fontSize: 14,
  },
  additionalFields: {
    marginTop: 16,
  },
  additionalField: {
    marginBottom: 16,
  },
  noFieldsText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
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
