/**
 * Settings screen. Account info with editable userId, name, privacy. Logout.
 * Aligns with web Settings component.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import { LogOut } from '../components/icons';

export default function SettingsScreen() {
  const { user, logout, apiClient, refreshUser } = useAuth();
  const [userIdValue, setUserIdValue] = useState(user?.userId ?? user?.id ?? '');
  const [nameValue, setNameValue] = useState(user?.name ?? '');
  const [privacy, setPrivacy] = useState<'public' | 'private'>(
    (user?.privacy as 'public' | 'private') ?? 'public'
  );
  const [isEditingUserId, setIsEditingUserId] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingUserId, setSavingUserId] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (user) {
      setUserIdValue(user.userId ?? user.id ?? '');
      setNameValue(user.name ?? '');
      setPrivacy((user.privacy as 'public' | 'private') ?? 'public');
    }
  }, [user]);

  const handleSaveUserId = async () => {
    if (!user?.id || savingUserId) return;
    setSavingUserId(true);
    setError(null);
    try {
      const res = await apiClient.put<{ success: boolean; error?: string }>(
        API_PATHS.USER_PROFILE(user.id),
        { userId: userIdValue.trim() }
      );
      if (res?.success !== false) {
        setIsEditingUserId(false);
        await refreshUser();
      } else {
        setError(res?.error ?? 'Failed to update');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSavingUserId(false);
    }
  };

  const handleSaveName = async () => {
    if (!user?.id || savingName) return;
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed.length < 1) {
      setNameError('Name is required');
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      const res = await apiClient.put<{ success: boolean; error?: string }>(
        API_PATHS.USER_PROFILE(user.id),
        { name: trimmed }
      );
      if (res?.success !== false) {
        setIsEditingName(false);
        await refreshUser();
      } else {
        setNameError(res?.error ?? 'Failed to update');
      }
    } catch (e) {
      setNameError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSavingName(false);
    }
  };

  const handlePrivacyChange = async (newPrivacy: 'public' | 'private') => {
    if (!user?.id || savingPrivacy || newPrivacy === privacy) return;
    setSavingPrivacy(true);
    try {
      const res = await apiClient.put<{ success: boolean; error?: string }>(
        API_PATHS.USER_PROFILE(user.id),
        { privacy: newPrivacy }
      );
      if (res?.success !== false) {
        setPrivacy(newPrivacy);
        await refreshUser();
      }
    } catch {
      // Ignore
    } finally {
      setSavingPrivacy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>

        <View style={styles.row}>
          <Text style={styles.label}>User ID</Text>
          {isEditingUserId ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.input}
                value={userIdValue}
                onChangeText={setUserIdValue}
                placeholder="User ID"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveUserId}
                disabled={savingUserId}
              >
                {savingUserId ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setIsEditingUserId(false);
                  setUserIdValue(user?.userId ?? user?.id ?? '');
                  setError(null);
                }}
                disabled={savingUserId}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditingUserId(true)}
              style={styles.valueTouchable}
            >
              <Text style={styles.value}>{userIdValue || '—'}</Text>
              
            </TouchableOpacity>
          )}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          {isEditingName ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.input}
                value={nameValue}
                onChangeText={setNameValue}
                placeholder="Name"
                placeholderTextColor="#666"
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveName}
                disabled={savingName}
              >
                {savingName ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setIsEditingName(false);
                  setNameValue(user?.name ?? '');
                  setNameError(null);
                }}
                disabled={savingName}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditingName(true)}
              style={styles.valueTouchable}
            >
              <Text style={styles.value}>{user?.name ?? '—'}</Text>
              
            </TouchableOpacity>
          )}
        </View>
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? '—'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Privacy</Text>
          <View style={styles.privacyRow}>
            <TouchableOpacity
              style={styles.privacyOption}
              onPress={() => handlePrivacyChange('public')}
              disabled={savingPrivacy}
            >
              <Text
                style={[
                  styles.privacyText,
                  privacy === 'public' && styles.privacyTextActive,
                ]}
              >
                Public
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.privacyOption}
              onPress={() => handlePrivacyChange('private')}
              disabled={savingPrivacy}
            >
              <Text
                style={[
                  styles.privacyText,
                  privacy === 'private' && styles.privacyTextActive,
                ]}
              >
                Private
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.placeholder}>Coming soon</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.placeholder}>Hyve v1.0.0</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
        <LogOut color="#ef4444" size={18} />
        <Text style={styles.logoutText}>Log out</Text>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#fff',
  },
  valueTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editHint: {
    fontSize: 12,
    color: '#666',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#888',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  privacyOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  privacyText: {
    color: '#888',
    fontSize: 14,
  },
  privacyTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  placeholder: {
    fontSize: 14,
    color: '#666',
    paddingVertical: 8,
  },
  logoutButton: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
