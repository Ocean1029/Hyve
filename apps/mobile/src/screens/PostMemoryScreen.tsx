/**
 * Post Memory screen. Create a memory with photo for a focus session.
 * Entry: After ending a focus session, or from TodayScreen "Add memory" for a session.
 */
import React, { useState } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../utils/upload';
import { API_PATHS } from '@hyve/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PostMemory'>;

export default function PostMemoryScreen({ route, navigation }: Props) {
  const { focusSessionId } = route.params;
  const { apiClient, getToken } = useAuth();
  const [content, setContent] = useState('');
  const [happyIndex, setHappyIndex] = useState<number | undefined>();
  const [mood, setMood] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!photoUri) {
      Alert.alert('Photo required', 'Please select a photo for this memory.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please sign in again.');
        return;
      }
      const upload = await uploadImage(photoUri, token);
      if (!upload.success || !upload.url) {
        Alert.alert('Upload failed', upload.error ?? 'Could not upload photo.');
        return;
      }
      await apiClient.post(API_PATHS.MEMORY_WITH_PHOTO, {
        focusSessionId,
        photoUrl: upload.url,
        content: content || undefined,
        happyIndex: happyIndex !== undefined ? happyIndex : undefined,
        mood: mood || undefined,
      });
      Alert.alert('Success', 'Memory saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save memory');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add Memory</Text>

      <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} />
        ) : (
          <Text style={styles.photoPlaceholder}>Select photo</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Caption (optional)</Text>
      <TextInput
        style={styles.input}
        value={content}
        onChangeText={setContent}
        placeholder="What happened?"
        placeholderTextColor="#666"
        multiline
      />

      <Text style={styles.label}>Happy index 0–10 (optional)</Text>
      <TextInput
        style={styles.input}
        value={happyIndex !== undefined ? String(happyIndex) : ''}
        onChangeText={(t) => {
          const n = parseInt(t, 10);
          setHappyIndex(Number.isNaN(n) ? undefined : Math.min(10, Math.max(0, n)));
        }}
        placeholder="0–10"
        placeholderTextColor="#666"
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Mood (optional)</Text>
      <TextInput
        style={styles.input}
        value={mood}
        onChangeText={setMood}
        placeholder="e.g. grateful, energized"
        placeholderTextColor="#666"
      />

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitText}>Save memory</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  photoButton: {
    width: 160,
    height: 160,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 24,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 64,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  submitButton: {
    backgroundColor: '#4285f4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
