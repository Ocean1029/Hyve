/**
 * Map screen — displays visited places as colored bar markers on a dark map.
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { MOCK_PLACES, TAIPEI_REGION, DARK_MAP_STYLE } from '../data/mockMapData';
import type { MapPlace } from '../data/mockMapData';
import BuildingMarker from '../components/map/BuildingMarker';
import TimeFilterBar from '../components/map/TimeFilterBar';
import type { TimeFilter } from '../components/map/TimeFilterBar';
import PlaceCard from '../components/map/PlaceCard';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const getVisitCount = (place: MapPlace) => {
    switch (timeFilter) {
      case 'week':
        return place.visitsThisWeek;
      case 'month':
        return place.visitsThisMonth;
      default:
        return place.visitCount;
    }
  };

  const filteredPlaces = useMemo(
    () => MOCK_PLACES.filter((p) => getVisitCount(p) > 0),
    [timeFilter],
  );

  const handleFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
    if (selectedPlace && getVisitCount(selectedPlace) === 0) {
      setSelectedPlace(null);
    }
  };

  return (
    <View style={styles.root}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={TAIPEI_REGION}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        onPress={() => setSelectedPlace(null)}
      >
        {filteredPlaces.map((place) => (
          <BuildingMarker
            key={place.id}
            place={place}
            displayCount={getVisitCount(place)}
            onPress={setSelectedPlace}
          />
        ))}
      </MapView>

      {/* Time filter bar */}
      <View style={[styles.filterContainer, { top: insets.top + 12 }]}>
        <TimeFilterBar value={timeFilter} onChange={handleFilterChange} />
      </View>

      {/* Place card */}
      {selectedPlace && (
        <View style={[styles.cardContainer, { bottom: insets.bottom + 12 }]}>
          <PlaceCard
            place={selectedPlace}
            displayCount={getVisitCount(selectedPlace)}
            onClose={() => setSelectedPlace(null)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  filterContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  cardContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
