import { View, Text } from 'react-native';
import React from 'react';
import { useRoute } from '@react-navigation/native';
import DynamicStepForm from '../../form/DynamicStepForm';

export default function Form() {
  const route = useRoute();
  const { serviceId, referenceNumber } = route.params || {};
  console.log(
    'Form Screen - serviceId:',
    serviceId,
    'referenceNumber:',
    referenceNumber,
  );

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f9fafb' }}>
      <DynamicStepForm
        mode={referenceNumber ? 'incomplete' : 'new'} // Set mode based on referenceNumber
        serviceId={serviceId} // Pass serviceId explicitly
        referenceNumber={referenceNumber} // Pass referenceNumber if available
      />
    </View>
  );
}
