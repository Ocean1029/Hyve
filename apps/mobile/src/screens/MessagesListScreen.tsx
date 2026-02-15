/**
 * Messages list screen. Shows friends; tap to open chat.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import type { Friend } from '@hyve/types';

type MessagesStackParamList = {
  MessagesList: undefined;
  Chat: { friend: Friend };
};

type MessagesListNavProp = NativeStackNavigationProp<MessagesStackParamList, 'MessagesList'>;

export default function MessagesListScreen() {
  const navigation = useNavigation<MessagesListNavProp>();
  const { apiClient } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<{ friends: Friend[] }>(API_PATHS.FRIENDS_LIST);
        setFriends(res?.friends ?? []);
      } catch {
        setFriends([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiClient]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Chat', { friend: item })}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
            />
            <View style={styles.rowContent}>
              <Text style={styles.name}>{item.name ?? 'Unknown'}</Text>
              {item.lastMessage && (
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage.content}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No conversations yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#333',
  },
  rowContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  preview: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  empty: {
    color: '#666',
    fontSize: 14,
    paddingVertical: 24,
  },
});
