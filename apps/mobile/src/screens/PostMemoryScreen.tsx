/**
 * Post Memory screen — v1 three-step wizard.
 *
 * Step 1 "Subject"  — event name, time details, hangout type
 * Step 2 "Content"  — photos, experience text
 * Step 3 "Location" — category star ratings, review, post button
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../utils/upload';
import { API_PATHS } from '@hyve/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  Calendar, MapPin, ImageIcon, Loader2, Star, Camera, ChevronRight,
} from '../components/icons';
import GlassCard from '../components/ui/GlassCard';
import { Colors, Radius, Space, Shadows } from '../theme';

// ── Constants ──────────────────────────────────────────────────────────
const STEPS = ['Subject', 'Content', 'Location'] as const;
const HANGOUT_TYPES = ['Study', 'Gym', 'Hike', 'Chat', 'Vibe', 'Eat', 'Create'];
const RATING_CATEGORIES = [
  { key: 'service', label: 'Service' },
  { key: 'vibe', label: 'Vibe' },
  { key: 'food', label: 'Food / Drink' },
  { key: 'location', label: 'Location' },
  { key: 'wifi', label: 'WiFi' },
];
const MAX_CAPTION_LENGTH = 150;

type Props = NativeStackScreenProps<RootStackParamList, 'PostMemory'>;

export default function PostMemoryScreen({ route, navigation }: Props) {
  const { focusSessionId, durationSeconds, sessionEndTime } = route.params;
  const { apiClient, getToken } = useAuth();
  const insets = useSafeAreaInsets();

  // Step state
  const [step, setStep] = useState(0);

  // Step 1 — Subject
  const [eventName, setEventName] = useState('');
  const [selectedType, setSelectedType] = useState('Study');

  // Step 2 — Content
  const [caption, setCaption] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Step 3 — Location
  const [ratings, setRatings] = useState<Record<string, number>>({
    service: 0, vibe: 0, food: 0, location: 0, wifi: 0,
  });
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────
  const timeDetails = useMemo(() => {
    if (durationSeconds == null || !sessionEndTime) return null;
    const end = new Date(sessionEndTime);
    const start = new Date(end.getTime() - durationSeconds * 1000);
    const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fmt = (d: Date) =>
      d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    return {
      dateStr,
      timeRange: `${fmt(start)}–${fmt(end)}`,
      durationStr: h > 0 ? `${h}hr ${m}min` : `${m}min`,
    };
  }, [durationSeconds, sessionEndTime]);

  const averageRating = useMemo(() => {
    const vals = Object.values(ratings).filter((v) => v > 0);
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2);
  }, [ratings]);

  // ── Handlers ───────────────────────────────────────────────────────
  const goNext = () => {
    if (step === 0 && !eventName.trim()) {
      Alert.alert('Event name required', 'Please enter what happened in this moment.');
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const setStarRating = (key: string, value: number) =>
    setRatings((prev) => ({ ...prev, [key]: value }));

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
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) { Alert.alert('Error', 'Please sign in again.'); return; }
      const trimmed = eventName.trim();
      const content = caption.trim() ? `${trimmed}\n\n${caption.trim()}` : trimmed;
      const photoUrl =
        uploadedUrls.length > 0
          ? uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls
          : undefined;

      await apiClient.post(API_PATHS.MEMORY_WITH_PHOTO, {
        focusSessionId,
        photoUrl,
        content,
        happyIndex: averageRating,
        mood: selectedType,
        review: review.trim() || undefined,
      });
      navigation.navigate('Main');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save memory');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step renderers ─────────────────────────────────────────────────

  const renderStep1 = () => (
    <>
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

      {/* Event name */}
      <TextInput
        style={styles.eventInput}
        value={eventName}
        onChangeText={setEventName}
        placeholder="What happened in this moment?"
        placeholderTextColor={Colors.muted}
      />

      {/* Type of Hangout */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TYPE OF HANGOUT</Text>
        <View style={styles.chipsRow}>
          {HANGOUT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedType(type)}
              style={[styles.chip, selectedType === type && styles.chipActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* Moments (Photos) */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>MOMENTS</Text>
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
          <TouchableOpacity
            style={[styles.photoPlaceholder, uploading && { opacity: 0.5 }]}
            onPress={pickImage}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <Loader2 color={Colors.muted} size={22} />
            ) : (
              <Camera color={Colors.text3} size={22} />
            )}
            <Text style={styles.photoPlaceholderText}>
              {uploading ? 'Uploading…' : 'Post Photos / Videos'}
            </Text>
          </TouchableOpacity>
        )}
        {photoUris.length > 0 && (
          <TouchableOpacity
            style={[styles.addMoreBtn, uploading && { opacity: 0.5 }]}
            onPress={pickImage}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <Loader2 color={Colors.muted} size={14} />
            ) : (
              <ImageIcon color={Colors.text3} size={14} />
            )}
            <Text style={styles.addMoreText}>
              {uploading ? 'Uploading…' : 'Add more'}
            </Text>
          </TouchableOpacity>
        )}
        {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
      </View>

      {/* Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>EXPERIENCE</Text>
        <TextInput
          style={styles.captionInput}
          value={caption}
          onChangeText={(t) => setCaption(t.slice(0, MAX_CAPTION_LENGTH))}
          placeholder="How was the session?"
          placeholderTextColor={Colors.muted}
          multiline
          maxLength={MAX_CAPTION_LENGTH}
        />
        <Text style={styles.charCount}>{caption.length}/{MAX_CAPTION_LENGTH}</Text>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      {/* Category Ratings */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>RATE EXPERIENCE</Text>
        <View style={styles.ratingsContainer}>
          {RATING_CATEGORIES.map((cat) => (
            <View key={cat.key} style={styles.ratingRow}>
              <Text style={styles.ratingCategoryLabel}>{cat.label}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setStarRating(cat.key, star)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  >
                    <Star
                      size={16}
                      color={star <= (ratings[cat.key] ?? 0) ? Colors.gold : Colors.glassBorder}
                      fill={star <= (ratings[cat.key] ?? 0) ? Colors.gold : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Review */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>REVIEW</Text>
        <TextInput
          style={styles.captionInput}
          value={review}
          onChangeText={(t) => setReview(t.slice(0, MAX_CAPTION_LENGTH))}
          placeholder="Write a short review..."
          placeholderTextColor={Colors.muted}
          multiline
          maxLength={MAX_CAPTION_LENGTH}
        />
        <Text style={styles.charCount}>{review.length}/{MAX_CAPTION_LENGTH}</Text>
      </View>

      {/* Post button */}
      <TouchableOpacity
        style={[styles.postButton, submitting && styles.postButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.88}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={styles.postButtonText}>Post</Text>
        )}
      </TouchableOpacity>
    </>
  );

  // ── Main render ────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step title */}
        <Text style={styles.stepTitle}>{STEPS[step]}</Text>

        {/* Step dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        {/* Step content */}
        {step === 0 && renderStep1()}
        {step === 1 && renderStep2()}
        {step === 2 && renderStep3()}
      </ScrollView>

      {/* Bottom navigation */}
      {step < 2 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          {step > 0 ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={goNext}
            activeOpacity={0.85}
          >
            <ChevronRight color={Colors.text2} size={22} />
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && step > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Space.xl,
    paddingTop: Space.lg,
  },

  // Step header
  stepTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.text3,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: Space.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Space.xxl,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.glassBorder,
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 20,
    borderRadius: 3,
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
    marginBottom: Space.xxl,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.text3,
    letterSpacing: 2,
    marginBottom: Space.md,
  },

  // Hangout type chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: 'rgba(201,168,106,0.15)',
    borderColor: Colors.gold,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text3,
  },
  chipTextActive: {
    color: Colors.gold,
  },

  // Category ratings
  ratingsContainer: {
    gap: Space.lg,
    paddingHorizontal: Space.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingCategoryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.text3,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
  },

  // Photos
  photoPlaceholder: {
    aspectRatio: 16 / 9,
    borderRadius: Radius.xxxl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glassBg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Space.sm,
  },
  photoPlaceholderText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.text3,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space.sm,
    marginBottom: Space.md,
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
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: 'transparent',
  },
  addMoreText: {
    color: Colors.text3,
    fontSize: 10,
    fontWeight: '700',
  },
  errorText: {
    marginTop: Space.sm,
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },

  // Text inputs
  captionInput: {
    backgroundColor: Colors.glassBg,
    borderRadius: Radius.xxl,
    padding: Space.lg,
    color: Colors.ivory,
    fontSize: 11,
    minHeight: 88,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 8,
    fontWeight: '700',
    color: Colors.text3,
    marginTop: Space.xs,
    paddingHorizontal: Space.xs,
  },

  // Post button (step 3 only)
  postButton: {
    backgroundColor: Colors.gold,
    paddingVertical: Space.lg,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    ...Shadows.gold,
  },
  postButtonDisabled: {
    opacity: 0.45,
  },
  postButtonText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Bottom navigation bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Space.xl,
    paddingTop: Space.md,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  backButton: {
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text3,
    letterSpacing: 0.5,
  },
});
