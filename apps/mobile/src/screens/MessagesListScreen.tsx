/**
 * Messages list screen — ver2 SearchScreen style.
 * Glass search bar + friend cards with avatar, name, last message preview.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import type { Friend } from '@hyve/types';
import HyveAvatar from '../components/ui/HyveAvatar';
import { Search } from '../components/icons';
import { Colors, Radius, Space, Shadows } from '../theme';

type MessagesStackParamList = {
  MessagesList: undefined;
  Chat: { friend: Friend };
};
type RootStackParamList = {
  MessagesList: undefined;
  Chat: { friend: Friend };
  FindFriends: undefined;
};

type MessagesListNavProp = NativeStackNavigationProp<MessagesStackParamList, 'MessagesList'>;

export default function MessagesListScreen() {
  const navigation = useNavigation<MessagesListNavProp>();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { apiClient } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

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

  const filtered = query.trim()
    ? friends.filter((f) =>
        (f.name ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : friends;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity
          style={styles.radarBtn}
          onPress={() => rootNavigation.navigate('FindFriends')}
          activeOpacity={0.8}
        >
          <Text style={styles.radarBtnText}>+ Find</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Search color={Colors.muted} size={16} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search friends..."
          placeholderTextColor={Colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Friend list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendCard}
            onPress={() => navigation.navigate('Chat', { friend: item })}
            activeOpacity={0.72}
          >
            <HyveAvatar
              uri={item.avatar}
              name={item.name}
              size={48}
            />
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{item.name ?? 'Unknown'}</Text>
              {item.lastMessage ? (
                <Text style={styles.friendPreview} numberOfLines={1}>
                  {item.lastMessage.content}
                </Text>
              ) : (
                <Text style={styles.friendSub}>
                  {(item.totalHours ?? 0) > 0 ? `${item.totalHours}h together` : 'Say hello!'}
                </Text>
              )}
            </View>
            {(item.streak ?? 0) > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>{item.streak}🔥</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {query ? 'No results' : 'No conversations yet'}
            </Text>
            {!query && (
              <Text style={styles.emptyBody}>Add friends to start chatting</Text>
            )}
          </View>
        }
      />
    </View>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Space.lg,
    paddingTop: Space.lg,
    paddingBottom: Space.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '300',
    color: Colors.text1,
    letterSpacing: -0.5,
  },
  radarBtn: {
    backgroundColor: Colors.goldFaint,
    borderWidth: 1,
    borderColor: Colors.goldDim,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  radarBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 0.4,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.xl,
    paddingHorizontal: Space.md,
    paddingVertical: 10,
    marginHorizontal: Space.lg,
    marginBottom: Space.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.text1,
    fontSize: 14,
    padding: 0,
  },

  // List
  listContent: {
    paddingHorizontal: Space.lg,
    paddingBottom: 32,
    gap: Space.sm,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.xxl,
    padding: Space.md,
    ...Shadows.soft,
  },
  friendInfo: {
    flex: 1,
    gap: 4,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text1,
    letterSpacing: -0.1,
  },
  friendPreview: {
    fontSize: 12,
    color: Colors.text3,
  },
  friendSub: {
    fontSize: 11,
    color: Colors.muted,
  },
  streakBadge: {
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    fontSize: 11,
    color: Colors.text3,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 64,
    gap: Space.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text3,
  },
  emptyBody: {
    fontSize: 12,
    color: Colors.muted,
  },
});
