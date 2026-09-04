import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import NavHeader from '../components/NavHeader';

type RouteParams = {
  mode?: string | string[];
  index?: string | string[];
  title?: string | string[];
  description?: string | string[];
  size?: string | string[];
  source?: string | string[];
  image?: string | string[];
};

type Supply = {
  title: string;
  description: string;
  size: string;
  source: string;
  image: string | null;
};

const SUPPLIES_KEY = 'stored_supplies';

const getParam = (
  value: string | string[] | undefined
): string => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

export default function SupplyDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<RouteParams>();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const mode = getParam(params.mode);

  const parsedIndex =
    params.index !== undefined && getParam(params.index) !== ''
      ? Number(getParam(params.index))
      : null;

  const isAddMode = mode === 'add' || parsedIndex === null;
  const isEditing = !isAddMode && parsedIndex !== null;

  const [title, setTitle] = useState(
    isAddMode ? '' : getParam(params.title)
  );

  const [description, setDescription] = useState(
    isAddMode ? '' : getParam(params.description)
  );

  const [size, setSize] = useState(
    isAddMode ? '' : getParam(params.size)
  );

  const [source, setSource] = useState(
    isAddMode ? '' : getParam(params.source)
  );

  const [image, setImage] = useState<string | null>(
    isAddMode
      ? null
      : getParam(params.image) || null
  );

  /*
   * IMPORTANT:
   * Expo Router may keep this screen mounted.
   *
   * Every time the screen becomes active:
   * - Add Supply starts completely blank.
   * - Editing reloads the selected supply.
   */
  useFocusEffect(
    useCallback(() => {
      if (isAddMode) {
        setTitle('');
        setDescription('');
        setSize('');
        setSource('');
        setImage(null);
      } else {
        setTitle(getParam(params.title));
        setDescription(getParam(params.description));
        setSize(getParam(params.size));
        setSource(getParam(params.source));
        setImage(getParam(params.image) || null);
      }
    }, [
      isAddMode,
      params.title,
      params.description,
      params.size,
      params.source,
      params.image,
    ])
  );

  /*
   * Cancel should ALWAYS return to Supplies.
   *
   * We intentionally do NOT use router.back()
   * because navigation history could send the
   * user all the way back to Home.
   */
  const handleCancel = () => {
    router.replace('/(tabs)/supplies');
  };

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo Permission Needed',
          'Please allow photo access so you can attach a product image.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
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

  const saveSupply = async () => {
    const cleanedTitle = title.trim();
    const cleanedDescription = description.trim();
    const cleanedSize = size.trim();
    const cleanedSource = source.trim();

    if (
      !cleanedTitle ||
      !cleanedDescription ||
      !cleanedSize ||
      !cleanedSource
    ) {
      Alert.alert(
        'Missing Information',
        'Please complete the product name, description, size/type, and where to buy it.'
      );
      return;
    }

    const supply: Supply = {
      title: cleanedTitle,
      description: cleanedDescription,
      size: cleanedSize,
      source: cleanedSource,
      image,
    };

    try {
      const stored =
        await AsyncStorage.getItem(SUPPLIES_KEY);

      const supplies: Supply[] = stored
        ? JSON.parse(stored)
        : [];

      if (
        isEditing &&
        parsedIndex !== null &&
        parsedIndex >= 0 &&
        parsedIndex < supplies.length
      ) {
        supplies[parsedIndex] = supply;
      } else {
        supplies.push(supply);
      }

      await AsyncStorage.setItem(
        SUPPLIES_KEY,
        JSON.stringify(supplies)
      );

      /*
       * Explicitly return to Supplies instead
       * of depending on navigation history.
       */
      router.replace('/(tabs)/supplies');
    } catch (error) {
      console.log('Failed to save supply:', error);

      Alert.alert(
        'Unable to Save',
        'The supply could not be saved. Please try again.'
      );
    }
  };

  const deleteSupply = () => {
    if (!isEditing || parsedIndex === null) {
      return;
    }

    Alert.alert(
      'Delete Supply?',
      'This supply will be permanently removed.',
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
              const stored =
                await AsyncStorage.getItem(SUPPLIES_KEY);

              if (!stored) {
                router.replace('/(tabs)/supplies');
                return;
              }

              const supplies: Supply[] =
                JSON.parse(stored);

              if (
                parsedIndex >= 0 &&
                parsedIndex < supplies.length
              ) {
                supplies.splice(parsedIndex, 1);
              }

              await AsyncStorage.setItem(
                SUPPLIES_KEY,
                JSON.stringify(supplies)
              );

              router.replace('/(tabs)/supplies');
            } catch (error) {
              console.log(
                'Failed to delete supply:',
                error
              );

              Alert.alert(
                'Unable to Delete',
                'The supply could not be deleted. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <NavHeader />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.contentWrapper,
              isTablet &&
                styles.contentWrapperTablet,
            ]}
          >
            <Pressable
              style={styles.cancelButton}
              onPress={handleCancel}
              hitSlop={10}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color="#1976D2"
              />

              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </Pressable>

            <View style={styles.titleRow}>
              <View style={styles.titleIcon}>
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

              <View style={styles.titleTextWrapper}>
                <Text
                  style={[
                    styles.screenTitle,
                    isTablet &&
                      styles.screenTitleTablet,
                  ]}
                >
                  {isAddMode
                    ? 'Add Supply'
                    : 'Supply Details'}
                </Text>

                <Text
                  style={[
                    styles.screenSubtitle,
                    isTablet &&
                      styles.screenSubtitleTablet,
                  ]}
                >
                  {isAddMode
                    ? 'Add an item you want the care team to track.'
                    : 'Update the information for this item.'}
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>
                Product name
              </Text>

              <TextInput
                style={[
                  styles.input,
                  isTablet && styles.inputTablet,
                ]}
                placeholder="Example: Disposable gloves"
                placeholderTextColor="#AAB3BF"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="sentences"
              />

              <Text style={styles.fieldLabel}>
                Description
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.descriptionInput,
                  isTablet &&
                    styles.descriptionInputTablet,
                ]}
                placeholder="What is this supply used for?"
                placeholderTextColor="#AAB3BF"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>
                Size / type
              </Text>

              <TextInput
                style={[
                  styles.input,
                  isTablet && styles.inputTablet,
                ]}
                placeholder="Example: Large"
                placeholderTextColor="#AAB3BF"
                value={size}
                onChangeText={setSize}
              />

              <Text style={styles.fieldLabel}>
                Where to buy
              </Text>

              <TextInput
                style={[
                  styles.input,
                  isTablet && styles.inputTablet,
                ]}
                placeholder="Example: Target"
                placeholderTextColor="#AAB3BF"
                value={source}
                onChangeText={setSource}
                autoCapitalize="words"
              />

              <Text style={styles.fieldLabel}>
                Product image
              </Text>

              {image ? (
                <>
                  <Image
                    source={{ uri: image }}
                    style={[
                      styles.imagePreview,
                      isTablet &&
                        styles.imagePreviewTablet,
                    ]}
                  />

                  <Pressable
                    style={styles.imageActionButton}
                    onPress={pickImage}
                  >
                    <View
                      style={styles.imageIconCircle}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={26}
                        color="#1976D2"
                      />
                    </View>

                    <View
                      style={
                        styles.imageButtonTextWrapper
                      }
                    >
                      <Text
                        style={
                          styles.imageButtonTitle
                        }
                      >
                        Change Product Image
                      </Text>

                      <Text
                        style={
                          styles.imageButtonSubtitle
                        }
                      >
                        Choose a different photo.
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={26}
                      color="#9CA6B2"
                    />
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={styles.imageActionButton}
                  onPress={pickImage}
                >
                  <View
                    style={styles.imageIconCircle}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={28}
                      color="#1976D2"
                    />
                  </View>

                  <View
                    style={
                      styles.imageButtonTextWrapper
                    }
                  >
                    <Text
                      style={
                        styles.imageButtonTitle
                      }
                    >
                      Add Product Image
                    </Text>

                    <Text
                      style={
                        styles.imageButtonSubtitle
                      }
                    >
                      Optional, but useful for the
                      care team.
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={26}
                    color="#9CA6B2"
                  />
                </Pressable>
              )}

              <Pressable
                style={styles.saveButton}
                onPress={saveSupply}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={25}
                  color="#fff"
                />

                <Text style={styles.saveButtonText}>
                  {isAddMode
                    ? 'Save Supply'
                    : 'Save Changes'}
                </Text>
              </Pressable>

              {isEditing && (
                <Pressable
                  style={styles.deleteButton}
                  onPress={deleteSupply}
                >
                  <Ionicons
                    name="trash-outline"
                    size={23}
                    color="#fff"
                  />

                  <Text
                    style={
                      styles.deleteButtonText
                    }
                  >
                    Delete Supply
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },

  flex: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 135,
  },

  scrollContentTablet: {
    paddingHorizontal: 30,
    paddingBottom: 145,
  },

  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
  },

  contentWrapperTablet: {
    maxWidth: 820,
  },

  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 18,
    paddingVertical: 4,
  },

  cancelText: {
    color: '#1976D2',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 2,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  titleIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#E7F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  titleTextWrapper: {
    flex: 1,
  },

  screenTitle: {
    fontSize: 29,
    fontWeight: '800',
    color: '#18202A',
    letterSpacing: -0.5,
  },

  screenTitleTablet: {
    fontSize: 34,
  },

  screenSubtitle: {
    marginTop: 3,
    fontSize: 15,
    lineHeight: 21,
    color: '#7A8593',
  },

  screenSubtitleTablet: {
    fontSize: 17,
    lineHeight: 23,
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCE3EB',

    shadowColor: '#1F2937',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 2,
  },

  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#44515F',
    marginBottom: 7,
    marginLeft: 2,
  },

  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#D5DDE6',
    backgroundColor: '#FBFCFE',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 17,
    color: '#18202A',
    marginBottom: 18,
  },

  inputTablet: {
    minHeight: 60,
    fontSize: 18,
  },

  descriptionInput: {
    minHeight: 105,
    paddingTop: 15,
  },

  descriptionInputTablet: {
    minHeight: 125,
  },

  imageActionButton: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: '#D5DDE6',
    borderRadius: 18,
    backgroundColor: '#FBFCFE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },

  imageIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F2FF',
  },

  imageButtonTextWrapper: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },

  imageButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#26313D',
  },

  imageButtonSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#8793A1',
    lineHeight: 18,
  },

  imagePreview: {
    width: '100%',
    height: 210,
    borderRadius: 18,
    resizeMode: 'cover',
    marginBottom: 12,
  },

  imagePreviewTablet: {
    height: 300,
  },

  saveButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  deleteButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#D33A2C',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
  },

  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
