import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavHeader from '../components/NavHeader';

type ChatMessage = {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState('');
  const [namePromptVisible, setNamePromptVisible] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const MESSAGES_KEY = 'stored_chat_messages';
  const USER_NAME_KEY = 'stored_chat_user_name';

  useEffect(() => {
    loadChat();
  }, []);

  const loadChat = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem(MESSAGES_KEY);
      const savedName = await AsyncStorage.getItem(USER_NAME_KEY);

      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }

      if (savedName) {
        setUserName(savedName);
        setNamePromptVisible(false);
      }
    } catch (error) {
      console.log('Error loading chat:', error);
    }
  };

  const saveMessages = async (updatedMessages: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
    } catch (error) {
      console.log('Error saving chat:', error);
    }
  };

  const handleSaveName = async () => {
    const trimmedName = userName.trim();

    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter your name before starting the chat.');
      return;
    }

    await AsyncStorage.setItem(USER_NAME_KEY, trimmedName);
    setUserName(trimmedName);
    setNamePromptVisible(false);
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || !userName.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: trimmedInput,
      sender: userName,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);
    await saveMessages(updatedMessages);
    setInput('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isCurrentUser = item.sender === userName;

    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.bubbleRight : styles.bubbleLeft,
        ]}
      >
        <Text style={[styles.senderName, isCurrentUser && styles.senderNameRight]}>
          {isCurrentUser ? 'You' : item.sender}
        </Text>
        <Text style={[styles.messageText, isCurrentUser && styles.messageTextRight]}>
          {item.text}
        </Text>
        <Text style={[styles.timestamp, isCurrentUser && styles.timestampRight]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Modal visible={namePromptVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter Your Name</Text>

            <TextInput
              style={styles.nameInput}
              placeholder="e.g., Sarah"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="words"
            />

            <Pressable style={styles.saveButton} onPress={handleSaveName}>
              <Text style={styles.saveButtonText}>Start Chatting</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={helpVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Chat Page</Text>
            <Text style={styles.helpText}>
              This page lets caregivers communicate and keep track of updates in one place.
            </Text>

            <Pressable style={styles.saveButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.saveButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No messages yet. Send the first update.
            </Text>
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            multiline
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
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  messagesContainer: {
    padding: 12,
    paddingBottom: 90,
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 30,
    fontSize: 15,
  },
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
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#555',
  },
  senderNameRight: {
    color: '#eaf3ff',
  },
  messageText: {
    color: '#000',
    fontSize: 15,
  },
  messageTextRight: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  timestampRight: {
    color: '#dcecff',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#fff',
    maxHeight: 90,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
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

