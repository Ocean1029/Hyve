/**
 * Find Friends screen. Shows nearby online users and allows sending friend requests.
 * Uses expo-location, POST /api/locations, GET /api/locations/nearby,
 * GET /api/friend-requests/status, GET /api/friends/check, POST /api/friend-requests.
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
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import { formatDistance } from '@hyve/utils';

interface NearbyUser {
  id: string;
  userId: string | null;
  name: string | null;
  image: string | null;
  isOnline: boolean;
  distance?: number;
  lastSeenAt: string | null;
}

export default function FindFriendsScreen() {
  const { apiClient } = useAuth();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string>>({});
  const [friendStatuses, setFriendStatuses] = useState<Record<string, boolean>>({});
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchNearbyAndStatuses();
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Friends</Text>
      <Text style={styles.subtitle}>Discover people nearby who are online</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No nearby friends found. Make sure location services are enabled.
          </Text>
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
});
