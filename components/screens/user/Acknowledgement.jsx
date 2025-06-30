import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { fetchAcknowledgement } from '../../../services/api'; // Adjust path

export default function Acknowledgement() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const route = useRoute();
  const { applicationId } = route.params || {};

  useEffect(() => {
    if (!applicationId) return;

    const getPdf = async () => {
      try {
        const { completePath } = await fetchAcknowledgement(applicationId);

        // Make sure the URL is accessible from the device
        const fixedUrl = completePath.replace('localhost', '192.168.1.5'); // Replace with your machine's IP
        setPdfUrl(completePath);
      } catch (err) {
        console.error('Error fetching PDF:', err);
      } finally {
        setLoading(false);
      }
    };

    getPdf();
  }, [applicationId]);

  const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
    pdfUrl,
  )}`;

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : pdfUrl ? (
        <WebView
          source={{ uri: googleDocsUrl }}
          style={styles.webview}
          useWebKit={true}
          startInLoadingState
          renderLoading={() => <ActivityIndicator size="large" color="#000" />}
        />
      ) : (
        <Text>Unable to load PDF.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
  },
  webview: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
});
