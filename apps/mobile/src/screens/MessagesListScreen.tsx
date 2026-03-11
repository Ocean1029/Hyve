/**
 * Friends list screen — v1 SearchScreen style.
 * Borderless items with avatar, name/handle header, and
 * message-bubble / photo interaction zone.
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import type { Friend } from '@hyve/types';
import HyveAvatar from '../components/ui/HyveAvatar';
import { Search, UserPlus, ImageIcon } from '../components/icons';
import { Colors, Radius, Space } from '../theme';

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

  const filtered = useMemo(() => {
    if (!query.trim()) return friends;
    const q = query.toLowerCase();
    return friends.filter((f) => (f.name ?? '').toLowerCase().includes(q));
  }, [friends, query]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  const getInteraction = (friend: Friend) => {
    const photo = friend.recentMemories?.[0]?.photos?.[0]?.photoUrl;
    if (photo) return { type: 'photo' as const, content: photo };
    if (friend.lastMessage) return { type: 'message' as const, content: friend.lastMessage.content };
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
      </View>

      {/* Search bar + Radar button */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search color={Colors.text3} size={12} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search..."
            placeholderTextColor={Colors.text3}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          style={styles.radarBtn}
          onPress={() => rootNavigation.navigate('FindFriends')}
          activeOpacity={0.7}
        >
          <UserPlus color={Colors.gold} size={16} />
        </TouchableOpacity>
      </View>

      {/* Friend list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const interaction = getInteraction(item);
          return (
            <View style={styles.friendRow}>
              {/* Profile zone: Avatar */}
              <TouchableOpacity activeOpacity={0.7} style={styles.avatarZone}>
                <HyveAvatar
                  uri={item.avatar}
                  name={item.name}
                  size={32}
                  ringColor={Colors.online}
                />
              </TouchableOpacity>

              <View style={styles.contentZone}>
                {/* Profile zone: Name + handle */}
                <TouchableOpacity activeOpacity={0.7} style={styles.nameRow}>
                  <View style={styles.nameBlock}>
                    <Text style={styles.friendName}>{item.name ?? 'Unknown'}</Text>
                    {item.userId && (
                      <Text style={styles.friendHandle} numberOfLines={1}>
                        @{item.name?.toLowerCase().replace(/\s+/g, '_') ?? 'user'}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Message zone: Photo or Message bubble */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.messageZone}
                  onPress={() => navigation.navigate('Chat', { friend: item })}
                >
                  {interaction?.type === 'photo' ? (
                    <View style={styles.photoContainer}>
                      <Image
                        source={{ uri: interaction.content }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                      <View style={styles.photoGradient} />
                      <View style={styles.photoLabel}>
                        <View style={styles.photoIconBadge}>
                          <ImageIcon size={10} color="#fff" />
                        </View>
                        <Text style={styles.photoLabelText}>Last Session</Text>
                      </View>
                    </View>
                  ) : interaction?.type === 'message' ? (
                    <View style={styles.messageBubble}>
                      <Text style={styles.messageText}>{interaction.content}</Text>
                    </View>
                  ) : (
                    <View style={styles.messageBubble}>
                      <Text style={styles.messageText}>
                        {(item.totalHours ?? 0) > 0
                          ? `${item.totalHours}h together`
                          : 'Say hello!'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No friends found.</Text>
          </View>
        }
      />
    </SafeAreaView>
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
    paddingHorizontal: Space.lg + 8,
    paddingTop: Space.lg,
    paddingBottom: Space.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.text1,
    letterSpacing: -0.5,
  },

  // Search row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingHorizontal: Space.lg + 8,
    marginBottom: Space.lg,
    height: 40,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    height: '100%',
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: Space.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.text1,
    fontSize: 10,
    padding: 0,
  },
  radarBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List
  listContent: {
    paddingHorizontal: Space.lg + 8,
    paddingBottom: 96,
  },

  // Friend row
  friendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space.lg,
    paddingVertical: Space.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarZone: {
    flexShrink: 0,
  },
  contentZone: {
    flex: 1,
    minWidth: 0,
  },

  // Name row
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameBlock: {
    flex: 1,
  },
  friendName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text1,
    marginBottom: 2,
  },
  friendHandle: {
    fontSize: 10,
    color: Colors.text3,
  },

  // Message zone
  messageZone: {
    marginTop: 4,
  },
  messageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderTopLeftRadius: 0,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  messageText: {
    fontSize: 11,
    color: Colors.text2,
    lineHeight: 16,
  },

  // Photo interaction
  photoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  photoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  photoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoIconBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    padding: 4,
    borderRadius: 6,
  },
  photoLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 64,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.text3,
  },
});
