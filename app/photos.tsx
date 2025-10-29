import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Modal, Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase';
import { ref, onValue, push } from 'firebase/database';
import NavHeader from '../components/NavHeader';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState('');
  const [namePromptVisible, setNamePromptVisible] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);

  const flatListRef = useRef(null);
  const MESSAGES_KEY = 'stored_chat_messages';

  useEffect(() => {
    const messagesRef = ref(db, 'messages');

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const loadedMessages = Object.values(data);
      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, []);

  const handleSend = async () => {
    if (input.trim() === '' || userName.trim() === '') return;

    const newMessage = {
      text: input,
      sender: userName,
      timestamp: new Date().toISOString(),
    };

    await push(ref(db, 'messages'), newMessage);
    setInput('');
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === userName ? styles.bubbleRight : styles.bubbleLeft,
      ]}
    >
      <Text style={styles.senderName}>
        {item.sender === userName ? 'You' : item.sender}
      </Text>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
    </View>
  );

  return (
    <>
      {/* Name Prompt */}
      {namePromptVisible && (
        <Modal visible transparent animationType="slide">
          <View style={styles.namePromptOverlay}>
            <View style={styles.namePromptBox}>
              <Text style={styles.namePromptTitle}>Enter Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sarah"
                value={userName}
                onChangeText={setUserName}
              />
              <Pressable
                style={styles.saveButton}
                onPress={() => setNamePromptVisible(false)}
              >
                <Text style={styles.saveButtonText}>Start Chatting</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Help Popup */}
      <Modal visible={helpVisible} transparent animationType="slide">
        <View style={styles.namePromptOverlay}>
          <View style={styles.namePromptBox}>
            <Text style={styles.namePromptTitle}>Chat Page</Text>
            <Text style={styles.helpText}>
              This page lets caregivers communicate in real time. Enter your name, send a message, and see replies from others.
            </Text>
            <Pressable style={styles.saveButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.saveButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Main Chat UI */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <NavHeader
          title="Taking care of"
          subtitle="Mom"
          onHelpPress={() => setHelpVisible(true)}
        />

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesContainer}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  messagesContainer: { padding: 10, paddingBottom: 80 },
  messageBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 16,
    marginBottom: 10,
  },
  bubbleLeft: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    backgroundColor: '#1976D2',
    alignSelf: 'flex-end',
  },
  messageText: { color: '#000' },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#555',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  namePromptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  namePromptBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 350,
  },
  namePromptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

