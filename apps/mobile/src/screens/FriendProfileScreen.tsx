/**
 * Friend profile screen — v1 design.
 * Centered avatar with glow, metric capsules, shared album,
 * latest moment card, spark conversation.
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Flame, Sparkles, ImageIcon } from '../components/icons';
import type { Friend } from '@hyve/types';
import HyveAvatar from '../components/ui/HyveAvatar';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import { Colors, Radius, Space } from '../theme';

type RootStackParamList = {
  FriendProfile: { friend: Friend };
};

type FriendProfileScreenRouteProp = NativeStackScreenProps<
  RootStackParamList,
  'FriendProfile'
>['route'];

function formatTimeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  return `${diffWeek}w ago`;
}

export default function FriendProfileScreen() {
  const route = useRoute<FriendProfileScreenRouteProp>();
  const navigation = useNavigation();
  const { friend } = route.params;
  const { apiClient } = useAuth();
  const [iceBreaker, setIceBreaker] = useState<string | null>(null);
  const [loadingIceBreaker, setLoadingIceBreaker] = useState(false);
  const [albumExpanded, setAlbumExpanded] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: '',
      headerStyle: { backgroundColor: Colors.bg1 },
      headerTintColor: Colors.ivory,
      headerBackButtonDisplayMode: 'minimal',
    });
  }, [navigation]);

  const totalHours = friend.totalHours ?? 0;
  const streak = friend.streak ?? 0;
  const recentMemories = useMemo(
    () => friend.recentMemories ?? [],
    [friend.recentMemories],
  );
  const sessionCount = friend.sessionCount ?? 0;

  // Collect all photos from memories
  const allPhotos = useMemo(() => {
    const photos: { id: string; url: string }[] = [];
    recentMemories.forEach((m) => {
      m.photos?.forEach((p) => {
        photos.push({ id: p.id, url: p.photoUrl });
      });
    });
    return photos;
  }, [recentMemories]);

  const displayedPhotos = albumExpanded ? allPhotos : allPhotos.slice(0, 9);

  // Latest memory with photo
  const latestMemory = recentMemories[0] ?? null;
  const latestPhoto = latestMemory?.photos?.[0]?.photoUrl;

  const handleSparkConversation = async () => {
    if (loadingIceBreaker) return;
    setLoadingIceBreaker(true);
    try {
      const res = await apiClient.post<{ question: string }>(
        API_PATHS.GENERATE_ICEBREAKER,
        { context: 'close friends' }
      );
      setIceBreaker(res?.question ?? "What's the best meal you've had this week?");
    } catch {
      setIceBreaker("If you could travel anywhere right now, where would you go?");
    } finally {
      setLoadingIceBreaker(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Stage 1: Identity Core */}
      <View style={styles.identityCore}>
        {/* Avatar with glow */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarGlow} />
          <HyveAvatar
            uri={friend.avatar}
            name={friend.name}
            size={120}
            ringColor={Colors.gold}
          />
        </View>

        {/* Name + handle */}
        <Text style={styles.name}>{friend.name ?? 'Friend'}</Text>
        {friend.userId && (
          <Text style={styles.handle}>@{friend.userId}</Text>
        )}

        {/* Streak badge */}
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Flame color={Colors.gold} size={12} />
            <Text style={styles.streakText}>{streak} Day Streak</Text>
          </View>
        )}
      </View>

      {/* Metric Capsules — 2x2 grid */}
      <View style={styles.capsulesGrid}>
        <View style={styles.capsule}>
          <Text style={styles.capsuleValue}>{totalHours}h</Text>
          <Text style={styles.capsuleLabel}>TOGETHER</Text>
        </View>
        <View style={styles.capsule}>
          <Text style={styles.capsuleValue}>{sessionCount}</Text>
          <Text style={styles.capsuleLabel}>SESSIONS</Text>
        </View>
        <View style={styles.capsule}>
          <Text style={styles.capsuleValue}>{allPhotos.length}</Text>
          <Text style={styles.capsuleLabel}>PHOTOS</Text>
        </View>
        <View style={styles.capsule}>
          <Text style={styles.capsuleValue}>{streak}</Text>
          <Text style={styles.capsuleLabel}>STREAK</Text>
        </View>
      </View>

      {/* Spark Conversation */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sparkCard}
          onPress={handleSparkConversation}
          disabled={loadingIceBreaker}
          activeOpacity={0.85}
        >
          {loadingIceBreaker ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : (
            <Sparkles color={Colors.gold} size={18} />
          )}
          <Text style={styles.sparkText}>
            {loadingIceBreaker
              ? 'Thinking...'
              : iceBreaker
                ? `"${iceBreaker}"`
                : 'Spark a conversation topic'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shared Album */}
      {allPhotos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SHARED ALBUM</Text>
            {allPhotos.length > 9 && (
              <TouchableOpacity onPress={() => setAlbumExpanded(!albumExpanded)} activeOpacity={0.7}>
                <Text style={styles.seeMoreText}>
                  {albumExpanded ? 'See Less' : 'See More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.albumGrid}>
            {displayedPhotos.map((photo) => (
              <View key={photo.id} style={styles.albumItem}>
                <Image
                  source={{ uri: photo.url }}
                  style={styles.albumImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Latest Moment */}
      {latestMemory && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: Space.md }]}>LATEST MOMENT</Text>
          <View style={styles.momentCard}>
            {latestPhoto ? (
              <Image
                source={{ uri: latestPhoto }}
                style={styles.momentImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.momentImage, styles.momentPlaceholder]}>
                <ImageIcon size={32} color={Colors.muted} />
              </View>
            )}
            <View style={styles.momentGradient} />

            {/* Duration badge */}
            {latestMemory.focusSessionMinutes != null && (
              <View style={styles.momentDurationBadge}>
                <Text style={styles.momentDurationText}>
                  {latestMemory.focusSessionMinutes}m
                </Text>
              </View>
            )}

            {/* Bottom info */}
            <View style={styles.momentInfo}>
              <View>
                <Text style={styles.momentTimeAgo}>
                  {formatTimeAgo(
                    latestMemory.timestamp instanceof Date
                      ? latestMemory.timestamp
                      : new Date(latestMemory.timestamp as string)
                  )}
                </Text>
                <Text style={styles.momentType}>
                  {(latestMemory.type ?? 'moment').charAt(0).toUpperCase() +
                    (latestMemory.type ?? 'moment').slice(1)}
                </Text>
              </View>
              {latestMemory.location && (
                <Text style={styles.momentLocation}>
                  @ {latestMemory.location}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Our History — Timeline */}
      {recentMemories.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: Space.md }]}>OUR HISTORY</Text>
          <View style={styles.timeline}>
            {recentMemories.map((memory, index) => {
              const ts =
                memory.timestamp instanceof Date
                  ? memory.timestamp
                  : new Date(memory.timestamp as string);
              const isLast = index === recentMemories.length - 1;
              return (
                <View
                  key={memory.id}
                  style={[styles.timelineItem, isLast && styles.timelineItemLast]}
                >
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineType}>
                      {(memory.type ?? 'Memory').charAt(0).toUpperCase() +
                        (memory.type ?? 'memory').slice(1)}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {ts.toLocaleDateString()}
                    </Text>
                    {memory.content ? (
                      <Text style={styles.timelineText} numberOfLines={2}>
                        {memory.content}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Empty state */}
      {recentMemories.length === 0 && allPhotos.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No shared moments yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
  },
  content: {
    paddingBottom: 48,
  },

  // Identity Core
  identityCore: {
    alignItems: 'center',
    paddingTop: Space.xxxl,
    paddingBottom: Space.xl,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xl,
  },
  avatarGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(201,168,106,0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#C9A86A',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 40,
      },
      android: { elevation: 0 },
    }),
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text1,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  handle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text3,
    marginBottom: Space.md,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.goldFaint,
    borderWidth: 1,
    borderColor: Colors.goldDim,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 0.3,
  },

  // Metric Capsules
  capsulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
    paddingHorizontal: Space.lg + 8,
    marginBottom: Space.xl,
  },
  capsule: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.xxl,
    paddingVertical: Space.lg,
    alignItems: 'center',
    gap: Space.xs,
  },
  capsuleValue: {
    fontSize: 24,
    fontWeight: '200',
    color: Colors.ivory,
    letterSpacing: -1,
  },
  capsuleLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 2,
  },

  // Section
  section: {
    paddingHorizontal: Space.lg + 8,
    marginBottom: Space.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.md,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text3,
    letterSpacing: 2.5,
  },
  seeMoreText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Spark Card
  sparkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.xxl,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.lg,
  },
  sparkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text2,
    lineHeight: 20,
  },

  // Album
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  albumItem: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  albumImage: {
    width: '100%',
    height: '100%',
    opacity: 0.75,
  },

  // Latest Moment
  momentCard: {
    width: '100%',
    height: 220,
    borderRadius: Radius.xxxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    position: 'relative',
  },
  momentImage: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  momentPlaceholder: {
    backgroundColor: Colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
  momentGradient: {
    ...StyleSheet.absoluteFillObject,
    top: '40%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  momentDurationBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(201,168,106,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  momentDurationText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  momentInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  momentTimeAgo: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text2,
    marginBottom: 2,
  },
  momentType: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text1,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  momentLocation: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text3,
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },

  // Timeline
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 20,
    paddingBottom: Space.lg,
    borderLeftWidth: 1,
    borderLeftColor: Colors.glassBorder,
  },
  timelineItemLast: {
    borderLeftColor: 'transparent',
  },
  timelineDot: {
    position: 'absolute',
    left: -4,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.goldDim,
    borderWidth: 2,
    borderColor: Colors.bg1,
  },
  timelineContent: {
    flex: 1,
  },
  timelineType: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text1,
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timelineText: {
    fontSize: 13,
    color: Colors.text3,
    lineHeight: 19,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingTop: Space.xxxl,
    paddingHorizontal: Space.lg,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.muted,
    fontStyle: 'italic',
  },
});
