/**
 * Friend profile screen. Displays friend details: total hours, streak, recent memories.
 * Aligns with web FriendProfile component.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Clock, Hash, Flame, Sparkles } from '../components/icons';
import type { Friend } from '@hyve/types';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';

type RootStackParamList = {
  FriendProfile: { friend: Friend };
};

type FriendProfileScreenRouteProp = NativeStackScreenProps<
  RootStackParamList,
  'FriendProfile'
>['route'];

export default function FriendProfileScreen() {
  const route = useRoute<FriendProfileScreenRouteProp>();
  const navigation = useNavigation();
  const { friend } = route.params;
  const { apiClient } = useAuth();
  const [iceBreaker, setIceBreaker] = useState<string | null>(null);
  const [loadingIceBreaker, setLoadingIceBreaker] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: friend.name ?? 'Friend',
      headerStyle: { backgroundColor: '#000' },
      headerTintColor: '#fff',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 8, padding: 8 }}
        >
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
      ),
    });
  }, [friend.name, navigation]);

  const totalHours = friend.totalHours ?? 0;
  const streak = friend.streak ?? 0;
  const recentMemories = friend.recentMemories ?? [];
  const avatarUri = friend.avatar ?? '';

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
      {/* Header image and name */}
      <View style={styles.headerImage}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.coverPlaceholder]} />
        )}
        <View style={styles.headerOverlay} />
        <View style={styles.titleArea}>
          <Text style={styles.name}>{friend.name ?? 'Friend'}</Text>
          <View style={styles.badges}>
            <View style={styles.badgeBestie}>
              <Text style={styles.badgeBestieText}>Bestie</Text>
            </View>
            <View style={styles.badgeStreak}>
              <Flame color="#f97316" size={12} />
              <Text style={styles.badgeStreakText}>{streak} Day Streak</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Spark conversation */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sparkCard}
          onPress={handleSparkConversation}
          disabled={loadingIceBreaker}
        >
          {loadingIceBreaker ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Sparkles color="#f43f5e" size={20} />
          )}
          <Text style={styles.sparkCardText}>
            {loadingIceBreaker
              ? 'Thinking...'
              : iceBreaker
                ? `"${iceBreaker}"`
                : 'Spark a conversation topic'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Total hours section */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Clock color="#f43f5e" size={32} />
          </View>
          <Text style={styles.cardLabel}>Total Friendship Time</Text>
          <Text style={styles.cardValue}>
            {totalHours}
            <Text style={styles.cardUnit}>h</Text>
          </Text>
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>Top 5% of your circle</Text>
          </View>
        </View>
      </View>

      {/* Recent memories section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Hash color="#f59e0b" size={16} />
          </View>
          <Text style={styles.sectionTitle}>Our History</Text>
        </View>
        {recentMemories.length > 0 ? (
          <View style={styles.memoriesList}>
            {recentMemories.map((memory) => {
              const ts =
                memory.timestamp instanceof Date
                  ? memory.timestamp
                  : new Date(memory.timestamp as string);
              return (
                <View key={memory.id} style={styles.memoryItem}>
                  <View style={styles.memoryDot} />
                  <View style={styles.memoryContent}>
                    <Text style={styles.memoryType}>
                      {(memory.type ?? 'Memory').charAt(0).toUpperCase() +
                        (memory.type ?? 'memory').slice(1)}
                    </Text>
                    <Text style={styles.memoryDate}>
                      {ts.toLocaleDateString()}
                    </Text>
                    {memory.content ? (
                      <Text style={styles.memoryContentText}>
                        {memory.content}
                      </Text>
                    ) : null}
                    <Text style={styles.memoryTime}>
                      {ts.toLocaleTimeString()}
                    </Text>
                  </View>
                  {memory.photos && memory.photos.length > 0 ? (
                    <View style={styles.memoryPhotos}>
                      {memory.photos.map((photo) => (
                        <Image
                          key={photo.id}
                          source={{ uri: photo.photoUrl }}
                          style={styles.memoryPhoto}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyMemories}>
            No recent memories recorded.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingBottom: 40,
  },
  headerImage: {
    height: 280,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    backgroundColor: '#1a1a1a',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  titleArea: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  badgeBestie: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeBestieText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  badgeStreakText: {
    color: '#fb923c',
    fontSize: 10,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 24,
    alignItems: 'center',
  },
  cardIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.3,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: 2,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
  },
  cardUnit: {
    fontSize: 20,
    color: '#52525b',
    marginLeft: 4,
  },
  cardBadge: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  cardBadgeText: {
    color: '#fb7185',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIcon: {
    padding: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#d6d3d1',
    letterSpacing: 2,
  },
  memoriesList: {
    paddingLeft: 8,
  },
  memoryItem: {
    position: 'relative',
    paddingLeft: 20,
    paddingBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#27272a',
  },
  memoryDot: {
    position: 'absolute',
    left: -6,
    top: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#000',
  },
  memoryContent: {
    flex: 1,
  },
  memoryType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d6d3d1',
  },
  memoryDate: {
    fontSize: 10,
    color: '#71717a',
    fontWeight: '700',
    marginTop: 4,
  },
  memoryContentText: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 4,
  },
  memoryTime: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
  },
  memoryPhotos: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  memoryPhoto: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  emptyMemories: {
    fontSize: 14,
    color: '#52525b',
    fontStyle: 'italic',
    paddingLeft: 16,
  },
  sparkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sparkCardText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});
