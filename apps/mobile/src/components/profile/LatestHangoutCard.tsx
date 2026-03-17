import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Colors, Radius } from '../../theme';

interface HangoutData {
  friendName: string;
  date: string;
  location: string;
  duration: string;
  imageUrl?: string | null;
}

interface LatestHangoutCardProps {
  hangout: HangoutData;
}

export default function LatestHangoutCard({ hangout }: LatestHangoutCardProps) {
  return (
    <View style={styles.card}>
      {hangout.imageUrl ? (
        <Image
          source={{ uri: hangout.imageUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.placeholder]} />
      )}

      {/* SVG gradient overlay */}
      <View style={StyleSheet.absoluteFillObject}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="hangoutGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000" stopOpacity="0" />
              <Stop offset="0.5" stopColor="#000" stopOpacity="0.3" />
              <Stop offset="1" stopColor="#000" stopOpacity="0.9" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#hangoutGrad)" />
        </Svg>
      </View>

      {/* Duration badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{hangout.duration}</Text>
      </View>

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <View style={styles.bottomLeft}>
          <Text style={styles.friendName}>with {hangout.friendName}</Text>
          <Text style={styles.date}>{hangout.date}</Text>
        </View>
        <Text style={styles.location}>{hangout.location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 256,
    borderRadius: Radius.xxxl,
    overflow: 'hidden',
    position: 'relative',
  },
  placeholder: {
    backgroundColor: Colors.surface2,
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.goldFaint,
    borderWidth: 1,
    borderColor: Colors.goldDim,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
  },
  bottomLeft: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    color: Colors.text2,
    marginBottom: 4,
  },
  date: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text1,
    textTransform: 'uppercase',
  },
  location: {
    fontSize: 10,
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
