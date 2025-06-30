import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CheckBox } from 'react-native-elements';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import axiosInstance from '../../services/axiosconfig';
import { API_URL } from '@env';
import { AppContext } from '../../contexts/AppContext';
import { runValidations } from '../../services/formvalidations';
import { fetchFormDetails, GetServiceContent } from '../../services/api';
// Icon mapping for sections
const sectionIconMap = {
  Location: 'location-outline',
  'Applicant Details': 'person-outline',
  'Present Address Details': 'home-outline',
  'Permanent Address Details': 'home-outline',
  'Bank Details': 'card-outline',
  Documents: 'document-outline',
};

// Helper function to flatten the nested formDetails structure
const flattenFormDetails = nestedDetails => {
  const flat = {};
  function recurse(fields) {
    fields.forEach(field => {
      if (field.hasOwnProperty('Enclosure')) {
        flat[field.name] = {
          selected: field.Enclosure || '',
          file: field.File || '',
        };
      } else {
        if ('value' in field) flat[field.name] = field.value;
        if ('File' in field && field.File) flat[field.name] = field.File;
      }

      if (field.additionalFields) {
        const branches = Array.isArray(field.additionalFields)
          ? field.additionalFields
          : Object.values(field.additionalFields).flat();

        recurse(
          branches.map(af => ({
            ...af,
            name: af.name || `${field.name}_${af.id}`,
          })),
        );
      }
    });
  }

  Object.values(nestedDetails).forEach(fields => recurse(fields));
  return flat;
};

const DynamicStepForm = ({ mode = 'new', data }) => {
  const { theme } = React.useContext(AppContext);
  const navigation = useNavigation();
  const route = useRoute();
  const {
    control,
    handleSubmit,
    trigger,
    watch,
    getValues,
    setValue,
    reset,
    formState: { errors, dirtyFields },
  } = useForm({
    mode: 'onChange',
    shouldUnregister: false,
    defaultValues: {},
  });

  const [formSections, setFormSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [initialData, setInitialData] = useState(null);
  const [additionalDetails, setAdditionalDetails] = useState(null);
  const [isCopyAddressChecked, setIsCopyAddressChecked] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);
  const applicantImageFile = watch('ApplicantImage');
  const [applicantImagePreview, setApplicantImagePreview] = useState(null);
  const bankName = watch('BankName');
  const branchName = watch('BranchName');
  const [bankNameBlurred, setBankNameBlurred] = useState(false);
  const [branchNameBlurred, setBranchNameBlurred] = useState(false);
  const hasRunRef = useRef(false);

  const isFieldDisabled = fieldName => {
    if (
      mode === 'edit' &&
      additionalDetails &&
      additionalDetails.returnFields
    ) {
      return !additionalDetails.returnFields.includes(fieldName);
    }
    return false;
  };

  // Update image preview
  useEffect(() => {
    if (applicantImageFile && typeof applicantImageFile !== 'string') {
      setApplicantImagePreview(applicantImageFile.uri);
    }
  }, [applicantImageFile]);

  // Fetch IFSC Code
  useEffect(() => {
    async function fetchIFSCCode() {
      if (
        bankName &&
        branchName &&
        bankName !== 'Please Select' &&
        branchName.trim() &&
        bankNameBlurred &&
        branchNameBlurred
      ) {
        try {
          const response = await axiosInstance.get(
            API_URL + '/Base/GetIFSCCode',
            {
              params: { bankName, branchName },
            },
          );
          const data = response.data;
          if (data.status && data.result[0]) {
            setValue('IfscCode', data.result[0], { shouldValidate: true });
          } else {
            setValue('IfscCode', '', { shouldValidate: false });
          }
        } catch (error) {
          console.error('Error fetching IFSC code:', error);
          setValue('IfscCode', '', { shouldValidate: false });
        }
      }
    }
    fetchIFSCCode();
  }, [bankName, branchName, bankNameBlurred, branchNameBlurred, setValue]);

  // Load form content
  useEffect(() => {
    async function loadForm() {
      try {
        const { serviceId, referenceNumber } = route.params || {};
        setSelectedServiceId(serviceId);
        if (referenceNumber) {
          setReferenceNumber(referenceNumber);
        }
        const result = await GetServiceContent(serviceId);
        if (result && result.status) {
          try {
            const config = JSON.parse(result.formElement);
            setFormSections(config);
          } catch (err) {
            console.error('Error parsing formElements:', err);
            setFormSections([]);
          }
        }
        if ((mode === 'incomplete' || mode === 'edit') && referenceNumber) {
          const { formDetails, additionalDetails } = await fetchFormDetails(
            referenceNumber,
          );
          const flatDetails = flattenFormDetails(formDetails);
          setInitialData(flatDetails);
          const resetData = {
            ...flatDetails,
            ...Object.keys(flatDetails).reduce((acc, key) => {
              if (
                flatDetails[key] &&
                typeof flatDetails[key] === 'object' &&
                'selected' in flatDetails[key]
              ) {
                acc[`${key}_select`] = flatDetails[key].selected;
                acc[`${key}_file`] = flatDetails[key].file;
              }
              return acc;
            }, {}),
          };
          reset(resetData);
          setAdditionalDetails(additionalDetails);
        } else if (data) {
          setInitialData(data);
          reset(data);
        }
      } catch (error) {
        console.error('Error fetching service content:', error);
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [route.params, mode, reset, data]);

  // Set default file and dependent fields
  useEffect(() => {
    if (!formSections.length || !initialData || hasRunRef.current) return;
    hasRunRef.current = true;

    function recurseAndSet(fields, sectionIndex) {
      fields.forEach(field => {
        const name = field.name;
        const value = initialData[name];

        if (name.toLowerCase().includes('district') && value) {
          handleDistrictChange(sectionIndex, { ...field, name }, value);
        }

        if (name.toLowerCase().includes('applicantimage') && value) {
          setApplicantImagePreview(value);
          setValue('ApplicantImage', value);
        }

        if (field.type === 'enclosure' && value) {
          setValue(`${name}_select`, value.selected || '', {
            shouldValidate: true,
          });
          setValue(`${name}_file`, value.file || null, {
            shouldValidate: true,
          });
        }

        if (field.additionalFields) {
          const branches = Array.isArray(field.additionalFields)
            ? field.additionalFields
            : Object.values(field.additionalFields).flat();
          recurseAndSet(
            branches.map(af => ({
              ...af,
              name: af.name || `${name}_${af.id}`,
            })),
            sectionIndex,
          );
        }
      });
    }

    formSections.forEach((section, idx) => recurseAndSet(section.fields, idx));
  }, [formSections, initialData, setValue]);

  const handleCopyAddress = (checked, sectionIndex) => {
    if (checked) {
      const presentSection = formSections.find(
        sec => sec.section === 'Present Address Details',
      );
      const permanentSection = formSections.find(
        sec => sec.section === 'Permanent Address Details',
      );
      const permanentDistrictField = permanentSection?.fields.find(field =>
        field.name.includes('District'),
      );
      if (presentSection) {
        presentSection.fields.forEach(field => {
          const presentFieldName = field.name;
          const permanentFieldName = presentFieldName.replace(
            'Present',
            'Permanent',
          );
          const presentValue = getValues(presentFieldName);
          setValue(permanentFieldName, presentValue);
          if (
            permanentFieldName.includes('District') &&
            permanentDistrictField
          ) {
            handleDistrictChange(
              sectionIndex,
              permanentDistrictField,
              presentValue,
            );
          }
        });
      }
    }
  };

  const handleNext = async () => {
    const stepFields = formSections[currentStep].fields.flatMap(field => {
      if (field.type === 'enclosure') {
        return [`${field.name}_select`, `${field.name}_file`];
      }
      if (field.type === 'select' && field.additionalFields) {
        const sel = getValues(field.name);
        const extra = field.additionalFields[sel] || [];
        const nested = extra.map(af => af.name || `${field.name}_${af.id}`);
        return [field.name, ...nested];
      }
      return [field.name];
    });

    const enabledFields = stepFields.filter(name => !isFieldDisabled(name));

    if (mode === 'edit') {
      const allUpdated = enabledFields.every(name => dirtyFields[name]);
      if (!allUpdated) {
        alert('Please modify all correction fields before proceeding.');
        return;
      }
    }

    const valid = await trigger(stepFields);
    if (valid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleDistrictChange = async (sectionIndex, districtField, value) => {
    try {
      const response = await axiosInstance.get(
        `${API_URL}/Base/GetTeshilForDistrict`,
        {
          params: { districtId: value },
        },
      );
      const data = response.data;
      if (data.status && data.tehsils) {
        const newOptions = [
          { value: 'Please Select', label: 'Please Select' },
          ...data.tehsils.map(tehsil => ({
            value: tehsil.tehsilId,
            label: tehsil.tehsilName,
          })),
        ];
        setFormSections(prevSections => {
          const newSections = [...prevSections];
          const section = newSections[sectionIndex];
          const tehsilFieldName = districtField.name.replace(
            'District',
            'Tehsil',
          );
          section.fields = section.fields.map(field =>
            field.name === tehsilFieldName
              ? { ...field, options: newOptions }
              : field,
          );
          return newSections;
        });
      }
    } catch (error) {
      console.error('Error fetching tehsils:', error);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const permission =
          Platform.Version >= 33
            ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
            : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

        const result = await check(permission);
        if (result === RESULTS.GRANTED) {
          return true;
        }

        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          return true;
        } else {
          Alert.alert(
            'Permission Denied',
            'Storage permission is required to select images.',
          );
          return false;
        }
      } catch (error) {
        console.error('Error requesting storage permission:', error);
        Alert.alert('Error', 'Failed to request storage permission.');
        return false;
      }
    }
    return true; // iOS handles permissions via Info.plist
  };

  const onSubmit = async (data, operationType) => {
    const groupedFormData = {};
    setButtonLoading(true);

    const processField = (field, data) => {
      if (field.type === 'enclosure' && field.isDependentEnclosure) {
        const parentValue = data[field.dependentField];
        if (!parentValue || !field.dependentValues.includes(parentValue)) {
          return null;
        }
      }

      const sectionFormData = {};
      const fieldValue = data[field.name] || '';
      sectionFormData['label'] = field.label;
      sectionFormData['name'] = field.name;

      if (field.type === 'enclosure') {
        sectionFormData['Enclosure'] = data[`${field.name}_select`] || '';
        sectionFormData['File'] = data[`${field.name}_file`] || '';
      } else if (field.name === 'ApplicantImage') {
        sectionFormData['File'] = fieldValue;
      } else {
        sectionFormData['value'] = fieldValue;
      }

      if (field.additionalFields) {
        const selectedValue = data[field.name] || '';
        const additionalFields = field.additionalFields[selectedValue];
        if (additionalFields) {
          sectionFormData.additionalFields = additionalFields
            .map(additionalField => {
              const nestedFieldName =
                additionalField.name || `${field.name}_${additionalField.id}`;
              return processField(
                { ...additionalField, name: nestedFieldName },
                data,
              );
            })
            .filter(nestedField => nestedField !== null);
        }
      }
      return sectionFormData;
    };

    formSections.forEach(section => {
      groupedFormData[section.section] = [];
      section.fields.forEach(field => {
        const sectionData = processField(field, data);
        if (sectionData !== null) {
          groupedFormData[section.section].push(sectionData);
        }
      });
    });

    const formData = new FormData();
    formData.append('serviceId', selectedServiceId);
    formData.append('formDetails', JSON.stringify(groupedFormData));

    for (const section in groupedFormData) {
      groupedFormData[section].forEach(field => {
        if (
          field.hasOwnProperty('File') &&
          field.File &&
          typeof field.File !== 'string'
        ) {
          formData.append(field.name, {
            uri: field.File.uri,
            name:
              field.File.fileName ||
              field.File.name ||
              `${field.name}.${field.File.type.split('/')[1]}`,
            type: field.File.type,
          });
        }
        if (field.additionalFields) {
          field.additionalFields.forEach(nestedField => {
            if (
              nestedField.hasOwnProperty('File') &&
              nestedField.File &&
              typeof nestedField.File !== 'string'
            ) {
              formData.append(nestedField.name, {
                uri: nestedField.File.uri,
                name:
                  nestedField.File.fileName ||
                  nestedField.File.name ||
                  `${nestedField.name}.${nestedField.File.type.split('/')[1]}`,
                type: nestedField.File.type,
              });
            }
          });
        }
      });
    }

    formData.append(
      'status',
      operationType === 'submit' ? 'Initiated' : 'Incomplete',
    );
    formData.append('referenceNumber', referenceNumber);
    let url = '/User/InsertFormDetails';
    if (additionalDetails) {
      formData.append('returnFields', additionalDetails['returnFields'] || '');
      url = '/User/UpdateApplicationDetails';
    }

    try {
      const response = await axiosInstance.post(API_URL + url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = response.data;
      setButtonLoading(false);
      if (result.status) {
        if (result.type === 'Submit') {
          navigation.navigate('Status', {
            screen: 'Acknowledgement',
            params: { applicationId: result.referenceNumber },
          });
        } else if (result.type === 'Edit') {
          setReferenceNumber(result.referenceNumber);
          navigation.navigate('Status', { screen: 'InitiatedApplications' });
        } else {
          setReferenceNumber(result.referenceNumber);
        }
      } else {
        console.error('Submission failed:', result);
        Alert.alert('Error', 'Form submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setButtonLoading(false);
      Alert.alert('Error', 'An error occurred while submitting the form.');
    }
  };

  const renderField = (field, sectionIndex) => {
    const commonStyles = {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: errors[field.name] ? '#ef4444' : '#d1d5db',
      borderRadius: 8,
      padding: 8,
      fontSize: 16,
      color: '#1f2937',
      marginBottom: 12,
    };

    const buttonStyles = {
      backgroundColor: buttonLoading ? '#9ca3af' : theme.main,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
      marginBottom: 12,
    };

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <View style={styles.fieldContainer}>
            <Controller
              name={field.name}
              control={control}
              defaultValue=""
              rules={{
                validate: async value =>
                  await runValidations(
                    field,
                    value,
                    getValues(),
                    referenceNumber,
                  ),
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    style={[
                      commonStyles,
                      isFieldDisabled(field.name) && styles.disabledInput,
                    ]}
                    value={value || ''}
                    onChangeText={text => {
                      let val = text;
                      if (
                        field.transformationFunctions?.includes(
                          'CaptilizeAlphabet',
                        )
                      ) {
                        val = text.toUpperCase();
                      }
                      onChange(val);
                    }}
                    onBlur={() => {
                      if (field.name === 'BranchName') {
                        setBranchNameBlurred(true);
                      }
                    }}
                    editable={!isFieldDisabled(field.name)}
                    maxLength={
                      field.validationFunctions?.includes('specificLength')
                        ? field.maxLength
                        : undefined
                    }
                    keyboardType={
                      field.type === 'email' ? 'email-address' : 'default'
                    }
                  />
                  {errors[field.name] && (
                    <Text style={styles.errorText}>
                      {errors[field.name].message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>
        );

      case 'date':
        return (
          <View style={styles.fieldContainer}>
            <Controller
              name={field.name}
              control={control}
              defaultValue=""
              rules={{
                validate: async value =>
                  await runValidations(
                    field,
                    value,
                    getValues(),
                    referenceNumber,
                  ),
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <Text style={styles.label}>{field.label}</Text>
                  <TouchableOpacity
                    style={[
                      buttonStyles,
                      isFieldDisabled(field.name) && styles.disabledButton,
                    ]}
                    disabled={isFieldDisabled(field.name) || buttonLoading}
                    onPress={() => {
                      setCurrentDateField(field.name);
                      setDatePickerVisible(true);
                    }}
                  >
                    <Text style={styles.buttonText}>
                      {value || 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                  <DatePicker
                    modal
                    open={datePickerVisible && currentDateField === field.name}
                    date={value ? new Date(value) : new Date()}
                    mode="date"
                    onConfirm={date => {
                      const formattedDate = date.toISOString().split('T')[0];
                      onChange(formattedDate);
                      setDatePickerVisible(false);
                      setCurrentDateField(null);
                    }}
                    onCancel={() => {
                      setDatePickerVisible(false);
                      setCurrentDateField(null);
                    }}
                  />
                  {errors[field.name] && (
                    <Text style={styles.errorText}>
                      {errors[field.name].message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>
        );

      case 'file':
        return (
          <View style={styles.fieldContainer}>
            <Controller
              name={field.name}
              control={control}
              defaultValue={null}
              rules={{
                validate: async value => await runValidations(field, value),
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <Text style={styles.label}>{field.label}</Text>
                  <TouchableOpacity
                    style={[
                      buttonStyles,
                      isFieldDisabled(field.name) && styles.disabledButton,
                    ]}
                    disabled={isFieldDisabled(field.name) || buttonLoading}
                    onPress={async () => {
                      try {
                        const hasPermission = await requestStoragePermission();
                        if (!hasPermission) return;

                        const response = await launchImageLibrary({
                          mediaType: 'photo',
                          includeBase64: false,
                          maxHeight: 2000,
                          maxWidth: 2000,
                        });

                        if (response.didCancel) {
                          console.log('User cancelled image picker');
                        } else if (response.errorCode) {
                          Alert.alert(
                            'Error',
                            `Image picker error: ${response.errorMessage}`,
                          );
                        } else if (response.assets && response.assets[0]) {
                          onChange(response.assets[0]);
                        } else {
                          Alert.alert('Error', 'No image selected.');
                        }
                      } catch (error) {
                        console.error('Image picker error:', error);
                        Alert.alert('Error', 'Failed to open image picker.');
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>Choose File</Text>
                  </TouchableOpacity>
                  {value && (
                    <TouchableOpacity
                      onPress={() => {
                        if (typeof value === 'string') {
                          console.log('Open file:', value);
                        } else {
                          console.log('Preview file:', value.uri);
                        }
                      }}
                    >
                      <Text style={styles.linkText}>
                        {typeof value === 'string'
                          ? 'View file'
                          : value.fileName || 'View file'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {errors[field.name] && (
                    <Text style={styles.errorText}>
                      {errors[field.name].message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>
        );

      case 'select':
        return (
          <View style={styles.fieldContainer}>
            <Controller
              name={field.name}
              control={control}
              defaultValue={field.options?.[0]?.value || ''}
              rules={{
                validate: async value =>
                  await runValidations(field, value, getValues()),
              }}
              render={({ field: { onChange, value } }) => {
                let options = [];
                if (field.optionsType === 'dependent' && field.dependentOn) {
                  const parentValue = watch(field.dependentOn);
                  options =
                    field.dependentOptions &&
                    field.dependentOptions[parentValue]
                      ? field.dependentOptions[parentValue]
                      : [];
                } else {
                  options = field.options || [];
                }
                if (value && !options.some(opt => opt.value === value)) {
                  options = [...options, { value, label: value }];
                }

                return (
                  <>
                    <Text style={styles.label}>{field.label}</Text>
                    <View
                      style={[
                        styles.pickerContainer,
                        isFieldDisabled(field.name) && styles.disabledInput,
                        errors[field.name] && { borderColor: '#ef4444' },
                      ]}
                    >
                      <Picker
                        selectedValue={value || ''}
                        onValueChange={val => {
                          onChange(val);
                          const districtFields = [
                            'district',
                            'presentdistrict',
                            'permanentdistrict',
                          ];
                          const normalizedFieldName = field.name
                            .toLowerCase()
                            .replace(/\s/g, '');
                          if (districtFields.includes(normalizedFieldName)) {
                            handleDistrictChange(sectionIndex, field, val);
                          }
                          if (field.name === 'BankName') {
                            setBankNameBlurred(true);
                          }
                        }}
                        enabled={!isFieldDisabled(field.name)}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                      >
                        {options.map(option => (
                          <Picker.Item
                            key={option.value}
                            label={option.label}
                            value={option.value}
                          />
                        ))}
                      </Picker>
                    </View>
                    {errors[field.name] && (
                      <Text style={styles.errorText}>
                        {errors[field.name].message}
                      </Text>
                    )}
                    {field.additionalFields &&
                      field.additionalFields[value] && (
                        <View style={styles.nestedFields}>
                          {field.additionalFields[value].map(
                            additionalField => (
                              <View key={additionalField.id}>
                                {renderField(
                                  {
                                    ...additionalField,
                                    name:
                                      additionalField.name ||
                                      `${field.name}_${additionalField.id}`,
                                  },
                                  sectionIndex,
                                )}
                              </View>
                            ),
                          )}
                        </View>
                      )}
                  </>
                );
              }}
            />
          </View>
        );

      case 'enclosure':
        const isDependent = field.isDependentEnclosure;
        const parentValue = isDependent ? watch(field.dependentField) : null;
        if (
          isDependent &&
          (!parentValue || !field.dependentValues.includes(parentValue))
        ) {
          return null;
        }
        const selectValue =
          getValues(`${field.name}_select`) ||
          initialData?.[field.name]?.selected ||
          '';
        const options = field.options || [];
        if (selectValue && !options.some(opt => opt.value === selectValue)) {
          options.push({ value: selectValue, label: selectValue });
        }

        return (
          <View style={styles.fieldContainer}>
            <Controller
              name={`${field.name}_select`}
              control={control}
              defaultValue={selectValue}
              rules={{
                validate: async value =>
                  await runValidations(field, value, getValues()),
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <Text style={styles.label}>{field.label}</Text>
                  <View
                    style={[
                      styles.pickerContainer,
                      isFieldDisabled(`${field.name}_select`) &&
                        styles.disabledInput,
                      errors[`${field.name}_select`] && {
                        borderColor: '#ef4444',
                      },
                    ]}
                  >
                    <Picker
                      selectedValue={value || ''}
                      onValueChange={onChange}
                      enabled={!isFieldDisabled(`${field.name}_select`)}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      {options.map(option => (
                        <Picker.Item
                          key={option.value}
                          label={option.label}
                          value={option.value}
                        />
                      ))}
                    </Picker>
                  </View>
                  {errors[`${field.name}_select`] && (
                    <Text style={styles.errorText}>
                      {errors[`${field.name}_select`].message}
                    </Text>
                  )}
                </>
              )}
            />
            <Controller
              name={`${field.name}_file`}
              control={control}
              defaultValue={initialData?.[field.name]?.file || null}
              rules={{
                validate: async value =>
                  await runValidations(field, value, getValues()),
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    style={[
                      buttonStyles,
                      (!watch(`${field.name}_select`) ||
                        isFieldDisabled(`${field.name}_file`) ||
                        buttonLoading) &&
                        styles.disabledButton,
                    ]}
                    disabled={
                      !watch(`${field.name}_select`) ||
                      isFieldDisabled(`${field.name}_file`) ||
                      buttonLoading
                    }
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
                    <Text style={styles.buttonText}>Upload File</Text>
                  </TouchableOpacity>
                  {value && (
                    <TouchableOpacity
                      onPress={() => {
                        if (typeof value === 'string') {
                          console.log('Open file:', value);
                        } else {
                          console.log('Preview file:', value.uri);
                        }
                      }}
                    >
                      <Text style={styles.linkText}>
                        {typeof value === 'string'
                          ? 'View file'
                          : value.fileName || 'View file'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {errors[`${field.name}_file`] && (
                    <Text style={styles.errorText}>
                      {errors[`${field.name}_file`].message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const CustomStepIcon = ({ active, completed, iconName }) => (
    <View
      style={[
        styles.stepIcon,
        {
          backgroundColor: active || completed ? '#dbeafe' : '#f3f4f6',
          borderColor: active ? theme.main : '#d1d5db',
        },
      ]}
    >
      <Ionicons
        name={iconName}
        size={24}
        color={active || completed ? theme.main : '#6b7280'}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.main} />
        <Text style={styles.loadingText}>Loading form...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.formContainer}>
        {formSections.length > 0 && (
          <View style={styles.stepperContainer}>
            {formSections.map((section, index) => (
              <View key={section.id} style={styles.step}>
                <CustomStepIcon
                  active={currentStep === index}
                  completed={currentStep > index}
                  iconName={sectionIconMap[section.section] || 'help-outline'}
                />
                <Text
                  style={[
                    styles.stepLabel,
                    currentStep === index && { color: theme.main },
                  ]}
                >
                  {section.section}
                </Text>
              </View>
            ))}
          </View>
        )}

        {formSections.length > 0 ? (
          <>
            {formSections.map((section, index) => {
              if (index !== currentStep) return null;
              return (
                <View key={section.id} style={styles.sectionContainer}>
                  {section.section === 'Permanent Address Details' && (
                    <CheckBox
                      title="Same As Present Address"
                      checked={isCopyAddressChecked}
                      onPress={() => {
                        setIsCopyAddressChecked(!isCopyAddressChecked);
                        handleCopyAddress(!isCopyAddressChecked, index);
                      }}
                      containerStyle={styles.checkboxContainer}
                      textStyle={styles.checkboxText}
                    />
                  )}
                  {section.section === 'Applicant Details' &&
                    applicantImagePreview && (
                      <Image
                        source={{ uri: applicantImagePreview }}
                        style={styles.applicantImage}
                      />
                    )}
                  <View
                    style={[
                      styles.fieldsContainer,
                      section.section === 'Documents' &&
                        styles.documentsContainer,
                    ]}
                  >
                    {section.fields.map(field => (
                      <View key={field.id} style={styles.fieldWrapper}>
                        {renderField(field, index)}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}

            <View style={styles.buttonContainer}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    buttonLoading && styles.disabledButton,
                  ]}
                  disabled={buttonLoading}
                  onPress={handlePrev}
                >
                  <Text style={styles.buttonText}>Previous</Text>
                </TouchableOpacity>
              )}
              {currentStep < formSections.length - 1 && (
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    buttonLoading && styles.disabledButton,
                  ]}
                  disabled={buttonLoading}
                  onPress={handleNext}
                >
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              )}
              {currentStep === formSections.length - 1 && (
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    buttonLoading && styles.disabledButton,
                  ]}
                  disabled={buttonLoading}
                  onPress={handleSubmit(data => onSubmit(data, 'submit'))}
                >
                  <Text style={styles.buttonText}>
                    {buttonLoading ? 'Submitting...' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {currentStep !== formSections.length - 1 && (
              <View style={styles.saveButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    buttonLoading && styles.disabledButton,
                  ]}
                  disabled={buttonLoading}
                  onPress={handleSubmit(data => onSubmit(data, 'save'))}
                >
                  <Text style={styles.buttonText}>
                    {buttonLoading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>No form configuration available.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  step: {
    alignItems: 'center',
    flex: 1,
    minWidth: 80,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginBottom: 16,
  },
  checkboxText: {
    fontSize: 16,
    color: '#1f2937',
  },
  applicantImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
  fieldsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  documentsContainer: {
    flexDirection: 'column',
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 12,
  },
  fieldWrapper: {
    width: '100%',
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    height: 60,
    justifyContent: 'center',
  },
  picker: {
    height: 60,
    color: '#1f2937',
  },
  pickerItem: {
    fontSize: 16,
    color: '#1f2937',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  saveButtonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#D2946A',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '45%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  linkText: {
    fontSize: 14,
    color: '#D2946A',
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    padding: 16,
  },
});

export default DynamicStepForm;
