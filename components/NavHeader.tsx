import React, { useState } from 'react';
import {
  View, Image, TouchableOpacity,
  Modal, Text, Pressable, StyleSheet
} from 'react-native';

interface NavHeaderProps {
  helpTitle: string;
  helpText: string;
}

export default function NavHeader({ helpTitle, helpText }: NavHeaderProps) {
  const [helpVisible, setHelpVisible] = useState(false);

  return (
    <>
      <View style={styles.navHeader}>
        {/* Left profile image */}
        <Image source={require('../assets/profile.png')} style={styles.profile} />

        {/* Centered logo */}
        <View style={styles.centerContainer}>
          <Image
            source={require('../assets/headerLogo.png')} // <-- Your new logo here
            style={styles.centerImage}
            resizeMode="contain"
          />
        </View>

        {/* Right help icon */}
        <TouchableOpacity onPress={() => setHelpVisible(true)}>
          <Image source={require('../assets/light-bulb.png')} style={styles.helpIcon} />
        </TouchableOpacity>
      </View>

      {/* Help Modal */}
      <Modal visible={helpVisible} transparent animationType="slide">
        <View style={styles.helpOverlay}>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>{helpTitle}</Text>
            <Text style={styles.helpText}>{helpText}</Text>
            <Pressable style={styles.saveButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.saveButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  profile: { width: 45, height: 45, borderRadius: 25 },

  // Centered container with absolute fill for perfect centering
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 50,
    bottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerImage: {
    height: 40, // Adjust size as needed
    width: 160, // Adjust width for logo
  },

  helpIcon: { width: 34, height: 34 },

  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  helpBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  helpTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
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
});





