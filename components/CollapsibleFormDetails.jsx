import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const CollapsibleFormDetails = ({
  formDetails,
  formatKey = key => key,
  detailsOpen,
  setDetailsOpen,
  onViewPdf,
  theme,
}) => {
  const sections = Array.isArray(formDetails)
    ? formDetails
    : Object.entries(formDetails).map(([key, value]) => ({ [key]: value }));

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setDetailsOpen(!detailsOpen)}
      >
        <Text
          style={[styles.toggleButtonText, { color: theme?.text || '#000' }]}
        >
          {detailsOpen ? 'Collapse Details' : 'Expand Details'}
        </Text>
        <Icon
          name={detailsOpen ? 'expand-less' : 'expand-more'}
          size={24}
          color={theme?.text || '#000'}
        />
      </TouchableOpacity>

      {detailsOpen && (
        <ScrollView style={styles.detailsContainer} nestedScrollEnabled>
          {sections.map((section, sectionIndex) => {
            const sectionName = Object.keys(section)[0];
            const fields = section[sectionName];

            return (
              <View key={sectionIndex} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {formatKey(sectionName)}
                </Text>
                {Array.isArray(fields) &&
                  fields.map((field, index) => {
                    const {
                      label,
                      name,
                      value,
                      File,
                      Enclosure,
                      additionalFields,
                    } = field;
                    const displayLabel = label || name;

                    return (
                      <View key={index} style={styles.detailItem}>
                        <Text style={styles.detailLabel}>{displayLabel}</Text>

                        {File && File.startsWith('http') ? (
                          /\.(jpg|jpeg|png|gif)$/i.test(File) ? (
                            <Image
                              source={{ uri: File }}
                              style={styles.image}
                              resizeMode="cover"
                            />
                          ) : (
                            <TouchableOpacity onPress={() => onViewPdf(File)}>
                              <Text
                                style={[
                                  styles.link,
                                  { color: theme?.main || 'blue' },
                                ]}
                              >
                                View Document
                              </Text>
                            </TouchableOpacity>
                          )
                        ) : (
                          <Text style={styles.detailValue}>
                            {value ? value.toString() : '--'}
                          </Text>
                        )}

                        {additionalFields &&
                          Array.isArray(additionalFields) &&
                          additionalFields.map((nested, nestedIndex) => (
                            <View key={nestedIndex} style={styles.nestedField}>
                              <Text style={styles.nestedLabel}>
                                {nested.label || nested.name}
                              </Text>
                              <Text style={styles.nestedValue}>
                                {nested.value ? nested.value.toString() : '--'}
                              </Text>
                            </View>
                          ))}
                      </View>
                    );
                  })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    maxHeight: 500,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  link: {
    fontSize: 14,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginTop: 6,
  },
  nestedField: {
    marginTop: 6,
    paddingLeft: 10,
  },
  nestedLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  nestedValue: {
    fontSize: 13,
    color: '#333',
  },
});
