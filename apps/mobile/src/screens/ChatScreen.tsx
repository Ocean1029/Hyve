/**
 * Chat screen — ver2 MessageScreen style.
 * Gold bubbles for outgoing, glass bubbles for incoming.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import { formatMessageTime } from '@hyve/utils';
import type { Friend } from '@hyve/types';
import HyveAvatar from '../components/ui/HyveAvatar';
import { Clock, MapPin } from '../components/icons';
import { Colors, Radius, Space, Shadows } from '../theme';

type MessagesStackParamList = {
  MessagesList: undefined;
  Chat: { friend: Friend };
};

type ChatScreenRouteProp = NativeStackScreenProps<MessagesStackParamList, 'Chat'>['route'];

interface ApiMessage {
  id: string;
  friendId: string;
  senderId: string;
  content: string;
  createdAt?: string;
}

interface FocusSession {
  id: string;
  startTime?: string;
  endTime?: string | null;
  minutes?: number;
  createdAt?: string;
  memories?: Array<{
    id: string;
    type?: string | null;
    content?: string | null;
    timestamp?: string;
    location?: string | null;
    photos?: string[];
  }>;
}

type ChatItem =
  | { type: 'text'; data: ApiMessage }
  | { type: 'system'; data: { id: string; session: FocusSession; timestamp: string } };

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { friend } = route.params;
  const { apiClient, user } = useAuth();
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const shouldScrollToBottom = useRef(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <HyveAvatar uri={friend.avatar} name={friend.name} size={30} />
          <Text style={styles.headerName}>{friend.name ?? 'Chat'}</Text>
        </View>
      ),
      headerStyle: { backgroundColor: Colors.bg1 },
      headerTintColor: Colors.ivory,
      headerBackTitleVisible: false,
      headerBackButtonDisplayMode: 'minimal',
    });
  }, [friend, navigation]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const [messagesRes, sessionsRes] = await Promise.all([
        apiClient.get<{ messages: ApiMessage[] }>(
          `${API_PATHS.MESSAGES}?friendId=${encodeURIComponent(friend.id)}&limit=50`
        ),
        apiClient.get<{ success: boolean; sessions?: FocusSession[] }>(
          API_PATHS.MESSAGES_SESSIONS(friend.id)
        ),
      ]);

      const textMessages = (
        messagesRes && 'messages' in messagesRes && Array.isArray(messagesRes.messages)
          ? messagesRes.messages
          : []
      ) as ApiMessage[];
      const sessions = (sessionsRes?.sessions ?? []) as FocusSession[];

      const items: ChatItem[] = [];
      textMessages.forEach((msg) => items.push({ type: 'text', data: msg }));
      sessions.forEach((session) => {
        const endTime = session.endTime ?? session.createdAt ?? '';
        const ts = endTime ? new Date(endTime).toISOString() : new Date().toISOString();
        items.push({
          type: 'system',
          data: { id: `session-${session.id}`, session, timestamp: ts },
        });
      });

      items.sort((a, b) => {
        const timeA = a.type === 'text' ? a.data.createdAt ?? '' : a.data.timestamp;
        const timeB = b.type === 'text' ? b.data.createdAt ?? '' : b.data.timestamp;
        return new Date(timeA).getTime() - new Date(timeB).getTime();
      });

      setChatItems(items);
      shouldScrollToBottom.current = true;
    } catch {
      setChatItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [friend.id, apiClient]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || sending || !user) return;

    setInputValue('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ApiMessage = {
      id: tempId,
      friendId: friend.id,
      senderId: user.id,
      content,
      createdAt: new Date().toISOString(),
    };
    setChatItems((prev) => [...prev, { type: 'text', data: optimisticMsg }]);
    shouldScrollToBottom.current = true;

    try {
      const res = await apiClient.post<{ message: ApiMessage }>(API_PATHS.MESSAGES, {
        friendId: friend.id,
        content,
      });
      if (res?.message) {
        setChatItems((prev) =>
          prev.map((it) =>
            it.type === 'text' && it.data.id === tempId
              ? { type: 'text' as const, data: res!.message! }
              : it
          )
        );
      }
    } catch {
      setChatItems((prev) =>
        prev.filter((it) => !(it.type === 'text' && it.data.id === tempId))
      );
    } finally {
      setSending(false);
    }
  };

  const renderSystemMessage = (session: FocusSession) => {
    const firstMemory = session.memories?.[0];
    const allPhotoUrls: string[] = [];
    session.memories?.forEach((mem) => {
      if (mem.photos?.length) allPhotoUrls.push(...mem.photos);
    });
    const photoUrls =
      allPhotoUrls.length > 0
        ? allPhotoUrls.slice(0, 8)
        : ['https://picsum.photos/200/200?random=201'];
    const durationMinutes = session.minutes ?? 0;
    const formattedDuration =
      durationMinutes > 0
        ? durationMinutes >= 60
          ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
          : `${durationMinutes}m`
        : 'N/A';
    const location = firstMemory?.location ?? 'Unknown Location';

    return (
      <View style={styles.systemCard}>
        <View style={styles.systemCardHeader}>
          <View style={styles.systemCardDot} />
          <Text style={styles.systemCardTitle}>Session Complete</Text>
        </View>
        <View style={styles.systemCardRow}>
          <Clock color={Colors.muted} size={12} />
          <Text style={styles.systemCardText}>{formattedDuration}</Text>
        </View>
        <View style={styles.systemCardRow}>
          <MapPin color={Colors.muted} size={12} />
          <Text style={styles.systemCardText} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
          nestedScrollEnabled
        >
          {photoUrls.map((uri, idx) => (
            <Image
              key={idx}
              source={{ uri }}
              style={styles.sessionPhoto}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ChatItem }) => {
    if (item.type === 'system') {
      return (
        <View style={styles.systemRow}>
          {renderSystemMessage(item.data.session)}
          <Text style={styles.systemTimestamp}>
            {formatMessageTime(item.data.timestamp)}
          </Text>
        </View>
      );
    }
    const msg = item.data;
    const isMe = msg.senderId === user?.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
            {msg.content}
          </Text>
          <Text style={[styles.timestamp, isMe && styles.timestampMe]}>
            {formatMessageTime(msg.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={[...chatItems].reverse()}
        inverted
        keyExtractor={(item) => (item.type === 'text' ? item.data.id : item.data.id)}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => {
          if (shouldScrollToBottom.current) {
            shouldScrollToBottom.current = false;
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>No messages yet. Say hi! 👋</Text>
        }
      />

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={`Message ${friend.name ?? 'friend'}...`}
          placeholderTextColor={Colors.muted}
          multiline
          maxLength={1000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputValue.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputValue.trim() || sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg1,
  },

  // Custom header
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text1,
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Space.lg,
    paddingVertical: Space.lg,
    gap: Space.sm,
  },

  // Messages
  messageRow: {
    marginBottom: 4,
  },
  messageRowMe: {
    alignItems: 'flex-end',
  },
  messageRowThem: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.xl,
  },
  bubbleMe: {
    backgroundColor: Colors.gold,
    borderBottomRightRadius: 4,
    ...Shadows.gold,
  },
  bubbleThem: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: Colors.text1,
    lineHeight: 21,
  },
  bubbleTextMe: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestampMe: {
    color: 'rgba(0,0,0,0.45)',
  },
  empty: {
    color: Colors.muted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 48,
  },

  // System messages
  systemRow: {
    alignItems: 'center',
    marginBottom: Space.md,
    gap: Space.xs,
  },
  systemCard: {
    backgroundColor: Colors.surface1,
    borderRadius: Radius.xl,
    padding: Space.md,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: Space.xs,
  },
  systemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    marginBottom: 4,
  },
  systemCardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  systemCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text2,
    letterSpacing: 0.5,
  },
  systemCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
  },
  systemCardText: {
    fontSize: 11,
    color: Colors.text3,
  },
  photosScroll: {
    marginTop: Space.sm,
    height: 56,
  },
  sessionPhoto: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    marginRight: Space.xs,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  systemTimestamp: {
    fontSize: 10,
    color: Colors.muted,
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Space.sm,
    paddingHorizontal: Space.md,
    paddingTop: Space.sm,
    paddingBottom: Platform.OS === 'ios' ? 28 : Space.md,
    backgroundColor: 'rgba(12, 13, 16, 0.98)',
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    color: Colors.text1,
    borderRadius: Radius.xl,
    paddingHorizontal: Space.md,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.gold,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surface2,
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 18,
    color: '#000',
    fontWeight: '700',
  },
});
