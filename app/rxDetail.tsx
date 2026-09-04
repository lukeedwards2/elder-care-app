// app/rxDetail.tsx

import React, {
  useCallback,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NavHeader from '../components/NavHeader';

type Medication = {
  name: string;
  purpose: string;
  frequency: string;
  strength: string;
  pharmacy: string;
  notes: string;
  rxNumber: string;
  image?: string;
};

export default function RxDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const isAddMode = params.mode === 'add';

  const editingIndex =
    !isAddMode && params.index !== undefined
      ? Number(params.index)
      : null;

  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [strength, setStrength] = useState('');
  const [pharmacy, setPharmacy] = useState('');
  const [rxNumber, setRxNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState('');

  /*
   * IMPORTANT:
   *
   * This runs EVERY TIME the screen becomes active.
   *
   * When adding:
   * completely clear the form.
   *
   * When editing:
   * reload the medication passed through route params.
   *
   * This prevents the previous medication from remaining
   * in the fields when Add Medication is opened again.
   */
  useFocusEffect(
    useCallback(() => {
      if (isAddMode) {
        setName('');
        setPurpose('');
        setFrequency('');
        setStrength('');
        setPharmacy('');
        setRxNumber('');
        setNotes('');
        setImage('');

        return;
      }

      setName(
        typeof params.name === 'string'
          ? params.name
          : ''
      );

      setPurpose(
        typeof params.purpose === 'string'
          ? params.purpose
          : ''
      );

      setFrequency(
        typeof params.frequency === 'string'
          ? params.frequency
          : ''
      );

      setStrength(
        typeof params.strength === 'string'
          ? params.strength
          : ''
      );

      setPharmacy(
        typeof params.pharmacy === 'string'
          ? params.pharmacy
          : ''
      );

      setRxNumber(
        typeof params.rxNumber === 'string'
          ? params.rxNumber
          : ''
      );

      setNotes(
        typeof params.notes === 'string'
          ? params.notes
          : ''
      );

      setImage(
        typeof params.image === 'string'
          ? params.image
          : ''
      );
    }, [
      isAddMode,
      params.name,
      params.purpose,
      params.frequency,
      params.strength,
      params.pharmacy,
      params.rxNumber,
      params.notes,
      params.image,
    ])
  );

  const medicationKey = (item: Medication) => {
    if (item.rxNumber?.trim()) {
      return `rx-${item.rxNumber
        .trim()
        .toLowerCase()}`;
    }

    return [
      item.name,
      item.strength,
      item.pharmacy,
    ]
      .join('|')
      .toLowerCase();
  };

  const handleCancel = () => {
    router.replace('/(tabs)/rx');
  };

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo Permission Needed',
          'Please allow photo access so you can attach a medication image.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.75,
        });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        'Unable to Select Photo',
        'Please try again.'
      );
    }
  };

  const handleSave = async () => {
    const cleanName = name.trim();

    if (!cleanName) {
      Alert.alert(
        'Medication Name Required',
        'Please enter the medication name before saving.'
      );
      return;
    }

    try {
      const stored =
        await AsyncStorage.getItem('stored_rx');

      const medications: Medication[] = stored
        ? JSON.parse(stored)
        : [];

      const oldMedication =
        editingIndex !== null
          ? medications[editingIndex]
          : null;

      const updatedMedication: Medication = {
        name: cleanName,
        purpose: purpose.trim(),
        frequency: frequency.trim(),
        strength: strength.trim(),
        pharmacy: pharmacy.trim(),
        rxNumber: rxNumber.trim(),
        notes: notes.trim(),
        image: image || '',
      };

      if (
        editingIndex !== null &&
        medications[editingIndex]
      ) {
        medications[editingIndex] =
          updatedMedication;
      } else {
        medications.push(updatedMedication);
      }

      await AsyncStorage.setItem(
        'stored_rx',
        JSON.stringify(medications)
      );

      /*
       * If the medication is already selected
       * for the Emergency screen, update that
       * copy when the medication is edited.
       */
      if (
        oldMedication &&
        editingIndex !== null
      ) {
        const storedAmbulance =
          await AsyncStorage.getItem(
            'ambulance_rx'
          );

        if (storedAmbulance) {
          const ambulanceRx: Medication[] =
            JSON.parse(storedAmbulance);

          const oldKey =
            medicationKey(oldMedication);

          const updatedAmbulance =
            ambulanceRx.map((item) =>
              medicationKey(item) === oldKey
                ? updatedMedication
                : item
            );

          await AsyncStorage.setItem(
            'ambulance_rx',
            JSON.stringify(updatedAmbulance)
          );
        }
      }

      router.replace('/(tabs)/rx');
    } catch (error) {
      console.log(
        'Failed to save medication:',
        error
      );

      Alert.alert(
        'Unable to Save',
        'The medication could not be saved. Please try again.'
      );
    }
  };

  const deleteMedication = async () => {
    if (editingIndex === null) {
      return;
    }

    try {
      const stored =
        await AsyncStorage.getItem('stored_rx');

      if (!stored) {
        router.replace('/(tabs)/rx');
        return;
      }

      const medications: Medication[] =
        JSON.parse(stored);

      const medicationBeingDeleted =
        medications[editingIndex];

      medications.splice(editingIndex, 1);

      await AsyncStorage.setItem(
        'stored_rx',
        JSON.stringify(medications)
      );

      /*
       * If this medication was selected
       * for Emergency, remove it there too.
       */
      if (medicationBeingDeleted) {
        const storedAmbulance =
          await AsyncStorage.getItem(
            'ambulance_rx'
          );

        if (storedAmbulance) {
          const ambulanceRx: Medication[] =
            JSON.parse(storedAmbulance);

          const deletedKey =
            medicationKey(
              medicationBeingDeleted
            );

          const updatedAmbulance =
            ambulanceRx.filter(
              (item) =>
                medicationKey(item) !==
                deletedKey
            );

          await AsyncStorage.setItem(
            'ambulance_rx',
            JSON.stringify(
              updatedAmbulance
            )
          );
        }
      }

      router.replace('/(tabs)/rx');
    } catch (error) {
      Alert.alert(
        'Unable to Delete',
        'The medication could not be deleted. Please try again.'
      );
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Medication?',
      'This will permanently remove this medication.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteMedication,
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
      keyboardVerticalOffset={0}
    >
      <NavHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={25}
            color="#1976D2"
          />

          <Text style={styles.cancelText}>
            Cancel
          </Text>
        </TouchableOpacity>

        <View style={styles.headingRow}>
          <View
            style={
              styles.headingIconContainer
            }
          >
            <Ionicons
              name={
                isAddMode
                  ? 'add-circle-outline'
                  : 'create-outline'
              }
              size={42}
              color="#1976D2"
            />
          </View>

          <View style={styles.headingText}>
            <Text style={styles.pageTitle}>
              {isAddMode
                ? 'Add Medication'
                : 'Medication Details'}
            </Text>

            <Text style={styles.pageSubtitle}>
              {isAddMode
                ? 'Add prescription details for the care team.'
                : 'Update this medication information.'}
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>
            Medication name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Example: Lisinopril"
            placeholderTextColor="#AEB7C2"
            autoCapitalize="words"
          />

          <Text style={styles.label}>
            Purpose
          </Text>

          <TextInput
            value={purpose}
            onChangeText={setPurpose}
            style={styles.input}
            placeholder="Example: Blood pressure"
            placeholderTextColor="#AEB7C2"
          />

          <Text style={styles.label}>
            Frequency
          </Text>

          <TextInput
            value={frequency}
            onChangeText={setFrequency}
            style={styles.input}
            placeholder="Example: Once daily"
            placeholderTextColor="#AEB7C2"
          />

          <Text style={styles.label}>
            Strength / dosage
          </Text>

          <TextInput
            value={strength}
            onChangeText={setStrength}
            style={styles.input}
            placeholder="Example: 10 mg"
            placeholderTextColor="#AEB7C2"
          />

          <Text style={styles.label}>
            Pharmacy
          </Text>

          <TextInput
            value={pharmacy}
            onChangeText={setPharmacy}
            style={styles.input}
            placeholder="Example: CVS Pharmacy"
            placeholderTextColor="#AEB7C2"
            autoCapitalize="words"
          />

          <Text style={styles.label}>
            Rx number
          </Text>

          <TextInput
            value={rxNumber}
            onChangeText={setRxNumber}
            style={styles.input}
            placeholder="Optional prescription number"
            placeholderTextColor="#AEB7C2"
          />

          <Text style={styles.label}>
            Notes
          </Text>

          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[
              styles.input,
              styles.notesInput,
            ]}
            placeholder="Special instructions, refill information, or other notes"
            placeholderTextColor="#AEB7C2"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>
            Medication image
          </Text>

          {image ? (
            <>
              <Image
                source={{ uri: image }}
                style={styles.previewImage}
              />

              <TouchableOpacity
                style={styles.imageSelector}
                onPress={pickImage}
                activeOpacity={0.75}
              >
                <View
                  style={
                    styles.imageSelectorIcon
                  }
                >
                  <Ionicons
                    name="camera-outline"
                    size={25}
                    color="#1976D2"
                  />
                </View>

                <View
                  style={
                    styles.imageSelectorText
                  }
                >
                  <Text
                    style={
                      styles.imageSelectorTitle
                    }
                  >
                    Change Medication Image
                  </Text>

                  <Text
                    style={
                      styles.imageSelectorSubtitle
                    }
                  >
                    Choose a different photo
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color="#A7B0BB"
                />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.imageSelector}
              onPress={pickImage}
              activeOpacity={0.75}
            >
              <View
                style={
                  styles.imageSelectorIcon
                }
              >
                <Ionicons
                  name="camera-outline"
                  size={25}
                  color="#1976D2"
                />
              </View>

              <View
                style={
                  styles.imageSelectorText
                }
              >
                <Text
                  style={
                    styles.imageSelectorTitle
                  }
                >
                  Add Medication Image
                </Text>

                <Text
                  style={
                    styles.imageSelectorSubtitle
                  }
                >
                  Optional, but useful for identification
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={24}
                color="#A7B0BB"
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color="#fff"
            />

            <Text
              style={styles.saveButtonText}
            >
              {isAddMode
                ? 'Save Medication'
                : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          {!isAddMode && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={confirmDelete}
              activeOpacity={0.8}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color="#C83A31"
              />

              <Text
                style={
                  styles.deleteButtonText
                }
              >
                Delete Medication
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },

  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 18,
  },

  cancelText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1976D2',
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  headingIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  headingText: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#17212D',
  },

  pageSubtitle: {
    marginTop: 3,
    fontSize: 15,
    lineHeight: 21,
    color: '#7A8797',
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCE3EA',
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#455465',
    marginBottom: 7,
    marginTop: 4,
  },

  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#D4DCE5',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#17212D',
    backgroundColor: '#FBFCFD',
    marginBottom: 16,
  },

  notesInput: {
    minHeight: 110,
  },

  previewImage: {
    width: '100%',
    height: 190,
    borderRadius: 17,
    resizeMode: 'cover',
    marginBottom: 12,
  },

  imageSelector: {
    minHeight: 74,
    borderWidth: 1,
    borderColor: '#D4DCE5',
    borderRadius: 16,
    backgroundColor: '#FBFCFD',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 18,
  },

  imageSelectorIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageSelectorText: {
    flex: 1,
    paddingHorizontal: 12,
  },

  imageSelectorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#23303E',
  },

  imageSelectorSubtitle: {
    fontSize: 13,
    color: '#8A96A5',
    marginTop: 2,
  },

  saveButton: {
    minHeight: 58,
    backgroundColor: '#1976D2',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  saveButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },

  deleteButton: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0C6C2',
    backgroundColor: '#FFF5F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },

  deleteButtonText: {
    color: '#C83A31',
    fontWeight: '800',
    fontSize: 16,
  },
});
