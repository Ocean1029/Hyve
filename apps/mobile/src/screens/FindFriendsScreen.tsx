/**
 * Find Friends screen. Shows nearby online users and allows sending friend requests.
 * Also displays pending received requests with Accept/Reject actions.
 * Includes text search for users (by ID or name).
 * Uses expo-location, POST /api/locations, GET /api/locations/nearby,
 * GET /api/friend-requests/status, GET /api/friend-requests/pending,
 * GET /api/search/users, GET /api/search/recommended,
 * POST /api/friend-requests, accept, reject.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import { formatDistance } from '@hyve/utils';
import { Check, X, Search } from '../components/icons';

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
        const userId = u.id;
        try {
          const [statusRes, checkRes] = await Promise.all([
            apiClient.get<{ status: string }>(
              `${API_PATHS.FRIEND_REQUESTS_STATUS}?userId=${encodeURIComponent(userId)}`
            ),
            apiClient.get<{ isFriend: boolean }>(
              `${API_PATHS.FRIENDS_CHECK}?userId=${encodeURIComponent(userId)}`
            ),
          ]);
          return {
            userId,
            requestStatus: (statusRes as { status?: string })?.status ?? 'none',
            isFriend: (checkRes as { isFriend?: boolean })?.isFriend ?? false,
          };
        } catch {
          return { userId, requestStatus: 'none', isFriend: false };
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
  }, [fetchNearbyAndStatuses]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
    } else {
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
              statusResults.forEach(({ userId, requestStatus }) => {
                next[userId] = requestStatus;
              });
              return next;
            });
            setFriendStatuses((prev) => {
              const next = { ...prev };
              statusResults.forEach(({ userId, isFriend }) => {
                next[userId] = isFriend;
              });
              return next;
            });
          })
          .catch(() => setSearchResults([]))
          .finally(() => setSearching(false));
      }, 300);
      return () => clearTimeout(timer);
    }
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
      if (res?.success) {
        setRequestStatuses((prev) => ({ ...prev, [userId]: 'sent' }));
      } else if (res?.alreadyExists) {
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

  const renderUser = ({ item }: { item: NearbyUser }) => {
    const requestStatus = requestStatuses[item.id] ?? 'none';
    const isFriend = friendStatuses[item.id] ?? false;
    const canSend = !isFriend && requestStatus === 'none';
    const isSending = sendingRequest === item.id;

    return (
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>
                {(item.name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name ?? 'Unknown'}</Text>
          <Text style={styles.distance}>
            {item.distance != null ? formatDistance(item.distance) : 'Nearby'}
          </Text>
        </View>
        <View style={styles.action}>
          {isFriend ? (
            <Text style={styles.friendBadge}>Friend</Text>
          ) : requestStatus === 'sent' ? (
            <Text style={styles.pendingBadge}>Pending</Text>
          ) : canSend ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleSendRequest(item.id)}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>Add</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Finding nearby friends...</Text>
      </View>
    );
  }

  if (locationError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Find Friends</Text>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{locationError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderPendingItem = (item: PendingRequest) => {
    const sender = item.sender;
    const isProcessing = processingRequestId === item.id;
    return (
      <View key={item.id} style={styles.userCard}>
        <View style={styles.avatarContainer}>
          {sender?.image ? (
            <Image source={{ uri: sender.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>
                {(sender?.name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{sender?.name ?? 'Someone'}</Text>
          <Text style={styles.distance}>Wants to be your friend</Text>
        </View>
        <View style={styles.pendingActions}>
          <TouchableOpacity
            style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleAcceptRequest(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Check color="#fff" size={18} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
            onPress={() => handleRejectRequest(item.id)}
            disabled={isProcessing}
          >
            <X color="#fff" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const displaySearchResults = searchQuery.trim().length > 0;
  const searchListData = searchResults;
  const searchListLoading = searching;

  const renderSearchUser = ({ item }: { item: SearchUser }) => {
    const requestStatus = requestStatuses[item.id] ?? 'none';
    const isFriend = friendStatuses[item.id] ?? false;
    const canSend = !isFriend && requestStatus === 'none';
    const isSending = sendingRequest === item.id;
    const avatar = item.image ?? item.avatar;

    return (
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>
                {(item.name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name ?? 'Unknown'}</Text>
          <Text style={styles.distance}>
            {item.userId ?? item.id}
          </Text>
        </View>
        <View style={styles.action}>
          {isFriend ? (
            <Text style={styles.friendBadge}>Friend</Text>
          ) : requestStatus === 'sent' ? (
            <Text style={styles.pendingBadge}>Pending</Text>
          ) : canSend ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleSendRequest(item.id)}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>Add</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const listHeader = (
    <>
      <View style={styles.searchRow}>
        <Search color="#666" size={20} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by ID or name"
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {!displaySearchResults && pendingRequests.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>Friend Requests</Text>
          {pendingRequests.map(renderPendingItem)}
          <Text style={styles.sectionHeader}>Nearby</Text>
        </>
      )}
      {displaySearchResults && (
        <Text style={styles.sectionHeader}>
          {searching ? 'Searching...' : 'Search results'}
        </Text>
      )}
    </>
  );

  const listData = displaySearchResults ? searchListData : users;
  const renderItem = displaySearchResults
    ? (info: { item: SearchUser }) => renderSearchUser(info)
    : (info: { item: NearbyUser }) => renderUser(info);
  const emptyMessage = displaySearchResults
    ? (searchListLoading ? '' : 'No results found')
    : 'No nearby friends found. Make sure location services are enabled.';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Friends</Text>
      <Text style={styles.subtitle}>
        {displaySearchResults
          ? 'Search for users to add'
          : 'Discover people nearby who are online'}
      </Text>
      <FlatList
        data={listData as NearbyUser[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          displaySearchResults
            ? renderSearchUser({ item: item as unknown as SearchUser })
            : renderUser({ item })
        }
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.list}
        refreshControl={
          !displaySearchResults ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          ) : undefined
        }
        ListEmptyComponent={
          searchListLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : (
            <Text style={styles.empty}>{emptyMessage}</Text>
          )
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
  loadingText: {
    color: '#888',
    marginTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  errorBox: {
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#f44',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    paddingBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  distance: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  action: {
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  friendBadge: {
    color: '#888',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pendingBadge: {
    color: '#f59e0b',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  empty: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 48,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
    marginBottom: 8,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#22c55e',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 0,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
});
