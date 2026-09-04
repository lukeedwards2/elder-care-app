import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NavHeader from '../components/NavHeader';

type FormState = {
  height: string;
  weight: string;
  hospital: string;
  practice: string;
  allergiesToMeds: string;
  allergies: string;
  dnr: boolean;
  epilepsy: boolean;
  bloodThinners: string;
  diabetes: string;
  insuranceFront: string;
  insuranceBack: string;
};

const EMPTY_FORM: FormState = {
  height: '',
  weight: '',
  hospital: '',
  practice: '',
  allergiesToMeds: '',
  allergies: '',
  dnr: false,
  epilepsy: false,
  bloodThinners: '',
  diabetes: '',
  insuranceFront: '',
  insuranceBack: '',
};

export default function AmbulanceForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  const isEditing = params.mode === 'edit';

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      loadExistingInfo();
    } else {
      setForm(EMPTY_FORM);
      setLoading(false);
    }
  }, [isEditing]);

  const loadExistingInfo = async () => {
    try {
      const saved = await AsyncStorage.getItem('ambulance_info');

      if (saved) {
        const parsed = JSON.parse(saved);

        setForm({
          height: parsed.height || '',
          weight: parsed.weight || '',
          hospital: parsed.hospital || '',
          practice: parsed.practice || '',

          // Supports the corrected property and any older saved version.
          allergiesToMeds:
            parsed.allergiesToMeds ||
            parsed.allergicMeds ||
            '',

          allergies: parsed.allergies || '',
          dnr: Boolean(parsed.dnr),
          epilepsy: Boolean(parsed.epilepsy),
          bloodThinners: parsed.bloodThinners || '',
          diabetes: parsed.diabetes || '',
          insuranceFront: parsed.insuranceFront || '',
          insuranceBack: parsed.insuranceBack || '',
        });
      }
    } catch (error) {
      console.log('Failed to load emergency info:', error);
      Alert.alert(
        'Unable to Load',
        'The saved emergency information could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    key: keyof FormState,
    value: string | boolean
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleCancel = () => {
    router.replace('/(tabs)/ambulance');
  };

  const pickImage = async (
    key: 'insuranceFront' | 'insuranceBack'
  ) => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo Permission Needed',
          'Please allow photo access so you can attach an insurance card image.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });

      if (!result.canceled && result.assets?.length) {
        handleChange(key, result.assets[0].uri);
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert(
        'Unable to Add Image',
        'The insurance card image could not be selected.'
      );
    }
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(
        'ambulance_info',
        JSON.stringify(form)
      );

      router.replace('/(tabs)/ambulance');
    } catch (error) {
      console.log('Failed to save emergency information:', error);

      Alert.alert(
        'Unable to Save',
        'Your emergency information could not be saved. Please try again.'
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <NavHeader />

        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Loading emergency information...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <NavHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.75}
        >
          <Ionicons
            name="chevron-back"
            size={27}
            color="#1976D2"
          />
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.headingRow}>
          <View style={styles.headingIcon}>
            <Ionicons
              name={
                isEditing
                  ? 'create-outline'
                  : 'add-circle-outline'
              }
              size={38}
              color="#1976D2"
            />
          </View>

          <View style={styles.headingTextContainer}>
            <Text style={styles.title}>
              {isEditing
                ? 'Edit Emergency Info'
                : 'Add Emergency Info'}
            </Text>

            <Text style={styles.subtitle}>
              Keep important medical details ready when they are needed most.
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>
            Basic information
          </Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Height</Text>
              <TextInput
                style={styles.input}
                placeholder="Example: 5' 6&quot;"
                placeholderTextColor="#A8B2BF"
                value={form.height}
                onChangeText={(text) =>
                  handleChange('height', text)
                }
              />
            </View>

            <View style={styles.rowGap} />

            <View style={styles.halfField}>
              <Text style={styles.label}>Weight</Text>
              <TextInput
                style={styles.input}
                placeholder="Example: 145 lbs"
                placeholderTextColor="#A8B2BF"
                value={form.weight}
                onChangeText={(text) =>
                  handleChange('weight', text)
                }
              />
            </View>
          </View>

          <Field
            label="Preferred hospital"
            placeholder="Hospital name"
            value={form.hospital}
            onChangeText={(text) =>
              handleChange('hospital', text)
            }
          />

          <Field
            label="Primary care / family practice"
            placeholder="Doctor or practice name"
            value={form.practice}
            onChangeText={(text) =>
              handleChange('practice', text)
            }
          />

          <Text style={styles.sectionLabel}>
            Allergies & conditions
          </Text>

          <Field
            label="Medication allergies"
            placeholder="Example: Penicillin"
            value={form.allergiesToMeds}
            onChangeText={(text) =>
              handleChange('allergiesToMeds', text)
            }
          />

          <Field
            label="Other allergies"
            placeholder="Food, environmental, or other allergies"
            value={form.allergies}
            onChangeText={(text) =>
              handleChange('allergies', text)
            }
          />

          <View style={styles.switchCard}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>
                DNR
              </Text>
              <Text style={styles.switchSubtitle}>
                Do Not Resuscitate order
              </Text>
            </View>

            <Switch
              value={form.dnr}
              onValueChange={(value) =>
                handleChange('dnr', value)
              }
              trackColor={{
                false: '#D6DCE3',
                true: '#A9D2F7',
              }}
              thumbColor={
                form.dnr ? '#1976D2' : '#FFFFFF'
              }
            />
          </View>

          <View style={styles.switchCard}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>
                Epilepsy
              </Text>
              <Text style={styles.switchSubtitle}>
                Has a history of epilepsy or seizures
              </Text>
            </View>

            <Switch
              value={form.epilepsy}
              onValueChange={(value) =>
                handleChange('epilepsy', value)
              }
              trackColor={{
                false: '#D6DCE3',
                true: '#A9D2F7',
              }}
              thumbColor={
                form.epilepsy
                  ? '#1976D2'
                  : '#FFFFFF'
              }
            />
          </View>

          <Field
            label="Blood thinners"
            placeholder="Medication name or None"
            value={form.bloodThinners}
            onChangeText={(text) =>
              handleChange('bloodThinners', text)
            }
          />

          <Field
            label="Diabetes"
            placeholder="Example: Type 2, insulin dependent, or None"
            value={form.diabetes}
            onChangeText={(text) =>
              handleChange('diabetes', text)
            }
          />

          <Text style={styles.sectionLabel}>
            Insurance cards
          </Text>

          <InsurancePicker
            title="Insurance Card Front"
            imageUri={form.insuranceFront}
            onPress={() => pickImage('insuranceFront')}
          />

          <InsurancePicker
            title="Insurance Card Back"
            imageUri={form.insuranceBack}
            onPress={() => pickImage('insuranceBack')}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={25}
              color="#FFFFFF"
            />
            <Text style={styles.saveButtonText}>
              {isEditing
                ? 'Save Changes'
                : 'Save Emergency Info'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A8B2BF"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function InsurancePicker({
  title,
  imageUri,
  onPress,
}: {
  title: string;
  imageUri: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.insurancePicker}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.insurancePreview}
        />
      ) : (
        <View style={styles.insuranceIcon}>
          <Ionicons
            name="card-outline"
            size={27}
            color="#1976D2"
          />
        </View>
      )}

      <View style={styles.insuranceTextContainer}>
        <Text style={styles.insuranceTitle}>
          {title}
        </Text>

        <Text style={styles.insuranceSubtitle}>
          {imageUri
            ? 'Tap to change image'
            : 'Tap to add image'}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={24}
        color="#A3ADBA"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 34,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7B8999',
  },
  cancelButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976D2',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headingIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headingTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#17212E',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#7B8999',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEE5ED',
    borderRadius: 24,
    padding: 18,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#253243',
    marginTop: 4,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
  },
  halfField: {
    flex: 1,
    marginBottom: 16,
  },
  rowGap: {
    width: 10,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#465568',
    marginBottom: 7,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#D5DDE6',
    backgroundColor: '#F9FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#17212E',
  },
  switchCard: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: '#E1E7ED',
    backgroundColor: '#F9FAFC',
    borderRadius: 17,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#253243',
  },
  switchSubtitle: {
    fontSize: 13,
    color: '#8290A0',
    marginTop: 3,
  },
  insurancePicker: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: '#DCE3EA',
    backgroundColor: '#F9FAFC',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insuranceIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insurancePreview: {
    width: 66,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
  },
  insuranceTextContainer: {
    flex: 1,
  },
  insuranceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#253243',
  },
  insuranceSubtitle: {
    fontSize: 13,
    color: '#8290A0',
    marginTop: 2,
  },
  saveButton: {
    minHeight: 62,
    backgroundColor: '#1976D2',
    borderRadius: 18,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
