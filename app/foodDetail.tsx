// app/foodDetail.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import NavHeader from '../components/NavHeader';

const FOODS_KEY = 'stored_foods';

function getParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

export default function FoodDetail() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    mode?: string | string[];
    index?: string | string[];
    title?: string | string[];
    description?: string | string[];
    source?: string | string[];
    type?: string | string[];
    image?: string | string[];
  }>();

  const mode = getParam(params.mode);
  const indexParam = getParam(params.index);
  const resetKey = getParam(params.resetKey);

  const isAddMode = mode === 'add' || !indexParam;
  const editingIndex = !isAddMode ? Number(indexParam) : null;

  const paramTitle = getParam(params.title);
  const paramDescription = getParam(params.description);
  const paramSource = getParam(params.source);
  const paramType = getParam(params.type);
  const paramImage = getParam(params.image);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [type, setType] = useState('');
  const [image, setImage] = useState('');

  const pageTitle = isAddMode ? 'Add Food' : 'Food Details';

  const subtitle = isAddMode
    ? 'Add a food item you want the care team to track.'
    : 'Update the information for this food item.';

  const headerIcon = isAddMode ? 'add-circle-outline' : 'create-outline';

  // The dependency string makes this respond correctly when Expo Router
  // reuses the same screen with a different set of route parameters.
  const routeIdentity = useMemo(
  () =>
    [
      mode,
      resetKey,
      indexParam,
      paramTitle,
      paramDescription,
      paramSource,
      paramType,
      paramImage,
    ].join('|'),
  [
    mode,
    resetKey,
    indexParam,
    paramTitle,
    paramDescription,
    paramSource,
    paramType,
    paramImage,
  ]
);

  useEffect(() => {
  if (isAddMode) {
    setTitle('');
    setDescription('');
    setSource('');
    setType('');
    setImage('');
    return;
  }

  setTitle(paramTitle);
  setDescription(paramDescription);
  setSource(paramSource);
  setType(paramType);
  setImage(paramImage);
}, [
  routeIdentity,
  isAddMode,
  paramTitle,
  paramDescription,
  paramSource,
  paramType,
  paramImage,
]);

  const handleCancel = () => {
    // Explicitly go to Food instead of router.back().
    // This prevents Cancel from accidentally returning all the way Home.
    router.replace('/(tabs)/food');
  };

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo Permission Needed',
          'Please allow photo access so you can attach a food image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Image picker error:', error);

      Alert.alert(
        'Unable to Open Photos',
        'Please try selecting the image again.'
      );
    }
  };

  const saveFood = async () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      Alert.alert(
        'Food Name Required',
        'Please enter a name for this food item.'
      );
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(FOODS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const foods = Array.isArray(parsed) ? parsed : [];

      const updatedItem = {
        title: trimmedTitle,
        description: description.trim(),
        source: source.trim(),
        type: type.trim(),
        image: image || null,
      };

      if (
        editingIndex !== null &&
        editingIndex >= 0 &&
        editingIndex < foods.length
      ) {
        foods[editingIndex] = updatedItem;
      } else {
        foods.push(updatedItem);
      }

      await AsyncStorage.setItem(FOODS_KEY, JSON.stringify(foods));

      router.replace('/(tabs)/food');
    } catch (error) {
      console.log('Failed to save food:', error);

      Alert.alert(
        'Unable to Save',
        'The food item could not be saved. Please try again.'
      );
    }
  };

  const deleteFood = () => {
    if (editingIndex === null) {
      return;
    }

    Alert.alert(
      'Delete Food Item?',
      `Are you sure you want to delete "${title || 'this food item'}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem(FOODS_KEY);

              if (!stored) {
                router.replace('/(tabs)/food');
                return;
              }

              const parsed = JSON.parse(stored);
              const foods = Array.isArray(parsed) ? parsed : [];

              if (
                editingIndex >= 0 &&
                editingIndex < foods.length
              ) {
                foods.splice(editingIndex, 1);
              }

              await AsyncStorage.setItem(
                FOODS_KEY,
                JSON.stringify(foods)
              );

              router.replace('/(tabs)/food');
            } catch (error) {
              console.log('Failed to delete food:', error);

              Alert.alert(
                'Unable to Delete',
                'The food item could not be deleted.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <NavHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.cancelButton}
          activeOpacity={0.75}
          onPress={handleCancel}
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
              name={headerIcon}
              size={33}
              color="#1976D2"
            />
          </View>

          <View style={styles.headingText}>
            <Text style={styles.pageTitle}>{pageTitle}</Text>
            <Text style={styles.pageSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Food name</Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Example: Chicken noodle soup"
            placeholderTextColor="#AFB8C4"
            autoCapitalize="sentences"
          />

          <Text style={styles.label}>Description</Text>

          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="What should the care team know about this item?"
            placeholderTextColor="#AFB8C4"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Type</Text>

          <TextInput
            style={styles.input}
            value={type}
            onChangeText={setType}
            placeholder="Example: Fresh, Frozen, Snack"
            placeholderTextColor="#AFB8C4"
            autoCapitalize="sentences"
          />

          <Text style={styles.label}>Where to buy</Text>

          <TextInput
            style={styles.input}
            value={source}
            onChangeText={setSource}
            placeholder="Example: Target"
            placeholderTextColor="#AFB8C4"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Food image</Text>

          {image ? (
            <View>
              <Image source={{ uri: image }} style={styles.imagePreview} />

              <TouchableOpacity
                style={styles.changeImageButton}
                activeOpacity={0.8}
                onPress={pickImage}
              >
                <Ionicons
                  name="camera-outline"
                  size={23}
                  color="#1976D2"
                />

                <View style={styles.imageButtonTextWrap}>
                  <Text style={styles.changeImageTitle}>
                    Change Food Image
                  </Text>

                  <Text style={styles.changeImageSubtitle}>
                    Choose a different picture
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color="#A2ACB8"
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePicker}
              activeOpacity={0.8}
              onPress={pickImage}
            >
              <View style={styles.cameraIcon}>
                <Ionicons
                  name="camera-outline"
                  size={27}
                  color="#1976D2"
                />
              </View>

              <View style={styles.imageButtonTextWrap}>
                <Text style={styles.imagePickerTitle}>
                  Add Food Image
                </Text>

                <Text style={styles.imagePickerSubtitle}>
                  Optional, but useful for the care team.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={25}
                color="#A2ACB8"
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.85}
            onPress={saveFood}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={23}
              color="#fff"
            />
            <Text style={styles.saveButtonText}>
              {isAddMode ? 'Save Food' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          {!isAddMode && (
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.8}
              onPress={deleteFood}
            >
              <Ionicons
                name="trash-outline"
                size={21}
                color="#D03A31"
              />
              <Text style={styles.deleteButtonText}>
                Delete Food Item
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
    backgroundColor: '#F7F9FC',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 35,
  },

  cancelButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },

  cancelText: {
    marginLeft: 3,
    fontSize: 17,
    fontWeight: '700',
    color: '#1976D2',
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  headingIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#E7F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  headingText: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    color: '#17202B',
  },

  pageSubtitle: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 21,
    color: '#7A8694',
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0E6ED',

    shadowColor: '#000',
    shadowOpacity: 0.035,
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
    color: '#485564',
    marginBottom: 8,
    marginTop: 4,
  },

  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#D4DBE4',
    borderRadius: 17,
    backgroundColor: '#FBFCFD',
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 17,
    color: '#17202B',
    marginBottom: 18,
  },

  descriptionInput: {
    minHeight: 105,
  },

  imagePicker: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: '#D5DCE5',
    borderRadius: 18,
    backgroundColor: '#FAFBFC',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  cameraIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E8F2FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageButtonTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  imagePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#25313D',
  },

  imagePickerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#84909E',
  },

  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: '#EEF2F6',
    marginBottom: 10,
  },

  changeImageButton: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: '#D8DEE6',
    borderRadius: 17,
    backgroundColor: '#FAFBFC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
  },

  changeImageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25313D',
  },

  changeImageSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#84909E',
  },

  saveButton: {
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#1976D2',
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 7,
  },

  deleteButton: {
    minHeight: 52,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1C9C6',
    backgroundColor: '#FFF7F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonText: {
    color: '#D03A31',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 7,
  },
});
