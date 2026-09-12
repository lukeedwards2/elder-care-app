// app/contactUs.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import NavHeader from '@/components/NavHeader';

const SUPPORT_EMAIL = 'carekeeperhub@gmail.com';
const MAX_MESSAGE_LENGTH = 1200;

export default function ContactUs() {
  const router = useRouter();
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      Alert.alert(
        'Enter a Message',
        'Please enter a message before continuing.'
      );
      return;
    }

    const subject = encodeURIComponent('CareKeeperHub Support');
    const body = encodeURIComponent(trimmedMessage);

    const mailUrl =
      `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailUrl);

      if (!canOpen) {
        Alert.alert(
          'Email App Not Available',
          `Please email us directly at ${SUPPORT_EMAIL}.`
        );
        return;
      }

      await Linking.openURL(mailUrl);
    } catch (error) {
      console.warn('Unable to open email app:', error);

      Alert.alert(
        'Unable to Open Email',
        `Please email us directly at ${SUPPORT_EMAIL}.`
      );
    }
  };

  return (
    <View style={styles.container}>
      <NavHeader />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headingContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/(tabs)/profile')}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color="#1976D2"
              />

              <Text style={styles.backText}>
                Account
              </Text>
            </TouchableOpacity>

            <Text style={styles.heading}>
              Contact Us
            </Text>

            <Text style={styles.subheading}>
              Have a question, suggestion, or need help with CareKeeperHub?
            </Text>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="mail-outline"
                size={30}
                color="#1976D2"
              />
            </View>

            <Text style={styles.cardTitle}>
              We’re Here to Help
            </Text>

            <Text style={styles.cardDescription}>
              Send us a message and your email app will open with everything
              ready to send to the CareKeeperHub team.
            </Text>
          </View>

          <View style={styles.messageCard}>
            <Text style={styles.sectionTitle}>
              Your Message
            </Text>

            <Text style={styles.inputLabel}>
              How can we help?
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Type your message here..."
              placeholderTextColor="#9AA4AE"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={MAX_MESSAGE_LENGTH}
              textAlignVertical="top"
              autoCorrect
            />

            <Text style={styles.characterCount}>
              {message.length} / {MAX_MESSAGE_LENGTH}
            </Text>

            <TouchableOpacity
              style={[
                styles.sendButton,
                !message.trim() && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Ionicons
                name="send-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.sendButtonText}>
                Send Message
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.directContact}>
            <Text style={styles.directContactTitle}>
              Prefer to email us directly?
            </Text>

            <TouchableOpacity
              style={styles.emailRow}
              onPress={() =>
                Linking.openURL(`mailto:${SUPPORT_EMAIL}`)
              }
            >
              <Ionicons
                name="mail-outline"
                size={19}
                color="#1976D2"
              />

              <Text style={styles.emailText}>
                {SUPPORT_EMAIL}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

  headingContainer: {
    paddingTop: 18,
    paddingBottom: 16,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },

  backText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1976D2',
    marginLeft: 2,
  },

  heading: {
    fontSize: 28,
    fontWeight: '600',
    color: '#20252B',
    marginBottom: 5,
  },

  subheading: {
    fontSize: 15,
    lineHeight: 21,
    color: '#66727D',
  },

  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#242A30',
    marginBottom: 7,
  },

  cardDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#66727D',
    textAlign: 'center',
  },

  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#242A30',
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5E6973',
    marginBottom: 7,
  },

  input: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#D6DEE5',
    borderRadius: 14,
    backgroundColor: '#FAFCFE',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    lineHeight: 22,
    color: '#242A30',
  },

  characterCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: '#9AA4AE',
    marginTop: 6,
  },

  sendButton: {
    minHeight: 52,
    backgroundColor: '#1976D2',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  disabledButton: {
    opacity: 0.55,
  },

  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  directContact: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  directContactTitle: {
    fontSize: 13,
    color: '#77828C',
    marginBottom: 7,
  },

  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emailText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976D2',
    marginLeft: 6,
  },
});
