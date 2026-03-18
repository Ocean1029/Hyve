/**
 * Custom map marker — vertical colored bar stack.
 * Height proportional to visit count. Color from place category.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Colors } from '../../theme';
import type { MapPlace } from '../../data/mockMapData';
import { PLACE_CATEGORIES } from '../../data/mockMapData';

interface BuildingMarkerProps {
  place: MapPlace;
  displayCount?: number;
  onPress: (place: MapPlace) => void;
}

const BAR_WIDTH = 28;
const BAR_SEGMENT_HEIGHT = 6;
const MAX_SEGMENTS = 10;

export default function BuildingMarker({ place, displayCount, onPress }: BuildingMarkerProps) {
  const categoryColor = PLACE_CATEGORIES[place.category].color;
  const count = displayCount ?? place.visitCount;
  const segments = Math.min(count, MAX_SEGMENTS);
  const totalHeight = segments * BAR_SEGMENT_HEIGHT;

  return (
    <Marker
      coordinate={place.coordinate}
      onPress={() => onPress(place)}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        {/* Bar stack */}
        <View style={[styles.barStack, { height: totalHeight }]}>
          {Array.from({ length: segments }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  backgroundColor: categoryColor,
                  opacity: 0.5 + (i / segments) * 0.5,
                  bottom: i * BAR_SEGMENT_HEIGHT,
                },
              ]}
            />
          ))}
        </View>
        {/* Label */}
        <Text style={styles.label} numberOfLines={1}>
          {place.name}
        </Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  barStack: {
    width: BAR_WIDTH,
    position: 'relative',
  },
  segment: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: BAR_SEGMENT_HEIGHT - 1,
    borderRadius: 2,
  },
  label: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.text2,
    textAlign: 'center',
    maxWidth: 70,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
