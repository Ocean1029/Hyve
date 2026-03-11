/**
 * Post Memory screen — ver2 aesthetic with glass cards.
 * Event name, happy index, vibe check, photos, caption.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../utils/upload';
import { API_PATHS } from '@hyve/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Calendar, MapPin, ImageIcon, Loader2 } from '../components/icons';
import GlassCard from '../components/ui/GlassCard';
import { Colors, Radius, Space, Shadows } from '../theme';

const CATEGORIES = ['📚 Study', '🍔 Eat', '🏋️ Gym', '🚗 Drive', '☕ Chill', '🎮 Game', '🎨 Create'];

type Props = NativeStackScreenProps<RootStackParamList, 'PostMemory'>;

export default function PostMemoryScreen({ route, navigation }: Props) {
  const { focusSessionId, durationSeconds, sessionEndTime } = route.params;
  const { apiClient, getToken } = useAuth();
  const [eventName, setEventName] = useState('');
  const [rating, setRating] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [caption, setCaption] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const timeDetails = useMemo(() => {
    if (durationSeconds == null || !sessionEndTime) return null;
    const end = new Date(sessionEndTime);
    const start = new Date(end.getTime() - durationSeconds * 1000);
    const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formatT = (d: Date) =>
      d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const timeRange = `${formatT(start)}–${formatT(end)}`;
    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    const durationStr = h > 0 ? `${h}hr ${m}min` : `${m}min`;
    return { dateStr, timeRange, durationStr };
  }, [durationSeconds, sessionEndTime]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets.length) return;

    setUploadError('');
    setUploading(true);
    const newUris = result.assets.map((a) => a.uri);
    setPhotoUris((prev) => [...prev, ...newUris]);

    try {
      const token = await getToken();
      if (!token) {
        setUploadError('Please sign in again.');
        setPhotoUris((prev) => prev.filter((u) => !newUris.includes(u)));
        return;
      }
      const uploads = await Promise.all(newUris.map((uri) => uploadImage(uri, token)));
      const urls: string[] = [];
      for (let i = 0; i < uploads.length; i++) {
        if (uploads[i].success && uploads[i].url) {
          urls.push(uploads[i].url!);
        } else {
          setUploadError(uploads[i].error ?? 'Upload failed');
          setPhotoUris((prev) => prev.filter((u) => !newUris.includes(u)));
          setUploadedUrls((prev) => prev.slice(0, prev.length - i));
          return;
        }
      }
      setUploadedUrls((prev) => [...prev, ...urls]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
      setPhotoUris((prev) => prev.filter((u) => !newUris.includes(u)));
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const trimmed = eventName.trim();
    if (!trimmed) {
      Alert.alert('Event name required', 'Please enter what happened in this moment.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please sign in again.');
        return;
      }
      const content = caption.trim() ? `${trimmed}\n\n${caption.trim()}` : trimmed;
      const photoUrl =
        uploadedUrls.length > 0
          ? uploadedUrls.length === 1
            ? uploadedUrls[0]
            : uploadedUrls
          : undefined;

      await apiClient.post(API_PATHS.MEMORY_WITH_PHOTO, {
        focusSessionId,
        photoUrl,
        content,
        happyIndex: rating,
        mood: selectedCategory,
      });
      navigation.navigate('Main');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save memory');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Event name */}
        <TextInput
          style={styles.eventInput}
          value={eventName}
          onChangeText={setEventName}
          placeholder="What happened in this moment?"
          placeholderTextColor={Colors.muted}
        />

        {/* Time details */}
        {timeDetails && (
          <GlassCard style={styles.timeCard} radius={Radius.xl}>
            <View style={styles.timeRow}>
              <Calendar color={Colors.goldDim} size={14} />
              <Text style={styles.timeText}>{timeDetails.dateStr}</Text>
              <Text style={styles.timeDivider}>·</Text>
              <Text style={styles.timeText}>{timeDetails.timeRange}</Text>
              <Text style={styles.timeDivider}>·</Text>
              <Text style={styles.timeText}>{timeDetails.durationStr}</Text>
            </View>
            <View style={styles.locationRow}>
              <MapPin color={Colors.success} size={14} />
              <Text style={styles.locationText}>Location automatically tagged</Text>
            </View>
          </GlassCard>
        )}

        {/* Happy index */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>RATE EXPERIENCE</Text>
            <Text style={styles.ratingDisplay}>
              {rating}<Text style={styles.ratingMax}>/10</Text>
            </Text>
          </View>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setRating(val)}
                style={styles.starBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.starDot, val <= rating && styles.starDotActive]}>
                  {val <= rating ? '★' : '·'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.ratingLabels}>
            <Text style={styles.ratingLabel}>Meh</Text>
            <Text style={styles.ratingLabel}>Life Changing</Text>
          </View>
        </View>

        {/* Vibe check */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VIBE CHECK</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            style={{ marginTop: Space.md }}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHOTOS</Text>
          <View style={styles.photoArea}>
            {photoUris.length > 0 ? (
              <View style={styles.photoGrid}>
                {photoUris.map((uri, i) => (
                  <View key={i} style={styles.photoCell}>
                    <Image source={{ uri }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={styles.removePhoto}
                      onPress={() => removePhoto(i)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                    {uploadedUrls[i] && (
                      <View style={styles.uploadedBadge}>
                        <Text style={styles.uploadedText}>✓</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>Your photos will appear here</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.addPhotoBtn, uploading && styles.addPhotoDisabled]}
            onPress={pickImage}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <Loader2 color={Colors.muted} size={18} />
            ) : (
              <ImageIcon color={Colors.text3} size={18} />
            )}
            <Text style={styles.addPhotoText}>
              {uploading ? 'Uploading…' : 'Add photo'}
            </Text>
          </TouchableOpacity>
          {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
        </View>

        {/* Caption */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CAPTION</Text>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption…"
            placeholderTextColor={Colors.muted}
            multiline
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || !eventName.trim()) && styles.submitDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || !eventName.trim()}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.submitText}>Lock this Moment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Space.xxl,
    paddingBottom: 56,
  },

  // Event name
  eventInput: {
    backgroundColor: 'transparent',
    color: Colors.ivory,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
    paddingVertical: Space.lg,
    marginBottom: Space.xl,
    letterSpacing: -0.3,
  },

  // Time card
  timeCard: {
    marginBottom: Space.xl,
    gap: Space.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    flexWrap: 'wrap',
  },
  timeText: {
    fontSize: 12,
    color: Colors.goldDim,
    fontWeight: '500',
  },
  timeDivider: {
    color: Colors.muted,
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
  },
  locationText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },

  // Section
  section: {
    marginBottom: Space.xxxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.md,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 1.8,
    marginBottom: Space.sm,
  },

  // Rating
  ratingDisplay: {
    fontSize: 20,
    fontWeight: '300',
    color: Colors.gold,
  },
  ratingMax: {
    fontSize: 14,
    color: Colors.goldDim,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Space.xs,
    marginBottom: Space.sm,
  },
  starBtn: {
    padding: 4,
  },
  starDot: {
    fontSize: 22,
    color: Colors.muted,
  },
  starDotActive: {
    color: Colors.gold,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingLabel: {
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.8,
  },

  // Vibes
  chipsRow: {
    flexDirection: 'row',
    gap: Space.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  chipActive: {
    backgroundColor: Colors.goldFaint,
    borderColor: Colors.goldDim,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text3,
  },
  chipTextActive: {
    color: Colors.gold,
  },

  // Photos
  photoArea: {
    minHeight: 160,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glassBg,
    padding: Space.md,
    marginBottom: Space.md,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },
  photoCell: {
    width: '47%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhoto: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  uploadedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Colors.success,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  photoPlaceholder: {
    flex: 1,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: Colors.muted,
    fontSize: 13,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingVertical: 12,
    paddingHorizontal: Space.lg,
    backgroundColor: Colors.surface1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignSelf: 'flex-start',
  },
  addPhotoDisabled: {
    opacity: 0.5,
  },
  addPhotoText: {
    color: Colors.text3,
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    marginTop: Space.sm,
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },

  // Caption
  captionInput: {
    backgroundColor: Colors.surface1,
    borderRadius: Radius.xl,
    padding: Space.md,
    color: Colors.ivory,
    fontSize: 14,
    minHeight: 88,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    textAlignVertical: 'top',
    marginTop: Space.md,
  },

  // Submit
  submitButton: {
    backgroundColor: Colors.gold,
    paddingVertical: Space.xl,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    marginTop: Space.lg,
    ...Shadows.gold,
  },
  submitDisabled: {
    opacity: 0.45,
  },
  submitText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
