import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Modal,
  Pressable,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  onValue,
  push,
  ref,
} from 'firebase/database';

import NavHeader from '../../components/NavHeader';
import { db } from '../../firebase';
import { getSessionSafe } from '../../lib/supabase';

type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
};

type LegacyChatMessage = {
  id?: string;
  text?: string;
  sender?: string;
  senderId?: string;
  senderName?: string;
  timestamp?: string;
};

const MESSAGES_KEY = 'stored_chat_messages';
const CHAT_PATH = 'messages';

export default function ChatScreen() {
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const flatListRef =
    useRef<FlatList<ChatMessage>>(null);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [input, setInput] = useState('');

  const [currentUserId, setCurrentUserId] =
    useState('');

  const [currentUserName, setCurrentUserName] =
    useState('Caregiver');

  const [identityReady, setIdentityReady] =
    useState(false);

  const [loadingMessages, setLoadingMessages] =
    useState(true);

  const [firebaseConnected, setFirebaseConnected] =
    useState(true);

  const [helpVisible, setHelpVisible] =
    useState(false);

  const bubbleMaxWidth = isTablet
    ? Math.min(width * 0.58, 560)
    : width * 0.78;

  const messageFontSize = isTablet ? 18 : 16;
  const senderFontSize = isTablet ? 14 : 12;
  const timestampFontSize = isTablet ? 12 : 10;

  const resolveUserIdentity =
    useCallback(async () => {
      try {
        const session = await getSessionSafe();

        if (!session?.user) {
          setCurrentUserId('local-user');
          setCurrentUserName('Caregiver');
          return;
        }

        const user = session.user;

        const metadata = user.user_metadata ?? {};

        const metadataName =
          metadata.full_name ||
          metadata.name ||
          metadata.display_name ||
          metadata.first_name;

        const emailName = user.email
          ? user.email
              .split('@')[0]
              .replace(/[._-]+/g, ' ')
              .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
              )
          : '';

        const displayName =
          typeof metadataName === 'string' &&
          metadataName.trim()
            ? metadataName.trim()
            : emailName || 'Caregiver';

        setCurrentUserId(user.id);
        setCurrentUserName(displayName);
      } catch (error) {
        console.warn(
          'Unable to load chat user identity:',
          error
        );

        setCurrentUserId('local-user');
        setCurrentUserName('Caregiver');
      } finally {
        setIdentityReady(true);
      }
    }, []);

  const normalizeMessage = useCallback(
    (
      raw: LegacyChatMessage,
      fallbackId: string
    ): ChatMessage | null => {
      const text =
        typeof raw?.text === 'string'
          ? raw.text.trim()
          : '';

      if (!text) {
        return null;
      }

      const senderName =
        typeof raw?.senderName === 'string' &&
        raw.senderName.trim()
          ? raw.senderName.trim()
          : typeof raw?.sender === 'string' &&
              raw.sender.trim()
            ? raw.sender.trim()
            : 'Caregiver';

      let senderId =
        typeof raw?.senderId === 'string'
          ? raw.senderId
          : '';

      /*
       * Migration support for older local messages.
       *
       * Previously, messages only stored sender names.
       * If that old sender name matches this signed-in
       * user's display name, treat it as this user's
       * historical message.
       */
      if (
        !senderId &&
        identityReady &&
        senderName === currentUserName
      ) {
        senderId = currentUserId;
      }

      if (!senderId) {
        senderId = `legacy-${senderName}`;
      }

      const timestamp =
        typeof raw?.timestamp === 'string' &&
        raw.timestamp
          ? raw.timestamp
          : new Date().toISOString();

      return {
        id:
          typeof raw?.id === 'string' &&
          raw.id
            ? raw.id
            : fallbackId,
        text,
        senderId,
        senderName,
        timestamp,
      };
    },
    [
      currentUserId,
      currentUserName,
      identityReady,
    ]
  );

  const saveLocalCache = useCallback(
    async (updatedMessages: ChatMessage[]) => {
      try {
        await AsyncStorage.setItem(
          MESSAGES_KEY,
          JSON.stringify(updatedMessages)
        );
      } catch (error) {
        console.warn(
          'Unable to save local chat cache:',
          error
        );
      }
    },
    []
  );

  const loadLocalCache =
    useCallback(async () => {
      try {
        const saved =
          await AsyncStorage.getItem(
            MESSAGES_KEY
          );

        if (!saved) {
          return [];
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed
          .map((item, index) =>
            normalizeMessage(
              item,
              `local-${index}`
            )
          )
          .filter(
            (
              item
            ): item is ChatMessage =>
              Boolean(item)
          )
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() -
              new Date(b.timestamp).getTime()
          );
      } catch (error) {
        console.warn(
          'Unable to load local chat cache:',
          error
        );

        return [];
      }
    }, [normalizeMessage]);

  useEffect(() => {
    resolveUserIdentity();
  }, [resolveUserIdentity]);

  useEffect(() => {
    if (!identityReady) {
      return;
    }

    let unsubscribe:
      | (() => void)
      | undefined;

    const startChat = async () => {
      const cachedMessages =
        await loadLocalCache();

      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }

      const messagesRef = ref(
        db,
        CHAT_PATH
      );

      unsubscribe = onValue(
        messagesRef,
        async (snapshot) => {
          const value = snapshot.val();

          if (!value) {
            setMessages([]);
            await saveLocalCache([]);
            setFirebaseConnected(true);
            setLoadingMessages(false);
            return;
          }

          const remoteMessages =
            Object.entries(value)
              .map(([id, raw]) =>
                normalizeMessage(
                  raw as LegacyChatMessage,
                  id
                )
              )
              .filter(
                (
                  item
                ): item is ChatMessage =>
                  Boolean(item)
              )
              .sort(
                (a, b) =>
                  new Date(
                    a.timestamp
                  ).getTime() -
                  new Date(
                    b.timestamp
                  ).getTime()
              );

          setMessages(remoteMessages);

          await saveLocalCache(
            remoteMessages
          );

          setFirebaseConnected(true);
          setLoadingMessages(false);

          requestAnimationFrame(() => {
            flatListRef.current?.scrollToEnd(
              {
                animated: false,
              }
            );
          });
        },
        async (error) => {
          console.warn(
            'Firebase chat listener error:',
            error
          );

          setFirebaseConnected(false);
          setLoadingMessages(false);

          if (
            cachedMessages.length === 0
          ) {
            setMessages([]);
          }
        }
      );
    };

    startChat();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [
    identityReady,
    loadLocalCache,
    normalizeMessage,
    saveLocalCache,
  ]);

  const scrollToLatest = useCallback(
    (animated = true) => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated,
        });
      }, 80);
    },
    []
  );

  const handleSend = async () => {
    const trimmedInput = input.trim();

    if (
      !trimmedInput ||
      !identityReady ||
      !currentUserId
    ) {
      return;
    }

    Keyboard.dismiss();

    const newMessage = {
      text: trimmedInput,
      senderId: currentUserId,
      senderName: currentUserName,
      timestamp:
        new Date().toISOString(),
    };

    setInput('');

    try {
      const messagesRef = ref(
        db,
        CHAT_PATH
      );

      await push(
        messagesRef,
        newMessage
      );

      setFirebaseConnected(true);
      scrollToLatest();
    } catch (error) {
      console.warn(
        'Unable to send Firebase message:',
        error
      );

      setFirebaseConnected(false);

      /*
       * Keep the message locally so the user
       * doesn't lose what they just typed.
       */
      const localMessage: ChatMessage = {
        id: `local-${Date.now()}`,
        ...newMessage,
      };

      const updatedMessages = [
        ...messages,
        localMessage,
      ];

      setMessages(updatedMessages);

      await saveLocalCache(
        updatedMessages
      );

      Alert.alert(
        'Message Saved Locally',
        'The message could not reach the shared chat right now. It has been kept on this device.'
      );

      scrollToLatest();
    }
  };

  const formatTime = (
    isoString: string
  ) => {
    const date = new Date(isoString);

    if (
      Number.isNaN(date.getTime())
    ) {
      return '';
    }

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderItem = ({
    item,
  }: {
    item: ChatMessage;
  }) => {
    const isCurrentUser =
      item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageRow,
          isCurrentUser
            ? styles.messageRowRight
            : styles.messageRowLeft,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              maxWidth:
                bubbleMaxWidth,
            },
            isCurrentUser
              ? styles.bubbleRight
              : styles.bubbleLeft,
          ]}
        >
          {!isCurrentUser && (
            <Text
              style={[
                styles.senderName,
                {
                  fontSize:
                    senderFontSize,
                },
              ]}
            >
              {item.senderName}
            </Text>
          )}

          <Text
            style={[
              styles.messageText,
              {
                fontSize:
                  messageFontSize,
              },
              isCurrentUser &&
                styles.messageTextRight,
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[
              styles.timestamp,
              {
                fontSize:
                  timestampFontSize,
              },
              isCurrentUser &&
                styles.timestampRight,
            ]}
          >
            {formatTime(
              item.timestamp
            )}
          </Text>
        </View>
      </View>
    );
  };

  const emptyState = useMemo(
    () => (
      <View
        style={styles.emptyContainer}
      >
        <View
          style={[
            styles.emptyIcon,
            isTablet && {
              width: 72,
              height: 72,
              borderRadius: 36,
            },
          ]}
        >
          <Text
            style={[
              styles.emptyIconText,
              isTablet && {
                fontSize: 31,
              },
            ]}
          >
            💬
          </Text>
        </View>

        <Text
          style={[
            styles.emptyTitle,
            isTablet && {
              fontSize: 22,
            },
          ]}
        >
          Start the conversation
        </Text>

        <Text
          style={[
            styles.emptyText,
            isTablet && {
              fontSize: 16,
              lineHeight: 23,
            },
          ]}
        >
          Share an update with the
          caregiving team.
        </Text>
      </View>
    ),
    [isTablet]
  );

  return (
    <View style={styles.screen}>
      <NavHeader />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.chatContainer,
            isTablet &&
              styles.chatContainerTablet,
          ]}
        >
          <View style={styles.chatHeading}>
            <View style={styles.headingText}>
              <Text
                style={[
                  styles.pageTitle,
                  isTablet && {
                    fontSize: 27,
                  },
                ]}
              >
                Care Team Chat
              </Text>

              <Text
                style={[
                  styles.pageSubtitle,
                  isTablet && {
                    fontSize: 15,
                  },
                ]}
              >
                Signed in as{' '}
                {currentUserName}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.helpButton,
                isTablet && {
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                },
              ]}
              onPress={() =>
                setHelpVisible(true)
              }
              activeOpacity={0.75}
            >
              <Text
                style={styles.helpButtonText}
              >
                ?
              </Text>
            </TouchableOpacity>
          </View>

          {!firebaseConnected && (
            <View
              style={
                styles.offlineBanner
              }
            >
              <Text
                style={
                  styles.offlineText
                }
              >
                Shared chat is temporarily
                unavailable. Showing saved
                messages.
              </Text>
            </View>
          )}

          {loadingMessages ? (
            <View
              style={
                styles.loadingContainer
              }
            >
              <ActivityIndicator
                size="large"
                color="#1976D2"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading messages...
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) =>
                item.id
              }
              renderItem={renderItem}
              style={styles.messageList}
              contentContainerStyle={[
                styles.messagesContainer,
                messages.length === 0 &&
                  styles.emptyListContainer,
              ]}
              ListEmptyComponent={
                emptyState
              }
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === 'ios'
                  ? 'interactive'
                  : 'on-drag'
              }
              onContentSizeChange={() => {
                if (
                  messages.length > 0
                ) {
                  scrollToLatest(
                    false
                  );
                }
              }}
            />
          )}

          <View
            style={[
              styles.composer,
              isTablet &&
                styles.composerTablet,
            ]}
          >
            <TextInput
              style={[
                styles.messageInput,
                isTablet && {
                  fontSize: 17,
                  minHeight: 52,
                  borderRadius: 18,
                },
              ]}
              placeholder="Message the care team..."
              placeholderTextColor="#A0A4AA"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              returnKeyType="default"
              textAlignVertical="center"
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                !input.trim() &&
                  styles.sendButtonDisabled,
                isTablet && {
                  minHeight: 52,
                  paddingHorizontal: 24,
                  borderRadius: 18,
                },
              ]}
              onPress={handleSend}
              activeOpacity={0.8}
              disabled={
                !input.trim()
              }
            >
              <Text
                style={[
                  styles.sendButtonText,
                  isTablet && {
                    fontSize: 16,
                  },
                ]}
              >
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setHelpVisible(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalBox,
              isTablet && {
                maxWidth: 440,
                padding: 26,
              },
            ]}
          >
            <Text
              style={styles.modalTitle}
            >
              Care Team Chat
            </Text>

            <Text
              style={styles.helpText}
            >
              Use Chat to share updates
              with the caregiving team.
              Messages are shown under
              the name connected to your
              signed-in account.
            </Text>

            <Pressable
              style={styles.gotItButton}
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
    backgroundColor: '#F7F8FA',
  },

  keyboardContainer: {
    flex: 1,
  },

  chatContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },

  chatContainerTablet: {
    maxWidth: 980,
  },

  chatHeading: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#F7F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  headingText: {
    flex: 1,
    paddingRight: 12,
  },

  pageTitle: {
    color: '#151515',
    fontSize: 22,
    fontWeight: '700',
  },

  pageSubtitle: {
    color: '#747A82',
    fontSize: 13,
    marginTop: 3,
  },

  helpButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE2E6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  helpButtonText: {
    color: '#1976D2',
    fontSize: 19,
    fontWeight: '700',
  },

  offlineBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#FFF4D8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  offlineText: {
    color: '#78601C',
    fontSize: 12,
    textAlign: 'center',
  },

  messageList: {
    flex: 1,
  },

  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },

  emptyListContainer: {
    flexGrow: 1,
  },

  messageRow: {
    width: '100%',
    marginBottom: 9,
  },

  messageRowLeft: {
    alignItems: 'flex-start',
  },

  messageRowRight: {
    alignItems: 'flex-end',
  },

  messageBubble: {
    minWidth: 76,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 20,
  },

  bubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E4E8',
    borderBottomLeftRadius: 6,
  },

  bubbleRight: {
    backgroundColor: '#1976D2',
    borderBottomRightRadius: 6,
  },

  senderName: {
    color: '#1976D2',
    fontWeight: '700',
    marginBottom: 4,
  },

  messageText: {
    color: '#1A1A1A',
    lineHeight: 22,
  },

  messageTextRight: {
    color: '#FFFFFF',
  },

  timestamp: {
    color: '#8A9097',
    marginTop: 5,
    textAlign: 'right',
  },

  timestampRight: {
    color: '#DCEBFA',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 80,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#E5F2FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyIconText: {
    fontSize: 27,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#27292D',
    marginBottom: 5,
  },

  emptyText: {
    maxWidth: 310,
    textAlign: 'center',
    color: '#7B8087',
    fontSize: 14,
    lineHeight: 20,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#777',
    fontSize: 14,
    marginTop: 10,
  },

  composer: {
    minHeight: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E3E7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  composerTablet: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  messageInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: '#D5D9DE',
    borderRadius: 17,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 15,
    paddingTop: 11,
    paddingBottom: 11,
    marginRight: 9,
    color: '#151515',
    fontSize: 16,
  },

  sendButton: {
    minHeight: 46,
    paddingHorizontal: 19,
    borderRadius: 17,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    backgroundColor: '#B9CFE7',
  },

  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },

  modalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    padding: 22,
    backgroundColor: '#FFFFFF',
  },

  modalTitle: {
    color: '#151515',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },

  helpText: {
    color: '#4E5359',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },

  gotItButton: {
    minHeight: 48,
    borderRadius: 12,
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