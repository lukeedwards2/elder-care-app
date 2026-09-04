// app/rx.tsx

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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { useFocusEffect, useRouter } from 'expo-router';
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

export default function RxScreen() {
  const [rxList, setRxList] = useState<Medication[]>([]);
  const [selectedRxKeys, setSelectedRxKeys] = useState<string[]>([]);
  const [helpVisible, setHelpVisible] = useState(false);

  const router = useRouter();

  /*
   * Creates a reliable unique key for each medication.
   *
   * If an RX number exists, use that.
   * Otherwise use name + strength + pharmacy.
   *
   * This prevents medications without an RX number
   * from disappearing from the Emergency page.
   */
  const getMedicationKey = (item: Medication) => {
    const rxNumber = String(item?.rxNumber || '')
      .trim()
      .toLowerCase();

    if (rxNumber) {
      return `rx-${rxNumber}`;
    }

    const name = String(item?.name || '')
      .trim()
      .toLowerCase();

    const strength = String(item?.strength || '')
      .trim()
      .toLowerCase();

    const pharmacy = String(item?.pharmacy || '')
      .trim()
      .toLowerCase();

    return `med-${name}|${strength}|${pharmacy}`;
  };

  const loadRx = async () => {
    try {
      const saved = await AsyncStorage.getItem('stored_rx');

      const parsedRx: Medication[] = saved
        ? JSON.parse(saved)
        : [];

      setRxList(parsedRx);

      const storedAmbulance =
        await AsyncStorage.getItem('ambulance_rx');

      const parsedAmbulance: Medication[] =
        storedAmbulance
          ? JSON.parse(storedAmbulance)
          : [];

      const keys = parsedAmbulance.map((item) =>
        getMedicationKey(item)
      );

      setSelectedRxKeys(keys);
    } catch (error) {
      console.log(
        'Failed to load medications:',
        error
      );
    }
  };

  /*
   * Reload every time the medication screen receives focus.
   *
   * This is important after:
   * - adding a medication
   * - editing a medication
   * - returning from Emergency
   */
  useFocusEffect(
    useCallback(() => {
      loadRx();
    }, [])
  );

  const toggleRxCheckbox = async (
    item: Medication
  ) => {
    try {
      const current =
        await AsyncStorage.getItem(
          'ambulance_rx'
        );

      let updated: Medication[] = current
        ? JSON.parse(current)
        : [];

      const itemKey =
        getMedicationKey(item);

      const isAlreadySelected =
        updated.some(
          (rx) =>
            getMedicationKey(rx) ===
            itemKey
        );

      if (isAlreadySelected) {
        updated = updated.filter(
          (rx) =>
            getMedicationKey(rx) !==
            itemKey
        );
      } else {
        /*
         * Extra protection:
         * don't allow the same medication
         * to accidentally be inserted twice.
         */
        const alreadyExists =
          updated.some(
            (rx) =>
              getMedicationKey(rx) ===
              itemKey
          );

        if (!alreadyExists) {
          updated.push(item);
        }
      }

      await AsyncStorage.setItem(
        'ambulance_rx',
        JSON.stringify(updated)
      );

      const updatedKeys =
        updated.map((rx) =>
          getMedicationKey(rx)
        );

      setSelectedRxKeys(updatedKeys);
    } catch (error) {
      console.log(
        'Failed to update ambulance medication list:',
        error
      );
    }
  };

  const openAddMedication = () => {
    router.push({
      pathname: '/(tabs)/rxDetail',
      params: {
        mode: 'add',
      },
    });
  };

  const openMedication = (
    item: Medication,
    index: number
  ) => {
    router.push({
      pathname: '/(tabs)/rxDetail',
      params: {
        mode: 'edit',
        index: String(index),
        name: item.name,
        purpose: item.purpose,
        frequency: item.frequency,
        strength: item.strength,
        pharmacy: item.pharmacy,
        notes: item.notes,
        rxNumber: item.rxNumber,
        image: item.image || '',
      },
    });
  };

  const renderMedication = ({
    item,
    index,
  }: {
    item: Medication;
    index: number;
  }) => {
    const medicationKey =
      getMedicationKey(item);

    const isEmergencyMedication =
      selectedRxKeys.includes(
        medicationKey
      );

    return (
      <View style={styles.medicationCard}>
        <TouchableOpacity
          style={styles.medicationMain}
          onPress={() =>
            openMedication(item, index)
          }
          activeOpacity={0.75}
        >
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={
                styles.medicationImage
              }
            />
          ) : (
            <View
              style={
                styles.imagePlaceholder
              }
            >
              <Ionicons
                name="medical-outline"
                size={34}
                color="#1976D2"
              />
            </View>
          )}

          <View
            style={
              styles.medicationInfo
            }
          >
            <Text
              style={
                styles.medicationName
              }
            >
              {item.name}
            </Text>

            {!!item.purpose && (
              <Text
                style={styles.purpose}
              >
                {item.purpose}
              </Text>
            )}

            <View
              style={
                styles.detailPills
              }
            >
              {!!item.strength && (
                <View
                  style={
                    styles.detailPill
                  }
                >
                  <Ionicons
                    name="medical-outline"
                    size={15}
                    color="#66788A"
                  />

                  <Text
                    style={
                      styles.detailPillText
                    }
                  >
                    {item.strength}
                  </Text>
                </View>
              )}

              {!!item.frequency && (
                <View
                  style={
                    styles.detailPill
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color="#66788A"
                  />

                  <Text
                    style={
                      styles.detailPillText
                    }
                  >
                    {item.frequency}
                  </Text>
                </View>
              )}
            </View>

            {!!item.pharmacy && (
              <View
                style={
                  styles.pharmacyRow
                }
              >
                <Ionicons
                  name="storefront-outline"
                  size={15}
                  color="#7B8794"
                />

                <Text
                  style={
                    styles.pharmacyText
                  }
                >
                  {item.pharmacy}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/*
         * IMPORTANT:
         *
         * Only this outer button performs
         * the toggle.
         *
         * The Checkbox itself has
         * pointerEvents="none" so one tap
         * can never toggle twice.
         */}
        <TouchableOpacity
          style={[
            styles.emergencySelector,
            isEmergencyMedication &&
              styles.emergencySelectorActive,
          ]}
          onPress={() =>
            toggleRxCheckbox(item)
          }
          activeOpacity={0.75}
        >
          <View pointerEvents="none">
            <Checkbox
              value={
                isEmergencyMedication
              }
              color={
                isEmergencyMedication
                  ? '#1976D2'
                  : undefined
              }
              style={styles.checkbox}
            />
          </View>

          <Text
            style={[
              styles.emergencySelectorText,
              isEmergencyMedication &&
                styles.emergencySelectorTextActive,
            ]}
          >
            Emergency
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <NavHeader />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View
            style={
              styles.titleTextContainer
            }
          >
            <Text
              style={styles.pageTitle}
            >
              Medications
            </Text>

            <Text
              style={
                styles.pageSubtitle
              }
            >
              Keep prescriptions and
              medication details
              organized.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() =>
              setHelpVisible(true)
            }
            activeOpacity={0.75}
          >
            <Text
              style={
                styles.helpQuestion
              }
            >
              ?
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={
            openAddMedication
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="add"
            size={29}
            color="#fff"
          />

          <Text
            style={
              styles.addButtonText
            }
          >
            ADD MEDICATION
          </Text>
        </TouchableOpacity>

        <FlatList
          data={rxList}
          keyExtractor={(
            _,
            index
          ) => index.toString()}
          renderItem={
            renderMedication
          }
          contentContainerStyle={[
            styles.listContent,
            rxList.length === 0 &&
              styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={
            false
          }
          ListEmptyComponent={
            <View
              style={
                styles.emptyState
              }
            >
              <View
                style={styles.emptyIcon}
              >
                <Ionicons
                  name="medical-outline"
                  size={50}
                  color="#1976D2"
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No medications yet
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                Add prescription
                medications so important
                details are easy for the
                care team to find.
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
        <View
          style={styles.helpOverlay}
        >
          <View
            style={styles.helpBox}
          >
            <View
              style={
                styles.helpIconCircle
              }
            >
              <Ionicons
                name="medical-outline"
                size={28}
                color="#1976D2"
              />
            </View>

            <Text
              style={styles.helpTitle}
            >
              Medications
            </Text>

            <Text
              style={styles.helpText}
            >
              Store prescription
              information here for quick
              reference. Select
              “Emergency” on medications
              you want available on the
              Emergency information
              page.
            </Text>

            <Pressable
              style={
                styles.gotItButton
              }
              onPress={() =>
                setHelpVisible(false)
              }
            >
              <Text
                style={
                  styles.gotItButtonText
                }
              >
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
  screen: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 20,
  },

  titleTextContainer: {
    flex: 1,
    paddingRight: 12,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#17212D',
    marginBottom: 4,
  },

  pageSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#7A8797',
  },

  helpButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#D5DCE4',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  helpQuestion: {
    color: '#1976D2',
    fontSize: 28,
    fontWeight: '800',
  },

  addButton: {
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },

  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  listContent: {
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE3EA',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  medicationMain: {
    flexDirection: 'row',
  },

  medicationImage: {
    width: 78,
    height: 78,
    borderRadius: 17,
    marginRight: 14,
    resizeMode: 'cover',
  },

  imagePlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 17,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  medicationInfo: {
    flex: 1,
  },

  medicationName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#17212D',
    marginBottom: 3,
  },

  purpose: {
    fontSize: 15,
    lineHeight: 20,
    color: '#758395',
    marginBottom: 9,
  },

  detailPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },

  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F5F8',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },

  detailPillText: {
    color: '#66788A',
    fontSize: 13,
    fontWeight: '600',
  },

  pharmacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    gap: 5,
  },

  pharmacyText: {
    color: '#7B8794',
    fontSize: 13,
  },

  emergencySelector: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF0F3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  emergencySelectorActive: {},

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },

  emergencySelectorText: {
    color: '#7B8794',
    fontSize: 14,
    fontWeight: '600',
  },

  emergencySelectorTextActive: {
    color: '#1976D2',
    fontWeight: '700',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingBottom: 100,
  },

  emptyIcon: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#17212D',
    marginBottom: 9,
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 16,
    lineHeight: 23,
    color: '#8491A2',
    textAlign: 'center',
  },

  helpOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  helpBox: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },

  helpIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  helpTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#17212D',
    marginBottom: 10,
  },

  helpText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#667383',
    textAlign: 'center',
    marginBottom: 20,
  },

  gotItButton: {
    width: '100%',
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  gotItButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
