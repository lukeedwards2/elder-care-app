// app/action.tsx

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import NavHeader from '../components/NavHeader';

type NeededItem = {
  title?: string;
  description?: string;
  size?: string;
  type?: string;
  source?: string;
  image?: string | null;
  quantity?: number;
};

const ACTIONS_KEY = 'stored_actions';

export default function ActionScreen() {
  const [neededItems, setNeededItems] = useState<NeededItem[]>([]);
  const [helpVisible, setHelpVisible] = useState(false);

  /*
   * IMPORTANT:
   * useFocusEffect reloads this list EVERY TIME the Action Needed
   * screen becomes active.
   *
   * That means:
   * Supplies -> Need -> Action Needed
   * Food -> Need -> Action Needed
   *
   * will immediately show the newest data.
   */
  useFocusEffect(
    useCallback(() => {
      loadNeededItems();
    }, [])
  );

  const loadNeededItems = async () => {
    try {
      const stored = await AsyncStorage.getItem(ACTIONS_KEY);

      if (!stored) {
        setNeededItems([]);
        return;
      }

      const parsed: NeededItem[] = JSON.parse(stored);

      // Make sure every older item has a valid quantity.
      const cleaned = parsed.map((item) => ({
        ...item,
        quantity:
          typeof item.quantity === 'number' && item.quantity > 0
            ? item.quantity
            : 1,
      }));

      setNeededItems(cleaned);
    } catch (error) {
      console.log('Failed to load Action Needed items:', error);
      setNeededItems([]);
    }
  };

  const saveItems = async (items: NeededItem[]) => {
    try {
      setNeededItems(items);
      await AsyncStorage.setItem(ACTIONS_KEY, JSON.stringify(items));
    } catch (error) {
      console.log('Failed to save Action Needed items:', error);

      Alert.alert(
        'Unable to Save',
        'There was a problem updating the Action Needed list.'
      );
    }
  };

  const increaseQuantity = async (index: number) => {
    const updated = [...neededItems];

    updated[index] = {
      ...updated[index],
      quantity: (updated[index].quantity || 1) + 1,
    };

    await saveItems(updated);
  };

  const decreaseQuantity = async (index: number) => {
    const currentQuantity = neededItems[index].quantity || 1;

    if (currentQuantity <= 1) {
      confirmRemove(index);
      return;
    }

    const updated = [...neededItems];

    updated[index] = {
      ...updated[index],
      quantity: currentQuantity - 1,
    };

    await saveItems(updated);
  };

  const removeItem = async (index: number) => {
    const updated = neededItems.filter((_, itemIndex) => itemIndex !== index);
    await saveItems(updated);
  };

  const confirmRemove = (index: number) => {
    const itemName = neededItems[index]?.title || 'this item';

    Alert.alert(
      'Remove Item?',
      `Remove "${itemName}" from Action Needed?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeItem(index),
        },
      ]
    );
  };

  const getItemType = (item: NeededItem) => {
    /*
     * Supplies use "size".
     * Food uses "type".
     *
     * So this allows Action Needed to work with both without
     * changing the stored data you already have.
     */
    if (item.type) {
      return {
        label: 'Food',
        detail: item.type,
        icon: 'restaurant-outline' as const,
      };
    }

    return {
      label: 'Supply',
      detail: item.size || '',
      icon: 'cube-outline' as const,
    };
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: NeededItem;
    index: number;
  }) => {
    const itemInfo = getItemType(item);
    const quantity = item.quantity || 1;

    return (
      <View style={styles.itemCard}>
        <View style={styles.cardTopRow}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.itemImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name={itemInfo.icon}
                size={34}
                color="#1976D2"
              />
            </View>
          )}

          <View style={styles.infoContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title || 'Untitled Item'}
              </Text>

              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {itemInfo.label}
                </Text>
              </View>
            </View>

            {!!item.description && (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.badgesRow}>
              {!!itemInfo.detail && (
                <View style={styles.metaBadge}>
                  <Ionicons
                    name={
                      item.type
                        ? 'restaurant-outline'
                        : 'resize-outline'
                    }
                    size={15}
                    color="#6B7788"
                  />

                  <Text style={styles.metaBadgeText}>
                    {itemInfo.detail}
                  </Text>
                </View>
              )}

              {!!item.source && (
                <View style={styles.metaBadge}>
                  <Ionicons
                    name="storefront-outline"
                    size={15}
                    color="#6B7788"
                  />

                  <Text
                    style={styles.metaBadgeText}
                    numberOfLines={1}
                  >
                    {item.source}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardBottomRow}>
          <View>
            <Text style={styles.quantityLabel}>Quantity needed</Text>

            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => decreaseQuantity(index)}
                activeOpacity={0.75}
              >
                <Ionicons name="remove" size={22} color="#1976D2" />
              </TouchableOpacity>

              <Text style={styles.quantityNumber}>{quantity}</Text>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => increaseQuantity(index)}
                activeOpacity={0.75}
              >
                <Ionicons name="add" size={22} color="#1976D2" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => confirmRemove(index)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={23}
              color="#1976D2"
            />

            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <NavHeader />

      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderText}>
            <Text style={styles.pageTitle}>Action Needed</Text>

            <Text style={styles.pageSubtitle}>
              Keep track of items that need attention.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setHelpVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.helpQuestion}>?</Text>
          </TouchableOpacity>
        </View>

        {neededItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={48}
                color="#1976D2"
              />
            </View>

            <Text style={styles.emptyTitle}>You're all caught up</Text>

            <Text style={styles.emptyText}>
              Food and supply items marked as needed will appear here.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="clipboard-outline"
                  size={24}
                  color="#1976D2"
                />
              </View>

              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryTitle}>
                  {neededItems.length}{' '}
                  {neededItems.length === 1 ? 'item' : 'items'} need attention
                </Text>

                <Text style={styles.summarySubtitle}>
                  Update quantities or mark an item done.
                </Text>
              </View>
            </View>

            <FlatList
              data={neededItems}
              keyExtractor={(_, index) => index.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </>
        )}
      </View>

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.helpBox}>
            <View style={styles.helpIcon}>
              <Ionicons
                name="clipboard-outline"
                size={30}
                color="#1976D2"
              />
            </View>

            <Text style={styles.helpTitle}>Action Needed</Text>

            <Text style={styles.helpText}>
              Items you mark as needed from Supplies or Food appear here.
              Adjust the quantity as needed, then tap Done when the item
              has been taken care of.
            </Text>

            <Pressable
              style={styles.gotItButton}
              onPress={() => setHelpVisible(false)}
            >
              <Text style={styles.gotItButtonText}>Got it</Text>
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
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 18,
  },

  pageHeaderText: {
    flex: 1,
    paddingRight: 16,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#151C26',
    letterSpacing: -0.4,
  },

  pageSubtitle: {
    fontSize: 16,
    color: '#7B8797',
    marginTop: 3,
    lineHeight: 22,
  },

  helpButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE3EA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  helpQuestion: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1976D2',
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  summaryTextContainer: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#233143',
  },

  summarySubtitle: {
    fontSize: 13,
    color: '#708092',
    marginTop: 2,
  },

  listContent: {
    paddingBottom: 24,
  },

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0E6ED',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  itemImage: {
    width: 76,
    height: 76,
    borderRadius: 16,
    marginRight: 14,
    resizeMode: 'cover',
  },

  placeholderImage: {
    width: 76,
    height: 76,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContainer: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    color: '#18212D',
    marginRight: 8,
  },

  categoryBadge: {
    backgroundColor: '#EEF3F8',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#657487',
  },

  description: {
    fontSize: 14,
    color: '#718092',
    marginTop: 5,
    lineHeight: 19,
  },

  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },

  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
    maxWidth: '48%',
  },

  metaBadgeText: {
    marginLeft: 5,
    color: '#657487',
    fontSize: 12,
    fontWeight: '600',
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEF1F4',
    marginTop: 14,
    paddingTop: 13,
  },

  quantityLabel: {
    fontSize: 12,
    color: '#7D8997',
    fontWeight: '600',
    marginBottom: 7,
  },

  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityNumber: {
    minWidth: 38,
    textAlign: 'center',
    fontSize: 17,
    color: '#1D2835',
    fontWeight: '800',
  },

  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4FF',
    borderRadius: 13,
    paddingHorizontal: 14,
    height: 40,
  },

  doneButtonText: {
    color: '#1976D2',
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 5,
  },

  emptyContainer: {
    marginTop: 70,
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  emptyIcon: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B2430',
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 15,
    color: '#7C8796',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16,24,40,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  helpBox: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },

  helpIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  helpTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#18212D',
    marginBottom: 10,
  },

  helpText: {
    fontSize: 15,
    color: '#657487',
    textAlign: 'center',
    lineHeight: 22,
  },

  gotItButton: {
    width: '100%',
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  gotItButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
