import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import NavHeader from '../components/NavHeader';

export default function AmbulanceScreen() {
  const [info, setInfo] = useState(null);
  const [rxList, setRxList] = useState([]);
  const [selectedRx, setSelectedRx] = useState([]);
  const [helpVisible, setHelpVisible] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  const router = useRouter();

  useEffect(() => {
    loadAmbulanceInfo();
    loadSelectedRx();
  }, []);

  const loadAmbulanceInfo = async () => {
    const saved = await AsyncStorage.getItem('ambulance_info');
    if (saved) {
      setInfo(JSON.parse(saved));
    }
  };

  const loadSelectedRx = async () => {
    const storedRx = await AsyncStorage.getItem('stored_rx');
    const ambulanceRx = await AsyncStorage.getItem('ambulance_rx');

    const parsedRx = storedRx ? JSON.parse(storedRx) : [];
    const selected = ambulanceRx ? JSON.parse(ambulanceRx) : [];

    const selectedRxList = parsedRx.filter(rx => selected.some(sel => sel.rxNumber === rx.rxNumber));
    setSelectedRx(selectedRxList);
  };

  const openImage = (uri) => setZoomedImage(uri);
  const closeImage = () => setZoomedImage(null);

  return (
    <View style={styles.container}>
      <NavHeader
        title="Taking care of"
        subtitle="Mom"
        onHelpPress={() => setHelpVisible(true)}
      />

      <Modal visible={helpVisible} transparent animationType="slide">
        <View style={styles.helpOverlay}>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Ambulance Info</Text>
            <Text style={styles.helpText}>
              This page stores emergency medical info for first responders. You can edit it anytime, and it also includes current medications and insurance card images.
            </Text>
            <Pressable style={styles.saveButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.saveButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {info ? (
          <>
            <View style={styles.centerBlock}>
              <View style={styles.row}>
                <Text style={styles.bold}>Height:</Text>
                <Text style={styles.text}>{info.height}</Text>
                <Text style={[styles.bold, { marginLeft: 20 }]}>Weight:</Text>
                <Text style={styles.text}>{info.weight}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.bold}>Hospital:</Text>
                <Text style={styles.text}>{info.hospital}</Text>
                <Text style={[styles.bold, { marginLeft: 20 }]}>Practice:</Text>
                <Text style={styles.text}>{info.practice}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.bold}>Allergic to Meds:</Text>
                <Text style={styles.text}>{info.allergicMeds}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.bold}>Allergies:</Text>
                <Text style={styles.text}>{info.allergies}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.bold}>DNR:</Text>
                <Text style={styles.text}>{info.dnr ? '✓' : '✘'}</Text>
                <Text style={[styles.bold, { marginLeft: 20 }]}>Epilepsy:</Text>
                <Text style={styles.text}>{info.epilepsy ? '✓' : '✘'}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.bold}>Blood Thinners:</Text>
                <Text style={styles.text}>{info.bloodThinners}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.bold}>Diabetes:</Text>
                <Text style={styles.text}>{info.diabetes}</Text>
              </View>
            </View>

            <Text style={styles.subHeader}>Insurance Cards:</Text>
            <View style={styles.imageRow}>
              {info.insuranceFront && (
                <TouchableOpacity onPress={() => openImage(info.insuranceFront)}>
                  <Image source={{ uri: info.insuranceFront }} style={styles.insuranceImage} />
                </TouchableOpacity>
              )}
              {info.insuranceBack && (
                <TouchableOpacity onPress={() => openImage(info.insuranceBack)}>
                  <Image source={{ uri: info.insuranceBack }} style={styles.insuranceImage} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.subHeader}>Current Medications:</Text>
            {selectedRx.map((rx, i) => (
              <View key={i} style={styles.rxCard}>
                {rx.image && <Image source={{ uri: rx.image }} style={styles.rxImage} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.rxName}>{rx.name}</Text>
                  <Text style={styles.rxDetail}>{rx.purpose}</Text>
                  <Text style={styles.rxDetail}>Frequency: {rx.frequency}</Text>
                  <Text style={styles.rxDetail}>Strength: {rx.strength}</Text>
                  <Text style={styles.rxDetail}>Pharmacy: {rx.pharmacy}</Text>
                  <Text style={styles.rxDetail}>RX #: {rx.rxNumber}</Text>
                  <Text style={styles.rxDetail}>Notes: {rx.notes}</Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.text}>No info entered yet.</Text>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/ambulanceForm')}
        >
          <Text style={styles.editButtonText}>Edit Info</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Zoom Image Modal */}
      <Modal visible={!!zoomedImage} transparent animationType="fade">
        <Pressable style={styles.zoomOverlay} onPress={closeImage}>
          {zoomedImage && (
            <Image source={{ uri: zoomedImage }} style={styles.zoomedImage} resizeMode="contain" />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerBlock: { marginBottom: 16, alignSelf: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  bold: { fontWeight: 'bold', fontSize: 16 },
  text: { fontSize: 16, marginLeft: 4 },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  insuranceImage: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  rxCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  rxImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 10,
  },
  rxName: { fontWeight: 'bold', fontSize: 16 },
  rxDetail: { fontSize: 14, color: '#555' },
  editButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  editButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxWidth: 350,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomedImage: {
    width: '90%',
    height: '80%',
  },
});







