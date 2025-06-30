import { API_URL } from '@env';
import axiosInstance from './axiosconfig';

export async function Login(formData) {
  try {
    const response = await fetch(`${API_URL}/Home/Login`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function Validate(data) {
  console.log(
    'Request URL:',
    `${axiosInstance.defaults.baseURL}/Home/Verification`,
  );
  try {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }
    const response = await axiosInstance.post('/Home/Verification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Validation failed - Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error('Validation failed - No response:', error.request);
    } else {
      console.error('Validation error - Setup:', error.message);
    }
    console.error('Full error:', error);
    throw error;
  }
}

export async function GetServiceContent(ServiceId) {
  try {
    const response = await axiosInstance.get(
      API_URL + '/User/GetServiceContent',
      {
        params: { ServiceId },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error getting service content:', error);
    throw error;
  }
}

export async function fetchFormDetails(applicationId) {
  const response = await axiosInstance.get(API_URL + '/User/GetFormDetails', {
    params: { applicationId: applicationId },
  });
  return {
    formDetails: response.data.formDetails,
    additionalDetails: response.data.additionalDetails,
  };
}

export async function fetchAcknowledgement(applicationId) {
  try {
    const response = await axiosInstance.get(
      API_URL + '/User/GetAcknowledgement',
      {
        params: { ApplicationId: applicationId },
      },
    );
    console.log('RESPONSE', response.data);
    const { fullPath } = response.data;
    console.log(fullPath);

    // Ensure that the path includes the protocol
    const completePath = fullPath.startsWith('http')
      ? fullPath
      : `http://10.148.54.60:5004/${fullPath}`;
    console.log('Complete PDF Path:', completePath);
    return { fullPath, completePath };
  } catch (error) {
    console.error('Error fetching PDF path:', error);
  }
}

export const fetchServiceList = async setServices => {
  try {
    const response = await axiosInstance.get(
      API_URL + '/Officer/GetServiceList',
    );
    const serviceList = response.data.serviceList.map(item => ({
      label: item.serviceName,
      value: item.serviceId,
    }));
    setServices(serviceList);
    console.log('Service List', serviceList);
  } catch (error) {
    console.error('Failed to fetch service list:', error);
  }
};

export async function fetchUserDetail(
  applicationId,
  setFormDetails,
  setActionForm,
) {
  const response = await axiosInstance.get(
    API_URL + '/Officer/GetUserDetails',
    {
      params: { applicationId: applicationId },
    },
  );
  console.log('Response formdetails', response.data);

  setFormDetails(response.data.list);
  setActionForm(response.data.currentOfficerDetails.actionForm);
}

export async function fetchCertificateDetails() {
  try {
    const response = await axiosInstance.get(
      API_URL + '/Officer/GetCertificateDetails',
    );
    console.log('fetchCertificateDetails response:', response.data); // Debug
    if (!response.data.success || !response.data.certificateDetails) {
      throw new Error('Failed to fetch certificate details.');
    }
    return response.data.certificateDetails;
  } catch (error) {
    console.error('Error fetching certificate details:', error);
    return null;
  }
}
