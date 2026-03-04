/**
 * Chat screen. Displays conversation with a friend and allows sending messages.
 * Uses GET/POST /api/messages for message history and sending.
 * Also fetches focus sessions and displays "Session Complete" system messages.
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
import { Clock, MapPin } from '../components/icons';

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
      headerTitle: friend.name ?? 'Chat',
      headerStyle: { backgroundColor: '#000' },
      headerTintColor: '#fff',
      headerBackTitle: 'Back',
    });
  }, [friend.name, navigation]);

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

      const textMessages = (messagesRes && 'messages' in messagesRes && Array.isArray(messagesRes.messages)
        ? messagesRes.messages
        : []) as ApiMessage[];
      const sessions = (sessionsRes?.sessions ?? []) as FocusSession[];

      const items: ChatItem[] = [];

      textMessages.forEach((msg) => {
        items.push({ type: 'text', data: msg });
      });

      sessions.forEach((session) => {
        const endTime = session.endTime ?? session.createdAt ?? '';
        const ts = endTime ? new Date(endTime).toISOString() : new Date().toISOString();
        items.push({
          type: 'system',
          data: { id: `session-${session.id}`, session, timestamp: ts },
        });
      });

      items.sort((a, b) => {
        const timeA =
          a.type === 'text'
            ? a.data.createdAt ?? ''
            : a.data.timestamp;
        const timeB =
          b.type === 'text'
            ? b.data.createdAt ?? ''
            : b.data.timestamp;
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
      if (mem.photos?.length) {
        allPhotoUrls.push(...mem.photos);
      }
    });
    const photoUrls =
      allPhotoUrls.length > 0
        ? allPhotoUrls.slice(0, 12)
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
        <Text style={styles.systemCardTitle}>Session Complete</Text>
        <View style={styles.systemCardRow}>
          <Clock color="#888" size={14} />
          <Text style={styles.systemCardText}>{formattedDuration}</Text>
        </View>
        <View style={styles.systemCardRow}>
          <MapPin color="#888" size={14} />
          <Text
            style={styles.systemCardText}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {location}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.systemCardPhotos}
          nestedScrollEnabled
        >
          {photoUrls.map((uri, idx) => (
            <Image
              key={idx}
              source={{ uri }}
              style={styles.systemCardPhoto}
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
        <View style={styles.systemMessageRow}>
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
          <Text style={styles.bubbleText}>{msg.content}</Text>
          <Text style={styles.timestamp}>{formatMessageTime(msg.createdAt)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
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
        keyExtractor={(item) =>
          item.type === 'text' ? item.data.id : item.data.id
        }
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
          <Text style={styles.empty}>No messages yet. Say hi!</Text>
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={`Message ${friend.name ?? 'friend'}...`}
          placeholderTextColor="#666"
          multiline
          maxLength={1000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputValue.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputValue.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    marginBottom: 12,
  },
  messageRowMe: {
    alignItems: 'flex-end',
  },
  messageRowThem: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: '#333',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: '#fff',
    fontSize: 16,
  },
  timestamp: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  empty: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 48,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    minHeight: 40,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
  systemMessageRow: {
    marginBottom: 12,
    alignItems: 'center',
  },
  systemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    maxWidth: '85%',
    maxHeight: 280,
    borderWidth: 1,
    borderColor: '#333',
  },
  systemCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  systemCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  systemCardText: {
    fontSize: 13,
    color: '#888',
  },
  systemCardPhotos: {
    marginTop: 12,
    height: 64,
  },
  systemCardPhoto: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 8,
  },
  systemTimestamp: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
});
