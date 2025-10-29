import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Switch, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function AmbulanceForm() {
  const [form, setForm] = useState({
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
  });

  const router = useRouter();

  useEffect(() => {
    loadForm();
  }, []);

  const loadForm = async () => {
    const saved = await AsyncStorage.getItem('ambulance_info');
    if (saved) setForm(JSON.parse(saved));
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pickImage = async (key) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled && result.assets?.length) {
      handleChange(key, result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    await AsyncStorage.setItem('ambulance_info', JSON.stringify(form));
    router.replace('/ambulance');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Emergency Info</Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, { marginRight: 8 }]}
          placeholder="Height"
          value={form.height}
          onChangeText={(text) => handleChange('height', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Weight"
          value={form.weight}
          onChangeText={(text) => handleChange('weight', text)}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Hospital"
        value={form.hospital}
        onChangeText={(text) => handleChange('hospital', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Family Practice/Internal"
        value={form.practice}
        onChangeText={(text) => handleChange('practice', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Allergic to Meds"
        value={form.allergiesToMeds}
        onChangeText={(text) => handleChange('allergiesToMeds', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Allergies"
        value={form.allergies}
        onChangeText={(text) => handleChange('allergies', text)}
      />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>DNR:</Text>
        <Switch
          value={form.dnr}
          onValueChange={(val) => handleChange('dnr', val)}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Epilepsy:</Text>
        <Switch
          value={form.epilepsy}
          onValueChange={(val) => handleChange('epilepsy', val)}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Blood Thinners"
        value={form.bloodThinners}
        onChangeText={(text) => handleChange('bloodThinners', text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Diabetes"
        value={form.diabetes}
        onChangeText={(text) => handleChange('diabetes', text)}
      />

      <TouchableOpacity
        style={styles.imageButton}
        onPress={() => pickImage('insuranceFront')}
      >
        <Text style={styles.imageButtonText}>Upload Insurance Card Front</Text>
        {form.insuranceFront ? (
          <Image source={{ uri: form.insuranceFront }} style={styles.preview} />
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.imageButton}
        onPress={() => pickImage('insuranceBack')}
      >
        <Text style={styles.imageButtonText}>Upload Insurance Card Back</Text>
        {form.insuranceBack ? (
          <Image source={{ uri: form.insuranceBack }} style={styles.preview} />
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  imageButton: {
    backgroundColor: '#ddd',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  preview: {
    width: 120,
    height: 80,
    marginTop: 8,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
