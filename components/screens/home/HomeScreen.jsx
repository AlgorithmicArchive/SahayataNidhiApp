import React, { useContext } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { AppContext } from '../../../contexts/AppContext';

export default function HomeScreen() {
  const { theme } = useContext(AppContext);

  return (
    <ScrollView style={{ backgroundColor: theme.background.default }}>
      {/* Section 1 */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTextContainer}>
          <Text style={[styles.title, { color: theme.text.primary }]}>
            Facilitating Financial Assistance for Every Citizen
          </Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
            Submit your application for welfare schemes through a transparent
            and structured process. Each form is carefully evaluated and
            processed across designated phases before approval and sanction.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.main }]}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
        <Image
          source={require('../../../assets/images/socialwelfare.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Section 2 - Services */}
      <View
        style={[
          styles.sectionContainer,
          { backgroundColor: theme.background.paper },
        ]}
      >
        <Text style={[styles.servicesTitle, { color: theme.text.primary }]}>
          Services Provided
        </Text>
        <Text style={[styles.servicesDesc, { color: theme.text.secondary }]}>
          Our platform offers a wide array of government-backed financial
          assistance services designed to support economically and socially
          vulnerable citizens. From scheme-specific applications to transparent
          processing and sanctioning, each service is aimed at promoting
          inclusive development and ensuring timely support reaches those who
          need it most.
        </Text>

        <View style={styles.cardContainer}>
          <ServiceCard
            title="Ladli Beti"
            description="Aimed at promoting the education and well-being of the girl child, this scheme provides financial support to families for the upbringing and education of daughters. Eligible beneficiaries receive structured monetary assistance at different stages of the child's development to reduce gender disparity and encourage empowerment."
            theme={theme}
          />
          <ServiceCard
            title="Marriage Assistance"
            description="This scheme extends financial assistance to economically disadvantaged women at the time of their marriage. It is intended to support families facing financial constraints, ensuring dignity and reducing the economic burden associated with marriage expenses."
            theme={theme}
          />
          <ServiceCard
            title="JKISSS Pension"
            description="This comprehensive pension program offers financial security to senior citizens, persons with disabilities, women in distress, and transgender individuals. Monthly pension support ensures dignity, inclusion, and sustenance for those in need, contributing to social justice and welfare."
            theme={theme}
          />
        </View>
      </View>

      {/* Section 3 - Contact Us */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.contactTitle, { color: theme.text.primary }]}>
          Contact Us
        </Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
          We are here to assist you with any queries regarding welfare
          schemes...
        </Text>

        <TextInput
          placeholder="Full Name"
          style={styles.input}
          placeholderTextColor={theme.text.secondary}
        />
        <TextInput
          placeholder="Email"
          style={styles.input}
          placeholderTextColor={theme.text.secondary}
        />
        <TextInput
          placeholder="Subject"
          style={styles.input}
          placeholderTextColor={theme.text.secondary}
        />
        <TextInput
          placeholder="Message"
          multiline
          numberOfLines={5}
          style={[styles.input, { height: 100 }]}
          placeholderTextColor={theme.text.secondary}
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.main }]}
        >
          <Text style={styles.buttonText}>Send Message</Text>
        </TouchableOpacity>

        <View style={styles.contactInfoContainer}>
          <Text style={[styles.contactLabel, { color: theme.text.primary }]}>
            Call Us
          </Text>
          <Text style={[styles.contactText, { color: theme.text.secondary }]}>
            91XXXXX9238
          </Text>

          <Text style={[styles.contactLabel, { color: theme.text.primary }]}>
            Email Us
          </Text>
          <Text style={[styles.contactText, { color: theme.text.secondary }]}>
            example@gmail.com
          </Text>

          <Text style={[styles.contactLabel, { color: theme.text.primary }]}>
            Address
          </Text>
          <Text style={[styles.contactText, { color: theme.text.secondary }]}>
            22, B. Baker Street
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const ServiceCard = ({ title, description, theme }) => (
  <View style={[styles.card, { backgroundColor: theme.main }]}>
    <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>{title}</Text>
    <Text style={[styles.cardDesc, { color: '#FFFFFF' }]}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  sectionContainer: {
    padding: 20,
  },
  sectionTextContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 20,
  },
  servicesTitle: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 10,
  },
  servicesDesc: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
  },
  cardContainer: {
    gap: 15,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 14,
  },
  contactTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  contactInfoContainer: {
    marginTop: 20,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactText: {
    fontSize: 14,
    marginBottom: 10,
  },
});
