/**
 * Post Memory screen. Matches web PostMemory layout:
 * Event name (required), Happy index (1-10), Vibe check, Photos, Caption, Time details.
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
import { Star, Calendar, MapPin, ImageIcon, Loader2 } from '../components/icons';

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
    const formatTime = (d: Date) =>
      d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const timeRange = `${formatTime(start)}-${formatTime(end)}`;
    const h = Math.floor(durationSeconds / 3600);
    const m = Math.floor((durationSeconds % 3600) / 60);
    let durationStr = '';
    if (h > 0) durationStr += `${h}hr `;
    if (m > 0 || h === 0) durationStr += `${m}min`;
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
      const uploads = await Promise.all(
        newUris.map((uri) => uploadImage(uri, token))
      );
      const urls: string[] = [];
      for (let i = 0; i < uploads.length; i++) {
        if (uploads[i].success && uploads[i].url) {
          urls.push(uploads[i].url);
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
      const content = caption.trim()
        ? `${trimmed}\n\n${caption.trim()}`
        : trimmed;
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
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Event name - required, prominent */}
        <TextInput
          style={styles.eventInput}
          value={eventName}
          onChangeText={setEventName}
          placeholder="What happened in this moment?"
          placeholderTextColor="#71717a"
        />

        {/* Time details (when from SessionSummary) */}
        {timeDetails && (
          <View style={styles.timeSection}>
            <View style={styles.timeRow}>
              <Calendar color="#fda4af" size={16} />
              <Text style={styles.timeText}>{timeDetails.dateStr}</Text>
              <Text style={styles.timeText}>{timeDetails.timeRange}</Text>
            </View>
            <View style={styles.locationRow}>
              <MapPin color="#10b981" size={16} />
              <Text style={styles.locationText}>Location automatically tagged</Text>
            </View>
          </View>
        )}

        {/* Happy index 1-10 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Rate Experience</Text>
            <Text style={styles.ratingDisplay}>
              {rating}<Text style={styles.ratingMax}>/10</Text>
            </Text>
          </View>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setRating(val)}
                style={[styles.starBtn, val <= rating && styles.starActive]}
              >
                <Star
                  color={val <= rating ? '#fbbf24' : '#52525b'}
                  size={24}
                  fill={val <= rating ? '#fbbf24' : 'transparent'}
                />
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
          <Text style={styles.label}>Vibe Check</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.chip,
                  selectedCategory === cat && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedCategory === cat && styles.chipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <View style={styles.photoArea}>
            {photoUris.length > 0 ? (
              <View style={styles.photoGrid}>
                {photoUris.map((uri, i) => (
                  <View key={i} style={styles.photoCell}>
                    <Image source={{ uri }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={styles.removePhoto}
                      onPress={() => removePhoto(i)}
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                    {uploadedUrls[i] && (
                      <View style={styles.uploadedBadge}>
                        <Text style={styles.uploadedText}>Uploaded</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  Your photos will appear here
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.addPhotoBtn, uploading && styles.addPhotoDisabled]}
            onPress={pickImage}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 color="#a1a1aa" size={24} />
            ) : (
              <>
                <ImageIcon color="#d4d4d8" size={24} />
                <Text style={styles.addPhotoText}>Add photo</Text>
              </>
            )}
          </TouchableOpacity>
          {uploadError ? (
            <Text style={styles.errorText}>{uploadError}</Text>
          ) : null}
        </View>

        {/* Caption */}
        <View style={styles.section}>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption..."
            placeholderTextColor="#71717a"
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (submitting || !eventName.trim()) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !eventName.trim()}
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
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  eventInput: {
    backgroundColor: 'transparent',
    color: '#fafaf9',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#3f3f46',
    paddingVertical: 16,
    marginBottom: 24,
  },
  timeSection: {
    marginBottom: 32,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#fda4af',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a1a1aa',
    letterSpacing: 2,
  },
  ratingDisplay: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fbbf24',
  },
  ratingMax: {
    fontSize: 14,
    color: 'rgba(251, 191, 36, 0.6)',
    marginLeft: 2,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  starBtn: {
    padding: 4,
    opacity: 0.3,
  },
  starActive: {
    opacity: 1,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#52525b',
    letterSpacing: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  chipActive: {
    backgroundColor: '#3f3f46',
    borderColor: '#52525b',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
  },
  chipTextActive: {
    color: '#fafaf9',
  },
  photoArea: {
    minHeight: 200,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3f3f46',
    backgroundColor: 'rgba(24, 24, 27, 0.3)',
    padding: 16,
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCell: {
    width: '47%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  uploadedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  uploadedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  photoPlaceholder: {
    flex: 1,
    minHeight: 168,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '500',
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#27272a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignSelf: 'flex-start',
  },
  addPhotoDisabled: {
    opacity: 0.5,
  },
  addPhotoText: {
    color: '#d4d4d8',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#f87171',
    fontWeight: '500',
  },
  captionInput: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    color: '#fafaf9',
    fontSize: 14,
    fontWeight: '500',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#27272a',
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#fafaf9',
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
});
