// app/(tabs)/photos.tsx

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

import NavHeader from '@/components/NavHeader';
import {
  getSessionSafe,
  supabase,
} from '@/lib/supabase';

type ChatMessage = {
  id: string;
  team_owner_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
};

type ProfileRecord = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type TeamMembership = {
  owner_id: string;
  created_at: string | null;
};

const MESSAGE_LIMIT = 1000;

export default function ChatScreen() {
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const flatListRef =
    useRef<FlatList<ChatMessage>>(null);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [input, setInput] =
    useState('');

  const [currentUserId, setCurrentUserId] =
    useState('');

  const [currentUserName, setCurrentUserName] =
    useState('');

  const [teamOwnerId, setTeamOwnerId] =
    useState('');

  const [identityReady, setIdentityReady] =
    useState(false);

  const [loadingMessages, setLoadingMessages] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [realtimeConnected, setRealtimeConnected] =
    useState(false);

  const [helpVisible, setHelpVisible] =
    useState(false);

  const [chatError, setChatError] =
    useState('');

  const bubbleMaxWidth = isTablet
    ? Math.min(width * 0.58, 560)
    : width * 0.78;

  const messageFontSize =
    isTablet ? 18 : 16;

  const senderFontSize =
    isTablet ? 14 : 12;

  const timestampFontSize =
    isTablet ? 12 : 10;

  const getCacheKey = useCallback(
    (ownerId: string) =>
      `carekeeperhub_team_chat_${ownerId}`,
    []
  );

  const saveLocalCache = useCallback(
    async (
      ownerId: string,
      updatedMessages: ChatMessage[]
    ) => {
      if (!ownerId) {
        return;
      }

      try {
        await AsyncStorage.setItem(
          getCacheKey(ownerId),
          JSON.stringify(updatedMessages)
        );
      } catch (error) {
        console.warn(
          'Unable to save team chat cache:',
          error
        );
      }
    },
    [getCacheKey]
  );

  const loadLocalCache = useCallback(
    async (
      ownerId: string
    ): Promise<ChatMessage[]> => {
      if (!ownerId) {
        return [];
      }

      try {
        const saved =
          await AsyncStorage.getItem(
            getCacheKey(ownerId)
          );

        if (!saved) {
          return [];
        }

        const parsed =
          JSON.parse(saved);

        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed
          .filter(
            (item): item is ChatMessage =>
              Boolean(
                item &&
                  typeof item.id === 'string' &&
                  typeof item.team_owner_id ===
                    'string' &&
                  typeof item.sender_id ===
                    'string' &&
                  typeof item.sender_name ===
                    'string' &&
                  typeof item.message ===
                    'string' &&
                  typeof item.created_at ===
                    'string'
              )
          )
          .sort(
            (a, b) =>
              new Date(
                a.created_at
              ).getTime() -
              new Date(
                b.created_at
              ).getTime()
          );
      } catch (error) {
        console.warn(
          'Unable to load team chat cache:',
          error
        );

        return [];
      }
    },
    [getCacheKey]
  );

  const buildProfileName = useCallback(
    (
      profile: ProfileRecord | null,
      fallbackEmail?: string
    ) => {
      const firstName =
        profile?.first_name?.trim() ?? '';

      const lastName =
        profile?.last_name?.trim() ?? '';

      const fullName =
        [firstName, lastName]
          .filter(Boolean)
          .join(' ')
          .trim();

      if (fullName) {
        return fullName;
      }

      const email =
        profile?.email?.trim() ||
        fallbackEmail?.trim() ||
        '';

      if (email) {
        return email
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(
            /\b\w/g,
            (letter) =>
              letter.toUpperCase()
          );
      }

      return 'Caregiver';
    },
    []
  );

  const resolveChatIdentity =
    useCallback(async () => {
      try {
        setIdentityReady(false);
        setChatError('');

        const session =
          await getSessionSafe();

        if (!session?.user) {
          setChatError(
            'Your login session could not be found. Please sign in again.'
          );
          return;
        }

        const user =
          session.user;

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select(
            'id, first_name, last_name, email'
          )
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.warn(
            'Unable to load chat profile:',
            profileError
          );
        }

        const profile =
          (profileData as ProfileRecord | null) ??
          null;

        const displayName =
          buildProfileName(
            profile,
            user.email
          );

        setCurrentUserId(
          user.id
        );

        setCurrentUserName(
          displayName
        );

        /*
         * Determine which care-team chat this user belongs to.
         *
         * If this user appears as a member in team_members,
         * their chat belongs to that owner.
         *
         * If they are not a member of another owner's team,
         * they are treated as the owner of their own care team.
         */
        const {
          data: membershipData,
          error: membershipError,
        } = await supabase
          .from('team_members')
          .select(
            'owner_id, created_at'
          )
          .eq(
            'member_user_id',
            user.id
          )
          .order(
            'created_at',
            {
              ascending: true,
            }
          )
          .limit(2);

        if (membershipError) {
          throw membershipError;
        }

        const memberships =
          (membershipData ??
            []) as TeamMembership[];

        if (
          memberships.length > 1
        ) {
          console.warn(
            'User belongs to multiple care teams. Using the first membership.'
          );
        }

        const resolvedOwnerId =
          memberships.length > 0
            ? memberships[0].owner_id
            : user.id;

        setTeamOwnerId(
          resolvedOwnerId
        );
      } catch (error: any) {
        console.warn(
          'Unable to prepare team chat:',
          error
        );

        setChatError(
          error?.message ??
            'Care Team Chat could not be prepared.'
        );
      } finally {
        setIdentityReady(true);
      }
    }, [buildProfileName]);

  useEffect(() => {
    resolveChatIdentity();
  }, [resolveChatIdentity]);

  const scrollToLatest =
    useCallback(
      (
        animated = true
      ) => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd(
            {
              animated,
            }
          );
        }, 80);
      },
      []
    );

  const loadMessages =
    useCallback(
      async (
        ownerId: string,
        showLoading = false
      ) => {
        if (!ownerId) {
          return;
        }

        if (showLoading) {
          setLoadingMessages(
            true
          );
        }

        try {
          const {
            data,
            error,
          } = await supabase
            .from(
              'team_messages'
            )
            .select(
              `
                id,
                team_owner_id,
                sender_id,
                sender_name,
                message,
                created_at
              `
            )
            .eq(
              'team_owner_id',
              ownerId
            )
            .order(
              'created_at',
              {
                ascending: true,
              }
            );

          if (error) {
            throw error;
          }

          const remoteMessages =
            (data ??
              []) as ChatMessage[];

          setMessages(
            remoteMessages
          );

          await saveLocalCache(
            ownerId,
            remoteMessages
          );

          setChatError('');

          requestAnimationFrame(
            () => {
              scrollToLatest(
                false
              );
            }
          );
        } catch (error: any) {
          console.warn(
            'Unable to load team messages:',
            error
          );

          const cachedMessages =
            await loadLocalCache(
              ownerId
            );

          setMessages(
            cachedMessages
          );

          setChatError(
            cachedMessages.length >
              0
              ? 'Live chat is temporarily unavailable. Showing saved messages.'
              : error?.message ??
                  'Care Team Chat is temporarily unavailable.'
          );
        } finally {
          setLoadingMessages(
            false
          );
        }
      },
      [
        loadLocalCache,
        saveLocalCache,
        scrollToLatest,
      ]
    );

  useEffect(() => {
    if (
      !identityReady ||
      !teamOwnerId ||
      !currentUserId
    ) {
      return;
    }

    let mounted = true;

    const startChat =
      async () => {
        const cachedMessages =
          await loadLocalCache(
            teamOwnerId
          );

        if (
          mounted &&
          cachedMessages.length >
            0
        ) {
          setMessages(
            cachedMessages
          );
        }

        if (mounted) {
          await loadMessages(
            teamOwnerId,
            true
          );
        }
      };

    startChat();

    const channel =
      supabase
        .channel(
          `team-chat-${teamOwnerId}-${currentUserId}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_messages',
            filter:
              `team_owner_id=eq.${teamOwnerId}`,
          },
          () => {
            if (mounted) {
              void loadMessages(
                teamOwnerId,
                false
              );
            }
          }
        )
        .subscribe(
          (status) => {
            if (!mounted) {
              return;
            }

            if (
              status ===
              'SUBSCRIBED'
            ) {
              setRealtimeConnected(
                true
              );
              return;
            }

            if (
              status ===
                'CHANNEL_ERROR' ||
              status ===
                'TIMED_OUT' ||
              status ===
                'CLOSED'
            ) {
              setRealtimeConnected(
                false
              );
            }
          }
        );

    return () => {
      mounted = false;

      void supabase.removeChannel(
        channel
      );
    };
  }, [
    currentUserId,
    identityReady,
    loadLocalCache,
    loadMessages,
    teamOwnerId,
  ]);

  const handleSend =
    async () => {
      const trimmedInput =
        input.trim();

      if (
        !trimmedInput ||
        !identityReady ||
        !currentUserId ||
        !currentUserName ||
        !teamOwnerId ||
        sending
      ) {
        return;
      }

      Keyboard.dismiss();

      setSending(true);
      setInput('');

      try {
        const {
          data,
          error,
        } = await supabase
          .from(
            'team_messages'
          )
          .insert({
            team_owner_id:
              teamOwnerId,
            sender_id:
              currentUserId,
            sender_name:
              currentUserName,
            message:
              trimmedInput,
          })
          .select(
            `
              id,
              team_owner_id,
              sender_id,
              sender_name,
              message,
              created_at
            `
          )
          .single();

        if (error) {
          throw error;
        }

        const insertedMessage =
          data as ChatMessage;

        setMessages(
          (
            previousMessages
          ) => {
            const alreadyExists =
              previousMessages.some(
                (item) =>
                  item.id ===
                  insertedMessage.id
              );

            if (
              alreadyExists
            ) {
              return previousMessages;
            }

            const updated = [
              ...previousMessages,
              insertedMessage,
            ];

            void saveLocalCache(
              teamOwnerId,
              updated
            );

            return updated;
          }
        );

        setChatError('');
        scrollToLatest();
      } catch (error: any) {
        console.warn(
          'Unable to send team message:',
          error
        );

        setInput(
          trimmedInput
        );

        Alert.alert(
          'Message Not Sent',
          error?.message ??
            'Your message could not be sent. Please try again.'
        );
      } finally {
        setSending(false);
      }
    };

  const formatTime = (
    isoString: string
  ) => {
    const date =
      new Date(
        isoString
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '';
    }

    return date.toLocaleTimeString(
      [],
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    );
  };

  const renderItem = ({
    item,
  }: {
    item: ChatMessage;
  }) => {
    const isCurrentUser =
      item.sender_id ===
      currentUserId;

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
              {
                item.sender_name
              }
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
            {item.message}
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
              item.created_at
            )}
          </Text>
        </View>
      </View>
    );
  };

  const emptyState =
    useMemo(
      () => (
        <View
          style={
            styles.emptyContainer
          }
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
            Share an update with
            your care team.
          </Text>
        </View>
      ),
      [isTablet]
    );

  const canSend =
    Boolean(
      input.trim() &&
        currentUserId &&
        teamOwnerId &&
        identityReady &&
        !sending
    );

  return (
    <View style={styles.screen}>
      <NavHeader />

      <KeyboardAvoidingView
        style={
          styles.keyboardContainer
        }
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        keyboardVerticalOffset={
          0
        }
      >
        <View
          style={[
            styles.chatContainer,
            isTablet &&
              styles.chatContainerTablet,
          ]}
        >
          <View
            style={
              styles.chatHeading
            }
          >
            <View
              style={
                styles.headingText
              }
            >
              <View
                style={
                  styles.titleRow
                }
              >
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

                {realtimeConnected && (
                  <View
                    style={
                      styles.liveBadge
                    }
                  >
                    <View
                      style={
                        styles.liveDot
                      }
                    />
                    <Text
                      style={
                        styles.liveText
                      }
                    >
                      Live
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.pageSubtitle,
                  isTablet && {
                    fontSize: 15,
                  },
                ]}
              >
                {currentUserName
                  ? `Signed in as ${currentUserName}`
                  : 'Preparing your care team...'}
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
                setHelpVisible(
                  true
                )
              }
              activeOpacity={
                0.75
              }
            >
              <Text
                style={
                  styles.helpButtonText
                }
              >
                ?
              </Text>
            </TouchableOpacity>
          </View>

          {chatError ? (
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
                {chatError}
              </Text>
            </View>
          ) : null}

          {!identityReady ||
          loadingMessages ? (
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
                Loading care team chat...
              </Text>
            </View>
          ) : (
            <FlatList
              ref={
                flatListRef
              }
              data={
                messages
              }
              keyExtractor={(
                item
              ) => item.id}
              renderItem={
                renderItem
              }
              style={
                styles.messageList
              }
              contentContainerStyle={[
                styles.messagesContainer,
                messages.length ===
                  0 &&
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
                Platform.OS ===
                'ios'
                  ? 'interactive'
                  : 'on-drag'
              }
              onContentSizeChange={() => {
                if (
                  messages.length >
                  0
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
              onChangeText={
                setInput
              }
              multiline
              maxLength={
                MESSAGE_LIMIT
              }
              returnKeyType="default"
              textAlignVertical="center"
              editable={
                identityReady &&
                Boolean(
                  teamOwnerId
                ) &&
                !sending
              }
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                !canSend &&
                  styles.sendButtonDisabled,
                isTablet && {
                  minHeight: 52,
                  paddingHorizontal: 24,
                  borderRadius: 18,
                },
              ]}
              onPress={
                handleSend
              }
              activeOpacity={
                0.8
              }
              disabled={
                !canSend
              }
            >
              {sending ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
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
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={
          helpVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setHelpVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
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
              style={
                styles.modalTitle
              }
            >
              Care Team Chat
            </Text>

            <Text
              style={
                styles.helpText
              }
            >
              Use Chat to share
              updates with your care
              team. Only the care-team
              owner and users added as
              Team Members can access
              this conversation.
            </Text>

            <Pressable
              style={
                styles.gotItButton
              }
              onPress={() =>
                setHelpVisible(
                  false
                )
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

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        '#F7F8FA',
    },

    keyboardContainer: {
      flex: 1,
    },

    chatContainer: {
      flex: 1,
      width: '100%',
      alignSelf:
        'center',
    },

    chatContainerTablet: {
      maxWidth: 980,
    },

    chatHeading: {
      minHeight: 76,
      paddingHorizontal: 18,
      paddingVertical: 14,
      backgroundColor:
        '#F7F8FA',
      borderBottomWidth: 1,
      borderBottomColor:
        '#E5E7EA',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    headingText: {
      flex: 1,
      paddingRight: 12,
    },

    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
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

    liveBadge: {
      marginLeft: 9,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor:
        '#E8F5EE',
      flexDirection: 'row',
      alignItems: 'center',
    },

    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor:
        '#2E9B61',
      marginRight: 5,
    },

    liveText: {
      color: '#26784D',
      fontSize: 11,
      fontWeight: '700',
    },

    helpButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DFE2E6',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    helpButtonText: {
      color: '#1976D2',
      fontSize: 19,
      fontWeight: '700',
    },

    offlineBanner: {
      marginHorizontal: 16,
      marginTop: 10,
      backgroundColor:
        '#FFF4D8',
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
      alignItems:
        'flex-start',
    },

    messageRowRight: {
      alignItems:
        'flex-end',
    },

    messageBubble: {
      minWidth: 76,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 8,
      borderRadius: 20,
    },

    bubbleLeft: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E1E4E8',
      borderBottomLeftRadius: 6,
    },

    bubbleRight: {
      backgroundColor:
        '#1976D2',
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
      justifyContent:
        'center',
      alignItems:
        'center',
      paddingHorizontal: 30,
      paddingBottom: 80,
    },

    emptyIcon: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor:
        '#E5F2FC',
      alignItems:
        'center',
      justifyContent:
        'center',
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
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    loadingText: {
      color: '#777',
      fontSize: 14,
      marginTop: 10,
    },

    composer: {
      minHeight: 72,
      backgroundColor:
        '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor:
        '#E0E3E7',
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems:
        'flex-end',
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
      borderColor:
        '#D5D9DE',
      borderRadius: 17,
      backgroundColor:
        '#F9FAFB',
      paddingHorizontal: 15,
      paddingTop: 11,
      paddingBottom: 11,
      marginRight: 9,
      color: '#151515',
      fontSize: 16,
    },

    sendButton: {
      minHeight: 46,
      minWidth: 78,
      paddingHorizontal: 19,
      borderRadius: 17,
      backgroundColor:
        '#1976D2',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    sendButtonDisabled: {
      backgroundColor:
        '#B9CFE7',
    },

    sendButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.45)',
      justifyContent:
        'center',
      alignItems:
        'center',
      padding: 22,
    },

    modalBox: {
      width: '100%',
      maxWidth: 380,
      borderRadius: 18,
      padding: 22,
      backgroundColor:
        '#FFFFFF',
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
      backgroundColor:
        '#1976D2',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    gotItButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
  });