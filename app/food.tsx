// app/food.tsx

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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NavHeader from '../components/NavHeader';

type FoodItem = {
  title: string;
  description: string;
  source: string;
  type: string;
  image?: string | null;
};

type ActionItem = {
  title?: string;
  description?: string;
  source?: string;
  type?: string;
  size?: string;
  image?: string | null;
  quantity?: number;
  actionSource?: 'food' | 'supply';
  foodKey?: string;
  [key: string]: any;
};

const FOODS_KEY = 'stored_foods';
const ACTIONS_KEY = 'stored_actions';

export default function FoodScreen() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [helpVisible, setHelpVisible] = useState(false);
  const [neededItems, setNeededItems] = useState<boolean[]>([]);

  const router = useRouter();

  /*
   * Since the original app does not currently give each food a permanent ID,
   * this creates a repeatable key from the food's saved information.
   *
   * That lets us recognize the same food inside Action Needed without
   * changing the existing saved-food structure.
   */
  const getFoodKey = useCallback((item: FoodItem) => {
    return [
      item.title?.trim().toLowerCase() ?? '',
      item.description?.trim().toLowerCase() ?? '',
      item.type?.trim().toLowerCase() ?? '',
      item.source?.trim().toLowerCase() ?? '',
      item.image ?? '',
    ].join('|');
  }, []);

  /*
   * Determines whether an Action Needed item represents this food.
   *
   * New entries use foodKey/actionSource.
   * The fallback also recognizes food items already saved by the older
   * version of the app.
   */
  const actionMatchesFood = useCallback(
    (action: ActionItem, food: FoodItem) => {
      const foodKey = getFoodKey(food);

      if (
        action.actionSource === 'food' &&
        action.foodKey &&
        action.foodKey === foodKey
      ) {
        return true;
      }

      /*
       * Backward compatibility for food items that were added to
       * stored_actions before actionSource / foodKey existed.
       *
       * Food uses "type", whereas supplies use "size", so this also
       * helps prevent a supply from being mistaken for a food item.
       */
      const sameFoodFields =
        (action.title ?? '').trim().toLowerCase() ===
          food.title.trim().toLowerCase() &&
        (action.description ?? '').trim().toLowerCase() ===
          food.description.trim().toLowerCase() &&
        (action.source ?? '').trim().toLowerCase() ===
          food.source.trim().toLowerCase() &&
        (action.type ?? '').trim().toLowerCase() ===
          food.type.trim().toLowerCase();

      return sameFoodFields;
    },
    [getFoodKey]
  );

  /*
   * Reload Food AND Action Needed at the same time.
   *
   * This is important because:
   * - Adding a food should immediately show "Added"
   * - Returning from Action Needed after pressing Done should
   *   immediately return the food button to "Need"
   */
  const loadFoodScreen = useCallback(async () => {
    try {
      const [savedFoods, savedActions] = await Promise.all([
        AsyncStorage.getItem(FOODS_KEY),
        AsyncStorage.getItem(ACTIONS_KEY),
      ]);

      const parsedFoods = savedFoods ? JSON.parse(savedFoods) : [];
      const parsedActions = savedActions ? JSON.parse(savedActions) : [];

      const foodList: FoodItem[] = Array.isArray(parsedFoods)
        ? parsedFoods
        : [];

      const actionList: ActionItem[] = Array.isArray(parsedActions)
        ? parsedActions
        : [];

      setFoods(foodList);

      /*
       * Build a matching boolean for every food card.
       * true = already in Action Needed
       * false = can still be added
       */
      const currentNeededState = foodList.map((food) =>
        actionList.some((action) => actionMatchesFood(action, food))
      );

      setNeededItems(currentNeededState);
    } catch (error) {
      console.log('Failed to load food screen:', error);
      setFoods([]);
      setNeededItems([]);
    }
  }, [actionMatchesFood]);

  /*
   * Runs whenever this screen becomes active.
   *
   * This is what makes "Added" automatically return to "Need"
   * after the user presses Done on the Action Needed screen.
   */
  useFocusEffect(
    useCallback(() => {
      loadFoodScreen();
    }, [loadFoodScreen])
  );

  const openAddFood = () => {
    router.push({
      pathname: '/(tabs)/foodDetail',
      params: {
        mode: 'add',
        resetKey: Date.now().toString(),
      },
    });
  };

  const openFoodDetail = (item: FoodItem, index: number) => {
    router.push({
      pathname: '/(tabs)/foodDetail',
      params: {
        mode: 'edit',
        index: String(index),
        title: item.title,
        description: item.description,
        source: item.source,
        type: item.type,
        image: item.image ?? '',
      },
    });
  };

  const markAsNeeded = async (item: FoodItem, index: number) => {
    /*
     * Extra protection.
     *
     * Even though the Added button becomes disabled below,
     * don't allow this function to add the same food twice.
     */
    if (neededItems[index]) {
      return;
    }

    try {
      const current = await AsyncStorage.getItem(ACTIONS_KEY);
      const parsed = current ? JSON.parse(current) : [];

      const actions: ActionItem[] = Array.isArray(parsed) ? parsed : [];

      /*
       * Check storage itself before adding.
       *
       * This protects against very fast double taps or a stale UI state.
       */
      const alreadyAdded = actions.some((action) =>
        actionMatchesFood(action, item)
      );

      if (alreadyAdded) {
        setNeededItems((previous) => {
          const next = [...previous];
          next[index] = true;
          return next;
        });

        return;
      }

      const newActionItem: ActionItem = {
        ...item,
        quantity: 1,

        /*
         * These two fields make future matching much more reliable.
         * They do not interfere with the existing Action Needed fields.
         */
        actionSource: 'food',
        foodKey: getFoodKey(item),
      };

      const updated = [...actions, newActionItem];

      await AsyncStorage.setItem(
        ACTIONS_KEY,
        JSON.stringify(updated)
      );

      setNeededItems((previous) => {
        const next = [...previous];
        next[index] = true;
        return next;
      });
    } catch (error) {
      console.log('Failed to mark food as needed:', error);

      Alert.alert(
        'Unable to Update',
        'This food item could not be added to Action Needed.'
      );
    }
  };

  const renderFood = ({
    item,
    index,
  }: {
    item: FoodItem;
    index: number;
  }) => {
    const isAdded = neededItems[index] === true;

    return (
      <View style={styles.foodCard}>
        <TouchableOpacity
          style={styles.foodMain}
          activeOpacity={0.8}
          onPress={() => openFoodDetail(item, index)}
        >
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.foodImage}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="restaurant-outline"
                size={30}
                color="#1976D2"
              />
            </View>
          )}

          <View style={styles.foodInfo}>
            <Text
              style={styles.foodTitle}
              numberOfLines={1}
            >
              {item.title}
            </Text>

            {!!item.description && (
              <Text
                style={styles.foodDescription}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            )}

            <View style={styles.chipRow}>
              {!!item.type && (
                <View style={styles.chip}>
                  <Ionicons
                    name="nutrition-outline"
                    size={15}
                    color="#657282"
                  />

                  <Text style={styles.chipText}>
                    {item.type}
                  </Text>
                </View>
              )}

              {!!item.source && (
                <View style={styles.chip}>
                  <Ionicons
                    name="storefront-outline"
                    size={15}
                    color="#657282"
                  />

                  <Text
                    style={styles.chipText}
                    numberOfLines={1}
                  >
                    {item.source}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.needButton,
            isAdded && styles.needButtonSelected,
          ]}
          activeOpacity={isAdded ? 1 : 0.8}
          disabled={isAdded}
          onPress={() => markAsNeeded(item, index)}
        >
          <Ionicons
            name={
              isAdded
                ? 'checkmark-circle-outline'
                : 'add-circle-outline'
            }
            size={25}
            color={isAdded ? '#2E8B68' : '#1976D2'}
          />

          <Text
            style={[
              styles.needButtonText,
              isAdded && styles.needButtonTextSelected,
            ]}
          >
            {isAdded ? 'Added' : 'Need'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <NavHeader />

      <View style={styles.content}>
        <View style={styles.pageHeading}>
          <View style={styles.headingText}>
            <Text style={styles.pageTitle}>
              Food
            </Text>

            <Text style={styles.pageSubtitle}>
              Keep favorite foods and essentials organized.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.helpButton}
            activeOpacity={0.8}
            onPress={() => setHelpVisible(true)}
          >
            <Text style={styles.helpQuestion}>
              ?
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={openAddFood}
        >
          <Ionicons
            name="add"
            size={26}
            color="#fff"
          />

          <Text style={styles.addButtonText}>
            ADD FOOD ITEM
          </Text>
        </TouchableOpacity>

        <FlatList
          data={foods}
          keyExtractor={(_, index) =>
            index.toString()
          }
          renderItem={renderFood}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            foods.length === 0 &&
              styles.emptyListContent,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="restaurant-outline"
                  size={34}
                  color="#1976D2"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No food items yet
              </Text>

              <Text style={styles.emptyText}>
                Add favorite foods, groceries, drinks, or meal
                essentials for the care team to keep track of.
              </Text>
            </View>
          }
        />
      </View>

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setHelpVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.helpBox}>
            <View style={styles.helpIconCircle}>
              <Ionicons
                name="restaurant-outline"
                size={30}
                color="#1976D2"
              />
            </View>

            <Text style={styles.helpTitle}>
              Food
            </Text>

            <Text style={styles.helpText}>
              Save foods and grocery items your loved one uses
              regularly. Tap an item to edit its information, or
              tap Need to send it to the Action Needed list.
            </Text>

            <Pressable
              style={styles.gotItButton}
              onPress={() =>
                setHelpVisible(false)
              }
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

  pageHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  headingText: {
    flex: 1,
    paddingRight: 12,
  },

  pageTitle: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    color: '#17202B',
  },

  pageSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: '#7A8694',
    marginTop: 2,
  },

  helpButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D8DEE6',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  helpQuestion: {
    fontSize: 25,
    color: '#1976D2',
    fontWeight: '700',
  },

  addButton: {
    minHeight: 60,
    borderRadius: 18,
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,

    shadowColor: '#1976D2',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  addButtonText: {
    marginLeft: 4,
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  listContent: {
    paddingBottom: 28,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  foodCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E6ED',
    marginBottom: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  foodMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  foodImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: '#EEF2F7',
  },

  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  foodInfo: {
    flex: 1,
    paddingRight: 8,
  },

  foodTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#17202B',
  },

  foodDescription: {
    fontSize: 14,
    lineHeight: 19,
    color: '#717E8D',
    marginTop: 3,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 7,
  },

  chip: {
    maxWidth: '100%',
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: '#F2F5F8',
    flexDirection: 'row',
    alignItems: 'center',
  },

  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#657282',
    marginLeft: 5,
  },

  needButton: {
    minWidth: 66,
    marginLeft: 8,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#EDF5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /*
   * Added state:
   * visually distinct and, more importantly,
   * the TouchableOpacity is disabled.
   */
  needButtonSelected: {
    backgroundColor: '#E7F4EE',
  },

  needButtonText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },

  needButtonTextSelected: {
    color: '#2E8B68',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
    paddingBottom: 80,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#17202B',
  },

  emptyText: {
    marginTop: 7,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#7A8694',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 32, 0.46)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },

  helpBox: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },

  helpIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 21,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  helpTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#17202B',
    marginBottom: 8,
  },

  helpText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#667383',
    textAlign: 'center',
  },

  gotItButton: {
    width: '100%',
    marginTop: 22,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  gotItButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
