/**
 * Find Friends screen — ver2 aesthetic with glass cards.
 * Radar-style header, search, nearby users, pending requests.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import { formatDistance } from '@hyve/utils';
import HyveAvatar from '../components/ui/HyveAvatar';
import HyveButton from '../components/ui/HyveButton';
import { Check, X, Search } from '../components/icons';
import { Colors, Radius, Space, Shadows } from '../theme';

interface NearbyUser {
  id: string;
  userId: string | null;
  name: string | null;
  image: string | null;
  isOnline: boolean;
  distance?: number;
  lastSeenAt: string | null;
}

interface PendingRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt?: string;
  sender?: {
    id: string;
    userId: string | null;
    name: string | null;
    image: string | null;
  };
}

interface SearchUser {
  id: string;
  userId?: string | null;
  name: string | null;
  email?: string | null;
  image?: string | null;
  avatar?: string | null;
}

export default function FindFriendsScreen() {
  const { apiClient } = useAuth();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string>>({});
  const [friendStatuses, setFriendStatuses] = useState<Record<string, boolean>>({});
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  // Radar pulse animation
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 2.2,
          duration: 2400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 2400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseScale, pulseOpacity]);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const res = await apiClient.get<{ success: boolean; requests?: PendingRequest[] }>(
        API_PATHS.FRIEND_REQUESTS_PENDING
      );
      setPendingRequests(res?.requests ?? []);
    } catch {
      setPendingRequests([]);
    }
  }, [apiClient]);

  const fetchNearbyAndStatuses = useCallback(async () => {
    try {
      setLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setUsers([]);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      await apiClient.post(API_PATHS.LOCATIONS, { latitude, longitude });

      const res = await apiClient.get<{ users: NearbyUser[] }>(
        `${API_PATHS.LOCATIONS_NEARBY}?latitude=${latitude}&longitude=${longitude}&radiusKm=1`
      );
      const nearbyUsers = res?.users ?? [];
      setUsers(nearbyUsers);

      const statusPromises = nearbyUsers.map(async (u: NearbyUser) => {
        try {
          const [statusRes, checkRes] = await Promise.all([
            apiClient.get<{ status: string }>(
              `${API_PATHS.FRIEND_REQUESTS_STATUS}?userId=${encodeURIComponent(u.id)}`
            ),
            apiClient.get<{ isFriend: boolean }>(
              `${API_PATHS.FRIENDS_CHECK}?userId=${encodeURIComponent(u.id)}`
            ),
          ]);
          return {
            userId: u.id,
            requestStatus: (statusRes as { status?: string })?.status ?? 'none',
            isFriend: (checkRes as { isFriend?: boolean })?.isFriend ?? false,
          };
        } catch {
          return { userId: u.id, requestStatus: 'none', isFriend: false };
        }
      });

      const results = await Promise.all(statusPromises);
      const reqMap: Record<string, string> = {};
      const friendMap: Record<string, boolean> = {};
      results.forEach(({ userId, requestStatus, isFriend }) => {
        reqMap[userId] = requestStatus;
        friendMap[userId] = isFriend;
      });
      setRequestStatuses(reqMap);
      setFriendStatuses(friendMap);
    } catch (e) {
      setLocationError(e instanceof Error ? e.message : 'Failed to find nearby users');
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchNearbyAndStatuses();
    fetchPendingRequests();
  }, [fetchNearbyAndStatuses, fetchPendingRequests]);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      apiClient
        .get<{ success: boolean; users?: SearchUser[] }>(
          `${API_PATHS.SEARCH_USERS}?query=${encodeURIComponent(searchQuery.trim())}`
        )
        .then(async (res) => {
          const results = res?.users ?? [];
          setSearchResults(results);
          const statusPromises = results.map(async (u: SearchUser) => {
            try {
              const [statusRes, checkRes] = await Promise.all([
                apiClient.get<{ status: string }>(
                  `${API_PATHS.FRIEND_REQUESTS_STATUS}?userId=${encodeURIComponent(u.id)}`
                ),
                apiClient.get<{ isFriend: boolean }>(
                  `${API_PATHS.FRIENDS_CHECK}?userId=${encodeURIComponent(u.id)}`
                ),
              ]);
              return {
                userId: u.id,
                requestStatus: (statusRes as { status?: string })?.status ?? 'none',
                isFriend: (checkRes as { isFriend?: boolean })?.isFriend ?? false,
              };
            } catch {
              return { userId: u.id, requestStatus: 'none', isFriend: false };
            }
          });
          const statusResults = await Promise.all(statusPromises);
          setRequestStatuses((prev) => {
            const next = { ...prev };
            statusResults.forEach(({ userId, requestStatus }) => { next[userId] = requestStatus; });
            return next;
          });
          setFriendStatuses((prev) => {
            const next = { ...prev };
            statusResults.forEach(({ userId, isFriend }) => { next[userId] = isFriend; });
            return next;
          });
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, apiClient]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNearbyAndStatuses();
    fetchPendingRequests();
  };

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      const res = await apiClient.post<{ success: boolean; error?: string }>(
        API_PATHS.FRIEND_REQUEST_ACCEPT(requestId),
        {}
      );
      if (res?.success) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        Alert.alert('Error', res?.error ?? 'Failed to accept request');
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to accept request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      const res = await apiClient.post<{ success: boolean; error?: string }>(
        API_PATHS.FRIEND_REQUEST_REJECT(requestId),
        {}
      );
      if (res?.success) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        Alert.alert('Error', res?.error ?? 'Failed to reject request');
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to reject request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setSendingRequest(userId);
    try {
      const res = await apiClient.post<{ success: boolean; error?: string; alreadyExists?: boolean }>(
        API_PATHS.FRIEND_REQUESTS,
        { receiverId: userId }
      );
      if (res?.success || res?.alreadyExists) {
        setRequestStatuses((prev) => ({ ...prev, [userId]: 'sent' }));
      } else {
        Alert.alert('Error', res?.error ?? 'Failed to send request');
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send request');
    } finally {
      setSendingRequest(null);
    }
  };

  const renderUserCard = (
    item: NearbyUser | SearchUser,
    subtitle: string
  ) => {
    const id = item.id;
    const requestStatus = requestStatuses[id] ?? 'none';
    const isFriend = friendStatuses[id] ?? false;
    const canSend = !isFriend && requestStatus === 'none';
    const isSending = sendingRequest === id;
    const imgUri = (item as NearbyUser).image ?? (item as SearchUser).image ?? (item as SearchUser).avatar;

    return (
      <View key={id} style={styles.userCard}>
        <HyveAvatar
          uri={imgUri}
          name={item.name}
          size={46}
          online={(item as NearbyUser).isOnline}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name ?? 'Unknown'}</Text>
          <Text style={styles.userSub}>{subtitle}</Text>
        </View>
        <View style={styles.userAction}>
          {isFriend ? (
            <Text style={styles.badge}>Friend</Text>
          ) : requestStatus === 'sent' ? (
            <Text style={[styles.badge, styles.badgePending]}>Pending</Text>
          ) : canSend ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => handleSendRequest(id)}
              disabled={isSending}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.addBtnText}>Add</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const renderPendingCard = (item: PendingRequest) => {
    const sender = item.sender;
    const isProcessing = processingRequestId === item.id;
    return (
      <View key={item.id} style={styles.userCard}>
        <HyveAvatar uri={sender?.image} name={sender?.name} size={46} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{sender?.name ?? 'Someone'}</Text>
          <Text style={styles.userSub}>Wants to be your friend</Text>
        </View>
        <View style={styles.pendingActions}>
          <TouchableOpacity
            style={[styles.acceptBtn, isProcessing && styles.actionDisabled]}
            onPress={() => handleAcceptRequest(item.id)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Check color="#000" size={16} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectBtn, isProcessing && styles.actionDisabled]}
            onPress={() => handleRejectRequest(item.id)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <X color={Colors.text2} size={16} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const displaySearch = searchQuery.trim().length > 0;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        {/* Radar pulse rings */}
        <View style={styles.radarCenter}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.radarRing,
                {
                  width: 80 + i * 60,
                  height: 80 + i * 60,
                  borderRadius: 40 + i * 30,
                  opacity: 0.08 - i * 0.02,
                },
              ]}
            />
          ))}
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
        <Text style={styles.loadingText}>Finding nearby friends…</Text>
      </View>
    );
  }

  if (locationError && !displaySearch) {
    return (
      <View style={styles.container}>
        <View style={styles.searchBarWrap}>
          <Search color={Colors.muted} size={16} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by ID or name"
            placeholderTextColor={Colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{locationError}</Text>
          <HyveButton variant="ghost" onPress={onRefresh} style={{ marginTop: Space.md }}>
            Try Again
          </HyveButton>
        </View>
      </View>
    );
  }

  const listData = displaySearch
    ? searchResults as unknown[]
    : users as unknown[];

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBarWrap}>
        <Search color={Colors.muted} size={16} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by ID or name"
          placeholderTextColor={Colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searching && <ActivityIndicator size="small" color={Colors.muted} />}
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => (item as { id: string }).id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          !displaySearch ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
          ) : undefined
        }
        ListHeaderComponent={
          !displaySearch && pendingRequests.length > 0 ? (
            <View>
              <Text style={styles.sectionLabel}>FRIEND REQUESTS</Text>
              {pendingRequests.map(renderPendingCard)}
              <Text style={styles.sectionLabel}>NEARBY</Text>
            </View>
          ) : displaySearch ? (
            <Text style={styles.sectionLabel}>
              {searching ? 'SEARCHING…' : 'RESULTS'}
            </Text>
          ) : (
            <Text style={styles.sectionLabel}>NEARBY</Text>
          )
        }
        renderItem={({ item }) => {
          if (displaySearch) {
            const u = item as SearchUser;
            return renderUserCard(u, u.userId ?? u.id ?? '');
          }
          const u = item as NearbyUser;
          return renderUserCard(
            u,
            u.distance != null ? formatDistance(u.distance) : 'Nearby'
          );
        }}
        ListEmptyComponent={
          searching ? null : (
            <Text style={styles.emptyText}>
              {displaySearch
                ? 'No results found'
                : 'No nearby friends found.\nMake sure location services are enabled.'}
            </Text>
          )
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Space.lg,
  },
  radarCenter: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.muted,
    letterSpacing: 0.5,
  },

  // Search
  searchBarWrap: {
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
    marginBottom: Space.sm,
    marginTop: Space.sm,
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
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 1.8,
    marginTop: Space.lg,
    marginBottom: Space.md,
  },

  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.xxl,
    padding: Space.md,
    marginBottom: Space.sm,
    ...Shadows.soft,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text1,
    letterSpacing: -0.1,
  },
  userSub: {
    fontSize: 11,
    color: Colors.muted,
  },
  userAction: {
    marginLeft: Space.xs,
  },
  badge: {
    fontSize: 11,
    color: Colors.muted,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgePending: {
    color: Colors.warning,
  },
  addBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    minWidth: 56,
    alignItems: 'center',
    ...Shadows.gold,
  },
  addBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },

  // Pending request actions
  pendingActions: {
    flexDirection: 'row',
    gap: Space.sm,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.gold,
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDisabled: {
    opacity: 0.5,
  },

  // Error
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Space.xxl,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 48,
    lineHeight: 22,
  },
});
