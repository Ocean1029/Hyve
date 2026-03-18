/**
 * Glass card overlay for showing place details when a marker is tapped.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import GlassCard from '../ui/GlassCard';
import HyveAvatar from '../ui/HyveAvatar';
import { Colors, Space, Radius } from '../../theme';
import { MapPin, X } from '../icons';
import type { MapPlace } from '../../data/mockMapData';
import { PLACE_CATEGORIES } from '../../data/mockMapData';

interface PlaceCardProps {
  place: MapPlace;
  displayCount?: number;
  onClose: () => void;
}

export default function PlaceCard({ place, displayCount, onClose }: PlaceCardProps) {
  const visits = displayCount ?? place.visitCount;
  const category = PLACE_CATEGORIES[place.category];

  return (
    <GlassCard style={styles.card} padding={Space.lg}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
          <View style={styles.titleBlock}>
            <Text style={styles.name}>{place.name}</Text>
            <Text style={styles.category}>{category.label}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <X color={Colors.text3} size={18} />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <MapPin color={Colors.gold} size={14} />
          <Text style={styles.statText}>
            {visits} {visits === 1 ? 'visit' : 'visits'}
          </Text>
        </View>
      </View>

      {/* Friends row */}
      {place.friends.length > 0 && (
        <View style={styles.friends}>
          <Text style={styles.friendsLabel}>Friends here</Text>
          <View style={styles.avatarRow}>
            {place.friends.map((friend, i) => (
              <View key={friend.id} style={i > 0 ? { marginLeft: -8 } : undefined}>
                <HyveAvatar
                  uri={friend.avatar}
                  name={friend.name}
                  size={28}
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Space.lg,
    marginBottom: Space.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text1,
  },
  category: {
    fontSize: 12,
    color: Colors.text3,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    marginTop: Space.md,
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: Colors.text2,
    fontWeight: '600',
  },
  friends: {
    marginTop: Space.md,
  },
  friendsLabel: {
    fontSize: 11,
    color: Colors.text3,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
