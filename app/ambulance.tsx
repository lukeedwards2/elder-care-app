import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NavHeader from '../components/NavHeader';

type AmbulanceInfo = {
  height?: string;
  weight?: string;
  hospital?: string;
  practice?: string;
  allergiesToMeds?: string;
  allergies?: string;
  dnr?: boolean;
  epilepsy?: boolean;
  bloodThinners?: string;
  diabetes?: string;
  insuranceFront?: string;
  insuranceBack?: string;
};

type RxItem = {
  name?: string;
  purpose?: string;
  frequency?: string;
  strength?: string;
  pharmacy?: string;
  notes?: string;
  rxNumber?: string;
  image?: string;
};

export default function AmbulanceScreen() {
  const [info, setInfo] = useState<AmbulanceInfo | null>(null);
  const [selectedRx, setSelectedRx] = useState<RxItem[]>([]);
  const [helpVisible, setHelpVisible] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const router = useRouter();

  const loadAmbulanceInfo = async () => {
    try {
      const saved = await AsyncStorage.getItem('ambulance_info');

      if (saved) {
        setInfo(JSON.parse(saved));
      } else {
        setInfo(null);
      }
    } catch (error) {
      console.log('Failed to load emergency information:', error);
    }
  };

  const getMedicationKey = (rx: RxItem) => {
  const rxNumber = String(rx?.rxNumber || '').trim();

  if (rxNumber) {
    return `rx:${rxNumber}`;
  }

  const name = String(rx?.name || '').trim().toLowerCase();
  const strength = String(rx?.strength || '').trim().toLowerCase();
  const pharmacy = String(rx?.pharmacy || '').trim().toLowerCase();

  return `med:${name}|${strength}|${pharmacy}`;
};

const loadSelectedRx = async () => {
  try {
    const storedRx = await AsyncStorage.getItem('stored_rx');
    const ambulanceRx = await AsyncStorage.getItem('ambulance_rx');

    const parsedRx: RxItem[] = storedRx ? JSON.parse(storedRx) : [];
    const selected: RxItem[] = ambulanceRx ? JSON.parse(ambulanceRx) : [];

    const selectedKeys = new Set(
      selected.map((rx) => getMedicationKey(rx))
    );

    const selectedRxList = parsedRx.filter((rx) =>
      selectedKeys.has(getMedicationKey(rx))
    );

    setSelectedRx(selectedRxList);
  } catch (error) {
    console.log('Failed to load emergency medications:', error);
  }
};

  useFocusEffect(
    useCallback(() => {
      loadAmbulanceInfo();
      loadSelectedRx();
    }, [])
  );

  const openImage = (uri: string) => {
    setZoomedImage(uri);
  };

  const closeImage = () => {
    setZoomedImage(null);
  };

  const hasText = (value?: string) => {
    return Boolean(value && value.trim());
  };

  const renderValue = (value?: string) => {
    return hasText(value) ? value : 'Not entered';
  };

  return (
    <View style={styles.container}>
      <NavHeader />

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.helpOverlay}>
          <View style={styles.helpBox}>
            <View style={styles.helpIconCircle}>
              <Ionicons
                name="medical-outline"
                size={30}
                color="#1976D2"
              />
            </View>

            <Text style={styles.helpTitle}>Emergency Information</Text>

            <Text style={styles.helpText}>
              Keep important medical information in one place for emergencies.
              You can store health details, insurance cards, and medications
              selected from the Medications page.
            </Text>

            <Pressable
              style={styles.helpButton}
              onPress={() => setHelpVisible(false)}
            >
              <Text style={styles.helpButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeadingRow}>
          <View style={styles.pageHeadingText}>
            <Text style={styles.pageTitle}>Emergency</Text>
            <Text style={styles.pageSubtitle}>
              Important medical information when every second matters.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.helpCircle}
            onPress={() => setHelpVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.helpQuestion}>?</Text>
          </TouchableOpacity>
        </View>

        {!info ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="medical-outline"
                size={44}
                color="#1976D2"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No emergency information yet
            </Text>

            <Text style={styles.emptyDescription}>
              Add medical details, insurance cards, allergies, and other
              information that could help in an emergency.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/ambulanceForm',
                  params: { mode: 'add' },
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name="add"
                size={26}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.primaryButtonText}>
                ADD INFORMATION
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name="person-outline"
                    size={23}
                    color="#1976D2"
                  />
                </View>

                <View style={styles.sectionHeadingText}>
                  <Text style={styles.sectionTitle}>
                    Medical Information
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Key details for emergency care.
                  </Text>
                </View>
              </View>

              <View style={styles.twoColumnRow}>
                <InfoBox
                  label="Height"
                  value={renderValue(info.height)}
                />
                <View style={styles.columnSpacer} />
                <InfoBox
                  label="Weight"
                  value={renderValue(info.weight)}
                />
              </View>

              <InfoRow
                icon="business-outline"
                label="Hospital"
                value={renderValue(info.hospital)}
              />

              <InfoRow
                icon="medkit-outline"
                label="Primary practice"
                value={renderValue(info.practice)}
              />

              <InfoRow
                icon="warning-outline"
                label="Medication allergies"
                value={renderValue(info.allergiesToMeds)}
                warning={hasText(info.allergiesToMeds)}
              />

              <InfoRow
                icon="alert-circle-outline"
                label="Other allergies"
                value={renderValue(info.allergies)}
                warning={hasText(info.allergies)}
              />

              <View style={styles.statusRow}>
                <StatusBox
                  label="DNR"
                  enabled={Boolean(info.dnr)}
                />
                <View style={styles.columnSpacer} />
                <StatusBox
                  label="Epilepsy"
                  enabled={Boolean(info.epilepsy)}
                />
              </View>

              <InfoRow
                icon="water-outline"
                label="Blood thinners"
                value={renderValue(info.bloodThinners)}
              />

              <InfoRow
                icon="fitness-outline"
                label="Diabetes"
                value={renderValue(info.diabetes)}
              />
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name="card-outline"
                    size={23}
                    color="#1976D2"
                  />
                </View>

                <View style={styles.sectionHeadingText}>
                  <Text style={styles.sectionTitle}>
                    Insurance Cards
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Tap an image to view it full screen.
                  </Text>
                </View>
              </View>

              {info.insuranceFront || info.insuranceBack ? (
                <View style={styles.insuranceRow}>
                  {info.insuranceFront ? (
                    <TouchableOpacity
                      style={styles.insuranceWrapper}
                      onPress={() =>
                        openImage(info.insuranceFront as string)
                      }
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: info.insuranceFront }}
                        style={styles.insuranceImage}
                      />
                      <View style={styles.imageLabel}>
                        <Text style={styles.imageLabelText}>
                          Front
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}

                  {info.insuranceBack ? (
                    <TouchableOpacity
                      style={styles.insuranceWrapper}
                      onPress={() =>
                        openImage(info.insuranceBack as string)
                      }
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: info.insuranceBack }}
                        style={styles.insuranceImage}
                      />
                      <View style={styles.imageLabel}>
                        <Text style={styles.imageLabelText}>
                          Back
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.noSectionData}>
                  No insurance cards have been added.
                </Text>
              )}
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name="medical-outline"
                    size={23}
                    color="#1976D2"
                  />
                </View>

                <View style={styles.sectionHeadingText}>
                  <Text style={styles.sectionTitle}>
                    Emergency Medications
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Medications selected as Emergency on the Medications page.
                  </Text>
                </View>
              </View>

              {selectedRx.length > 0 ? (
                selectedRx.map((rx, index) => (
                  <View
                    key={`${rx.rxNumber || rx.name || 'rx'}-${index}`}
                    style={styles.rxCard}
                  >
                    {rx.image ? (
                      <Image
                        source={{ uri: rx.image }}
                        style={styles.rxImage}
                      />
                    ) : (
                      <View style={styles.rxPlaceholder}>
                        <Ionicons
                          name="medical-outline"
                          size={30}
                          color="#1976D2"
                        />
                      </View>
                    )}

                    <View style={styles.rxContent}>
                      <Text style={styles.rxName}>
                        {rx.name || 'Medication'}
                      </Text>

                      {hasText(rx.purpose) ? (
                        <Text style={styles.rxPurpose}>
                          {rx.purpose}
                        </Text>
                      ) : null}

                      <View style={styles.rxTags}>
                        {hasText(rx.strength) ? (
                          <View style={styles.rxTag}>
                            <Ionicons
                              name="medical-outline"
                              size={15}
                              color="#6f7f91"
                            />
                            <Text style={styles.rxTagText}>
                              {rx.strength}
                            </Text>
                          </View>
                        ) : null}

                        {hasText(rx.frequency) ? (
                          <View style={styles.rxTag}>
                            <Ionicons
                              name="time-outline"
                              size={15}
                              color="#6f7f91"
                            />
                            <Text style={styles.rxTagText}>
                              {rx.frequency}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {hasText(rx.pharmacy) ? (
                        <View style={styles.rxLine}>
                          <Ionicons
                            name="storefront-outline"
                            size={17}
                            color="#7b8999"
                          />
                          <Text style={styles.rxLineText}>
                            {rx.pharmacy}
                          </Text>
                        </View>
                      ) : null}

                      {hasText(rx.rxNumber) ? (
                        <Text style={styles.rxSmallText}>
                          Rx #: {rx.rxNumber}
                        </Text>
                      ) : null}

                      {hasText(rx.notes) ? (
                        <Text style={styles.rxNotes}>
                          {rx.notes}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noMedicationBox}>
                  <Ionicons
                    name="medical-outline"
                    size={26}
                    color="#7f8d9d"
                  />
                  <Text style={styles.noMedicationText}>
                    No medications are currently marked for Emergency.
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/ambulanceForm',
                  params: { mode: 'edit' },
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name="create-outline"
                size={24}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.primaryButtonText}>
                EDIT INFORMATION
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(zoomedImage)}
        transparent
        animationType="fade"
        onRequestClose={closeImage}
      >
        <Pressable
          style={styles.zoomOverlay}
          onPress={closeImage}
        >
          {zoomedImage ? (
            <Image
              source={{ uri: zoomedImage }}
              style={styles.zoomedImage}
              resizeMode="contain"
            />
          ) : null}

          <View style={styles.closeImageButton}>
            <Ionicons
              name="close"
              size={28}
              color="#fff"
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoBoxLabel}>{label}</Text>
      <Text style={styles.infoBoxValue}>{value}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  warning = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View
        style={[
          styles.infoRowIcon,
          warning && styles.warningIconBackground,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={warning ? '#D97706' : '#1976D2'}
        />
      </View>

      <View style={styles.infoRowContent}>
        <Text style={styles.infoRowLabel}>{label}</Text>
        <Text style={styles.infoRowValue}>{value}</Text>
      </View>
    </View>
  );
}

function StatusBox({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <View style={styles.statusBox}>
      <View
        style={[
          styles.statusCircle,
          enabled && styles.statusCircleActive,
        ]}
      >
        <Ionicons
          name={enabled ? 'checkmark' : 'remove'}
          size={19}
          color={enabled ? '#1976D2' : '#8b98a8'}
        />
      </View>

      <View>
        <Text style={styles.statusLabel}>{label}</Text>
        <Text
          style={[
            styles.statusValue,
            enabled && styles.statusValueActive,
          ]}
        >
          {enabled ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },
  pageHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  pageHeadingText: {
    flex: 1,
    paddingRight: 14,
  },
  pageTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#16202D',
  },
  pageSubtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: '#7B8999',
    marginTop: 5,
  },
  helpCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#D8E0E8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpQuestion: {
    fontSize: 27,
    fontWeight: '800',
    color: '#1976D2',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E6ED',
    paddingHorizontal: 22,
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16202D',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#7B8999',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 26,
    maxWidth: 520,
  },
  primaryButton: {
    width: '100%',
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 18,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DFE6EE',
    padding: 16,
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DFE6EE',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionHeadingText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1C2735',
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 19,
    color: '#8290A0',
    marginTop: 2,
  },
  twoColumnRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  columnSpacer: {
    width: 10,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    borderRadius: 16,
    padding: 14,
  },
  infoBoxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8491A0',
    marginBottom: 4,
  },
  infoBoxValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B2633',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  infoRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  warningIconBackground: {
    backgroundColor: '#FFF4DB',
  },
  infoRowContent: {
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8491A0',
  },
  infoRowValue: {
    marginTop: 2,
    fontSize: 16,
    color: '#1D2936',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 4,
  },
  statusBox: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8EDF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statusCircleActive: {
    backgroundColor: '#E3F2FF',
  },
  statusLabel: {
    fontSize: 13,
    color: '#8491A0',
    fontWeight: '700',
  },
  statusValue: {
    fontSize: 16,
    color: '#536273',
    fontWeight: '700',
  },
  statusValueActive: {
    color: '#1976D2',
  },
  insuranceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  insuranceWrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#F3F6F9',
  },
  insuranceImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  imageLabel: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  imageLabelText: {
    fontSize: 14,
    color: '#536273',
    fontWeight: '700',
  },
  noSectionData: {
    fontSize: 15,
    color: '#8793A1',
    paddingVertical: 8,
  },
  rxCard: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EDF1F5',
    paddingTop: 15,
    marginTop: 4,
    marginBottom: 12,
  },
  rxImage: {
    width: 76,
    height: 76,
    borderRadius: 18,
    marginRight: 13,
  },
  rxPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  rxContent: {
    flex: 1,
  },
  rxName: {
    fontSize: 19,
    color: '#182330',
    fontWeight: '800',
  },
  rxPurpose: {
    fontSize: 15,
    color: '#748293',
    marginTop: 2,
  },
  rxTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 7,
  },
  rxTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F3F7',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rxTagText: {
    fontSize: 13,
    color: '#657487',
    marginLeft: 5,
    fontWeight: '600',
  },
  rxLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rxLineText: {
    color: '#748293',
    fontSize: 14,
    marginLeft: 6,
  },
  rxSmallText: {
    color: '#748293',
    fontSize: 13,
    marginTop: 5,
  },
  rxNotes: {
    color: '#556476',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  noMedicationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderRadius: 16,
    padding: 14,
  },
  noMedicationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#7C8998',
    marginLeft: 10,
  },
  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  helpBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
  },
  helpIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  helpTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#17222F',
    textAlign: 'center',
  },
  helpText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#687789',
    textAlign: 'center',
    marginTop: 10,
  },
  helpButton: {
    width: '100%',
    backgroundColor: '#1976D2',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
  },
  helpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomedImage: {
    width: '92%',
    height: '82%',
  },
  closeImageButton: {
    position: 'absolute',
    top: 55,
    right: 22,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});







