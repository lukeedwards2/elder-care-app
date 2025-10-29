import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, Modal, Pressable, TouchableOpacity
} from 'react-native';

type Props = {
  explanation: string;
};

export default function HeaderWithHelp({ explanation }: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <View style={styles.header}>
        <Image source={require('../assets/profile.jpg')} style={styles.profileImage} />
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerLine1}>Taking care of</Text>
          <Text style={styles.headerLine2}>Mom</Text>
        </View>
        
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image source={require('../assets/light-bulb.png')} style={styles.helpIcon} />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Page Help</Text>
            <Text style={styles.modalText}>{explanation}</Text>
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

// 1976D2

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#1976D2',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'space-between',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
  },
  headerLine1: {
    color: '#fff',
    fontSize: 16,
  },
  headerLine2: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  helpIcon: {
    width: 30,
    height: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});


