/**
 * Chat screen — v1 MessageScreen style.
 * Gold bubbles for outgoing, glass bubbles for incoming.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import { formatMessageTime } from '@hyve/utils';
import type { Friend } from '@hyve/types';
import HyveAvatar from '../components/ui/HyveAvatar';
import { Clock, MapPin, Camera, Smile, Send, MoreVertical } from '../components/icons';
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
  | { type: 'system'; data: { id: string; session: FocusSession; timestamp: string } }
  | { type: 'dateSeparator'; data: { id: string; label: string } };

// Format a date into a separator label
function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';

  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  return `${weekday}, ${month} ${day}`;
}

// Get the date string (YYYY-MM-DD) from a ChatItem for grouping
function getItemDateKey(item: ChatItem): string {
  if (item.type === 'dateSeparator') return '';
  const raw = item.type === 'text' ? item.data.createdAt : item.data.timestamp;
  if (!raw) return '';
  const d = new Date(raw);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Insert date separators between items with different dates
function insertDateSeparators(items: ChatItem[]): ChatItem[] {
  if (items.length === 0) return items;
  const result: ChatItem[] = [];
  let prevDateKey = '';

  for (const item of items) {
    const dateKey = getItemDateKey(item);
    if (dateKey && dateKey !== prevDateKey) {
      const raw = item.type === 'text' ? item.data.createdAt : (item as any).data.timestamp;
      result.push({
        type: 'dateSeparator',
        data: { id: `sep-${dateKey}`, label: getDateLabel(new Date(raw)) },
      });
      prevDateKey = dateKey;
    }
    result.push(item);
  }
  return result;
}

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
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{friend.name ?? 'Chat'}</Text>
            <Text
              style={[
                styles.headerStatus,
                { color: (friend as any).isOnline ? Colors.online : Colors.text3 },
              ]}
            >
              {(friend as any).isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity style={styles.headerMoreButton} activeOpacity={0.7}>
          <MoreVertical color={Colors.text3} size={18} />
        </TouchableOpacity>
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
        const timeA = a.type === 'text' ? a.data.createdAt ?? '' : (a as any).data.timestamp;
        const timeB = b.type === 'text' ? b.data.createdAt ?? '' : (b as any).data.timestamp;
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

  // Memoize items with date separators inserted
  const displayItems = useMemo(() => {
    const withSeps = insertDateSeparators(chatItems);
    return [...withSeps].reverse();
  }, [chatItems]);

  const renderSystemMessage = (session: FocusSession) => {
    const firstMemory = session.memories?.[0];
    const allPhotoUrls: string[] = [];
    session.memories?.forEach((mem) => {
      if (mem.photos?.length) allPhotoUrls.push(...mem.photos);
    });
    const photoUrls = allPhotoUrls.slice(0, 8);
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
        {photoUrls.length > 0 && (
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
        )}
      </View>
    );
  };

  const renderItem = ({ item }: { item: ChatItem }) => {
    if (item.type === 'dateSeparator') {
      return (
        <View style={styles.dateSeparatorRow}>
          <Text style={styles.dateSeparatorText}>{item.data.label}</Text>
        </View>
      );
    }

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
        </View>
        <Text style={[styles.timestamp, isMe && styles.timestampMe]}>
          {formatMessageTime(msg.createdAt)}
        </Text>
      </View>
    );
  };

  const hasInput = inputValue.trim().length > 0;

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
        data={displayItems}
        inverted
        keyExtractor={(item) => {
          if (item.type === 'dateSeparator') return item.data.id;
          return item.type === 'text' ? item.data.id : item.data.id;
        }}
        renderItem={renderItem}
        style={styles.list}
        onContentSizeChange={() => {
          if (shouldScrollToBottom.current) {
            shouldScrollToBottom.current = false;
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.listEmpty}>
            <Text style={styles.empty}>No messages yet. Say hi! 👋</Text>
          </View>
        }
        contentContainerStyle={
          displayItems.length === 0
            ? [styles.listContent, { flexGrow: 1 }]
            : styles.listContent
        }
      />

      {/* Input row */}
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.mediaButton} activeOpacity={0.7}>
          <Camera color={Colors.text3} size={22} strokeWidth={1.5} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Message..."
            placeholderTextColor={Colors.muted}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity style={styles.emojiButton} activeOpacity={0.7}>
            <Smile color={Colors.text3} size={20} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={!hasInput || sending}
          activeOpacity={0.7}
          style={styles.sendButton}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.text3} />
          ) : (
            <Send
              color={hasInput ? Colors.gold : Colors.text3}
              size={22}
              strokeWidth={1.5}
            />
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
  headerInfo: {
    flexDirection: 'column',
  },
  headerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text1,
    lineHeight: 18,
  },
  headerStatus: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
  headerMoreButton: {
    padding: Space.xs,
    marginRight: Space.xs,
  },

  // Date separator
  dateSeparatorRow: {
    alignItems: 'center',
    paddingVertical: Space.lg,
  },
  dateSeparatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text3,
    letterSpacing: 2,
    textTransform: 'uppercase',
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
    borderTopRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderTopLeftRadius: 4,
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
    paddingHorizontal: 2,
  },
  timestampMe: {
    color: Colors.muted,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scaleY: -1 }],
  },
  empty: {
    color: Colors.muted,
    fontSize: 14,
    textAlign: 'center',
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
    width: Math.round(Dimensions.get('window').width * 0.8),
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: Space.xs,
    overflow: 'hidden',
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
    gap: Space.md,
    paddingHorizontal: Space.lg,
    paddingTop: Space.sm,
    paddingBottom: Platform.OS === 'ios' ? 28 : Space.md,
    backgroundColor: Colors.bg0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  mediaButton: {
    paddingBottom: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: Radius.full,
    paddingLeft: Space.lg,
    paddingRight: Space.xs,
  },
  input: {
    flex: 1,
    color: Colors.text1,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  emojiButton: {
    paddingHorizontal: Space.sm,
    paddingBottom: 10,
  },
  sendButton: {
    paddingBottom: 10,
  },
});
