// app/supplies.tsx

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NavHeader from '../components/NavHeader';

type Supply = {
  id?: string;
  title: string;
  description: string;
  size: string;
  source: string;
  image?: string | null;
};

type ActionItem = Supply & {
  quantity: number;
};

const SUPPLIES_KEY = 'stored_supplies';
const ACTIONS_KEY = 'stored_actions';

export default function SuppliesScreen() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [helpVisible, setHelpVisible] = useState(false);
  const [neededItems, setNeededItems] = useState<Record<number, boolean>>({});

  const router = useRouter();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const loadSupplies = async () => {
    try {
      const [savedSupplies, savedActions] = await Promise.all([
        AsyncStorage.getItem(SUPPLIES_KEY),
        AsyncStorage.getItem(ACTIONS_KEY),
      ]);

      const parsedSupplies: Supply[] = savedSupplies
        ? JSON.parse(savedSupplies)
        : [];

      const parsedActions: ActionItem[] = savedActions
        ? JSON.parse(savedActions)
        : [];

      setSupplies(parsedSupplies);

      const checked: Record<number, boolean> = {};

      parsedSupplies.forEach((supply, index) => {
        checked[index] = parsedActions.some(
          (action) =>
            (supply.id && action.id === supply.id) ||
            (!supply.id &&
              action.title === supply.title &&
              action.size === supply.size &&
              action.source === supply.source)
        );
      });

      setNeededItems(checked);
    } catch (error) {
      console.log('Failed to load supplies:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSupplies();
    }, [])
  );

  const markAsNeeded = async (item: Supply, index: number) => {
    try {
      const current = await AsyncStorage.getItem(ACTIONS_KEY);
      const parsed: ActionItem[] = current ? JSON.parse(current) : [];

      const alreadyExists = parsed.some(
        (action) =>
          (item.id && action.id === item.id) ||
          (!item.id &&
            action.title === item.title &&
            action.size === item.size &&
            action.source === item.source)
      );

      if (!alreadyExists) {
        const updated = [...parsed, { ...item, quantity: 1 }];

        await AsyncStorage.setItem(
          ACTIONS_KEY,
          JSON.stringify(updated)
        );
      }

      setNeededItems((previous) => ({
        ...previous,
        [index]: true,
      }));
    } catch (error) {
      console.log('Failed to mark supply as needed:', error);
    }
  };

  const openSupply = (item: Supply, index: number) => {
    router.push({
      pathname: '/(tabs)/supplyDetail',
      params: {
        title: item.title,
        description: item.description,
        size: item.size,
        source: item.source,
        image: item.image ?? '',
        id: item.id ?? '',
        index: String(index),
      },
    });
  };

  return (
    <View style={styles.container}>
      <NavHeader />

      <View
        style={[
          styles.content,
          isTablet && styles.contentTablet,
        ]}
      >
        <View style={styles.headingRow}>
          <View>
            <Text
              style={[
                styles.pageTitle,
                isTablet && styles.pageTitleTablet,
              ]}
            >
              Supplies
            </Text>

            <Text
              style={[
                styles.pageSubtitle,
                isTablet && styles.pageSubtitleTablet,
              ]}
            >
              Keep important caregiving items organized.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.helpButton,
              isTablet && styles.helpButtonTablet,
            ]}
            onPress={() => setHelpVisible(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.helpButtonText,
                isTablet && styles.helpButtonTextTablet,
              ]}
            >
              ?
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.addButton,
            isTablet && styles.addButtonTablet,
          ]}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/supplyDetail',
              params: { mode: 'add' },
            })
          }
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.addButtonText,
              isTablet && styles.addButtonTextTablet,
            ]}
          >
            + ADD SUPPLY
          </Text>
        </TouchableOpacity>

        <FlatList
          data={supplies}
          keyExtractor={(item, index) =>
            item.id ?? `${item.title}-${index}`
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            supplies.length === 0
              ? styles.emptyListContainer
              : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconCircle,
                  isTablet && styles.emptyIconCircleTablet,
                ]}
              >
                <Ionicons
                  name="cube-outline"
                  size={isTablet ? 52 : 34}
                  color="#1976D2"
                />
              </View>

              <Text
                style={[
                  styles.emptyTitle,
                  isTablet && styles.emptyTitleTablet,
                ]}
              >
                No supplies yet
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  isTablet && styles.emptyTextTablet,
                ]}
              >
                Add the products and caregiving supplies you
                want to keep track of.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.supplyCard,
                isTablet && styles.supplyCardTablet,
              ]}
              onPress={() => openSupply(item, index)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.imageContainer,
                  isTablet && styles.imageContainerTablet,
                ]}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.supplyImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name="cube-outline"
                    size={isTablet ? 42 : 30}
                    color="#8A94A3"
                  />
                )}
              </View>

              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.supplyTitle,
                    isTablet && styles.supplyTitleTablet,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                <Text
                  style={[
                    styles.description,
                    isTablet && styles.descriptionTablet,
                  ]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Ionicons
                      name="resize-outline"
                      size={isTablet ? 18 : 14}
                      color="#5F6B7A"
                    />

                    <Text
                      style={[
                        styles.metaText,
                        isTablet && styles.metaTextTablet,
                      ]}
                    >
                      {item.size}
                    </Text>
                  </View>

                  <View style={styles.metaPill}>
                    <Ionicons
                      name="storefront-outline"
                      size={isTablet ? 18 : 14}
                      color="#5F6B7A"
                    />

                    <Text
                      style={[
                        styles.metaText,
                        isTablet && styles.metaTextTablet,
                      ]}
                      numberOfLines={1}
                    >
                      {item.source}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.neededButton,
                  neededItems[index] &&
                    styles.neededButtonSelected,
                  isTablet && styles.neededButtonTablet,
                ]}
                onPress={(event) => {
                  event.stopPropagation();
                  markAsNeeded(item, index);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={
                    neededItems[index]
                      ? 'checkmark-circle'
                      : 'add-circle-outline'
                  }
                  size={isTablet ? 26 : 21}
                  color={
                    neededItems[index]
                      ? '#FFFFFF'
                      : '#1976D2'
                  }
                />

                <Text
                  style={[
                    styles.neededText,
                    neededItems[index] &&
                      styles.neededTextSelected,
                    isTablet && styles.neededTextTablet,
                  ]}
                >
                  {neededItems[index] ? 'Needed' : 'Need'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      </View>

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.helpOverlay}>
          <View
            style={[
              styles.helpBox,
              isTablet && styles.helpBoxTablet,
            ]}
          >
            <View style={styles.helpIcon}>
              <Ionicons
                name="information-circle-outline"
                size={34}
                color="#1976D2"
              />
            </View>

            <Text
              style={[
                styles.helpTitle,
                isTablet && styles.helpTitleTablet,
              ]}
            >
              Supplies
            </Text>

            <Text
              style={[
                styles.helpText,
                isTablet && styles.helpTextTablet,
              ]}
            >
              Keep track of medical and caregiving supplies.
              Tap a supply to view or edit it. Select Need to
              add an item to Action Needed.
            </Text>

            <Pressable
              style={styles.gotItButton}
              onPress={() => setHelpVisible(false)}
            >
              <Text style={styles.gotItButtonText}>
                Got it
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  contentTablet: {
    paddingHorizontal: 42,
    paddingTop: 24,
  },

  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#17202A',
  },

  pageTitleTablet: {
    fontSize: 34,
  },

  pageSubtitle: {
    fontSize: 14,
    color: '#78828F',
    marginTop: 3,
  },

  pageSubtitleTablet: {
    fontSize: 17,
  },

  helpButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  helpButtonTablet: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  helpButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1976D2',
  },

  helpButtonTextTablet: {
    fontSize: 28,
  },

  addButton: {
    backgroundColor: '#1976D2',
    minHeight: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  addButtonTablet: {
    minHeight: 68,
    borderRadius: 18,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  addButtonTextTablet: {
    fontSize: 22,
  },

  listContent: {
    paddingBottom: 26,
  },

  emptyListContainer: {
    flexGrow: 1,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 90,
    paddingHorizontal: 30,
  },

  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyIconCircleTablet: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#26313D',
  },

  emptyTitleTablet: {
    fontSize: 26,
  },

  emptyText: {
    fontSize: 14,
    color: '#7A8592',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  emptyTextTablet: {
    fontSize: 17,
    lineHeight: 24,
  },

  supplyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E7ED',
    borderRadius: 18,
    padding: 13,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 1,
  },

  supplyCardTablet: {
    padding: 18,
    borderRadius: 22,
    marginBottom: 16,
  },

  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 13,
  },

  imageContainerTablet: {
    width: 92,
    height: 92,
    borderRadius: 18,
    marginRight: 18,
  },

  supplyImage: {
    width: '100%',
    height: '100%',
  },

  textContainer: {
    flex: 1,
    minWidth: 0,
  },

  supplyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17202A',
  },

  supplyTitleTablet: {
    fontSize: 23,
  },

  description: {
    fontSize: 14,
    color: '#66717E',
    marginTop: 3,
    lineHeight: 19,
  },

  descriptionTablet: {
    fontSize: 17,
    lineHeight: 23,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 9,
    gap: 7,
  },

  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F4F7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
    maxWidth: '100%',
  },

  metaText: {
    fontSize: 11,
    color: '#5F6B7A',
    fontWeight: '600',
  },

  metaTextTablet: {
    fontSize: 14,
  },

  neededButton: {
    marginLeft: 10,
    minWidth: 58,
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: '#EEF6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  neededButtonTablet: {
    minWidth: 78,
    paddingVertical: 12,
  },

  neededButtonSelected: {
    backgroundColor: '#1976D2',
  },

  neededText: {
    color: '#1976D2',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  neededTextTablet: {
    fontSize: 13,
  },

  neededTextSelected: {
    color: '#FFFFFF',
  },

  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22, 30, 40, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  helpBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },

  helpBoxTablet: {
    maxWidth: 500,
    padding: 32,
  },

  helpIcon: {
    marginBottom: 8,
  },

  helpTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#17202A',
    marginBottom: 10,
  },

  helpTitleTablet: {
    fontSize: 28,
  },

  helpText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5E6976',
    textAlign: 'center',
    marginBottom: 20,
  },

  helpTextTablet: {
    fontSize: 18,
    lineHeight: 27,
  },

  gotItButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  gotItButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});





