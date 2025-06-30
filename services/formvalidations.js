// formvalidations.js

// Validation functions
import { API_URL } from '@env';
import { Platform } from 'react-native';

export function notEmpty(field, value) {
  if (value === '' || value == 'Please Select') {
    return 'This field is required.';
  }
  return true;
}

export function onlyAlphabets(field, value) {
  if (!/^[A-Za-z .']+$/.test(value)) {
    return "Please use letters (a-z, A-Z) and special characters (. and ') only.";
  }
  return true;
}

export function onlyDigits(field, value) {
  if (!/^\d+$/.test(value)) {
    return 'Please enter only digits.';
  }
  return true;
}

export function specificLength(field, value) {
  if (value.length !== field.maxLength) {
    return `This must be exactly ${field.maxLength} characters long.`;
  }
  return true;
}

export function isAgeGreaterThan(field, value, formData) {
  let maxLengthValue;

  // If maxLength is an object with a dependentOn key, get the dependent field's value.
  if (typeof field.maxLength === 'object' && field.maxLength.dependentOn) {
    // Use the dependentOn field id to look up its current value in formData.
    const dependentFieldId = field.maxLength.dependentOn; // e.g., "PensionType"
    const dependentValue = formData[dependentFieldId];
    if (!dependentValue) {
      return `Dependent field (${dependentFieldId}) value is missing.`;
    }
    maxLengthValue = field.maxLength[dependentValue];
    if (maxLengthValue === undefined) {
      return `No maximum length defined for option (${dependentValue}).`;
    }
  } else {
    maxLengthValue = field.maxLength;
  }
  const currentDate = new Date();
  const compareDate = new Date(
    currentDate.getFullYear() - maxLengthValue,
    currentDate.getMonth(),
    currentDate.getDate(),
  );
  const inputDate = new Date(value);
  if (inputDate >= compareDate) {
    return `Age should be greater than or equal to ${maxLengthValue}.`;
  }
  return true;
}

export function isEmailValid(field, value) {
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
    return 'Invalid Email Address.';
  }
  return true;
}

export function isDateWithinRange(field, value) {
  const dateOfMarriage = new Date(value);
  const currentDate = new Date();

  const minDate = new Date(currentDate);
  minDate.setMonth(currentDate.getMonth() + parseInt(field.minLength));

  const maxDate = new Date(currentDate);
  maxDate.setMonth(currentDate.getMonth() + parseInt(field.maxLength));

  if (dateOfMarriage < minDate || dateOfMarriage > maxDate) {
    return `The date should be between ${field.minLength} to ${field.maxLength} months from current date.`;
  }
  return true;
}

export async function duplicateAccountNumber(
  field,
  value,
  {},
  referenceNumber,
) {
  console.log(field, value);
  try {
    const res = await fetch(
      `${API_URL}/Base/IsDuplicateAccNo?accNo=${value}&applicationId=${referenceNumber}`,
    );
    const data = await res.json();
    if (data.status) {
      return 'Application with this account number already exists.';
    }
    return true;
  } catch (error) {
    console.error('Error in duplicateAccountNumber:', error);
    return 'Validation failed due to a server error.';
  }
}

export async function validateFile(field, value) {
  try {
    const formData = new FormData();

    if (field.accept.includes('.jpg')) formData.append('fileType', 'image');
    else if (field.accept.includes('.pdf')) formData.append('fileType', 'pdf');
    else return;

    const file = {
      uri: Platform.OS === 'ios' ? value.uri.replace('file://', '') : value.uri,
      type: value.type || 'image/jpeg', // Default to jpeg if missing
      name: value.name || 'image.jpg',
    };

    formData.append('file', file);

    const res = await fetch(API_URL + '/Base/Validate', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await res.json();
    console.log('Response validations', data);

    if (!data.isValid) {
      return data.errorMessage;
    }
    return true;
  } catch (error) {
    console.error('Error in validateFile:', error);
    return 'File validation failed due to a server error.';
  }
}

// Transformation Function

export function CapitalizeAlphabets(field, value) {
  return value.toUpperCase();
}

export async function tehsilForDistrict(field, districtValue) {
  if (!districtValue) return [];
  try {
    const response = await fetch(
      `${API_URL}/Base/GetTeshilForDistrict?districtId=${districtValue}`,
    );
    const data = await response.json();
    if (data.status && Array.isArray(data.tehsils)) {
      // Map the returned tehsils to the expected format
      return data.tehsils.map(tehsil => ({
        value: tehsil.tehsilId,
        label: tehsil.tehsilName,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error in tehsilForDistrict:', error);
    return [];
  }
}

export const runValidations = async (
  field,
  value,
  formData,
  referenceNumber,
) => {
  if (!Array.isArray(field.validationFunctions)) return true;

  for (const validationFn of field.validationFunctions) {
    const fun = ValidationFunctionsList[validationFn];
    if (typeof fun !== 'function') continue;

    try {
      let error = await fun(field, value || '', formData, referenceNumber);
      if (error !== true) return error;
    } catch (err) {
      return 'Validation failed due to an unexpected error.';
    }
  }

  return true;
};

export function formatKey(input) {
  if (!input) return input; // Check for empty or null input
  // Use Regex to insert space before each capital letter, except for the first one
  const result = input.replace(/(?<!^)([A-Z])/g, ' $1');
  return result;
}

// Mapping of Validation Functions

const ValidationFunctionsList = {
  notEmpty,
  onlyAlphabets,
  onlyDigits,
  specificLength,
  isAgeGreaterThan,
  isEmailValid,
  isDateWithinRange,
  duplicateAccountNumber,
  validateFile,
};

export const validationFunctionsList = [
  { id: 'notEmpty', label: 'Required' },
  { id: 'onlyAlphabets', label: 'Only Alphabets' },
  { id: 'onlyDigits', label: 'Only Digits' },
  { id: 'specificLength', label: 'Specific Length' },
  { id: 'isAgeGreaterThan', label: 'Age Limit' },
  { id: 'isEmailValid', label: 'Email Format' },
  { id: 'isDateWithinRange', label: 'Date Range' },
  { id: 'duplicateAccountNumber', label: 'Duplicate Account Number' },
  { id: 'validateFile', label: 'Validate File' },
];
