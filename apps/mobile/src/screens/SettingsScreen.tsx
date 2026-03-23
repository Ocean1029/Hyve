/**
 * Settings screen — v1 design language.
 * Glass cards, design tokens, expandable profile/privacy sections.
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
  Switch,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import {
  LogOut,
  ChevronRight,
  Moon,
  User,
  Shield,
  Bell,
  Globe,
  HelpCircle,
  Flag,
  FileText,
  ChevronDown,
} from '../components/icons';
import GlassCard from '../components/ui/GlassCard';
import { Colors, Space, Radius } from '../theme';

// Placeholder alert for unimplemented features
const showComingSoon = () =>
  Alert.alert('Coming Soon', '此功能尚未實作');

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  trailing?: React.ReactNode;
}

function SettingRow({ icon, label, onPress, trailing }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowTrailing}>
        {trailing ?? <ChevronRight size={16} color={Colors.text3} />}
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

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

  const [profileExpanded, setProfileExpanded] = useState(false);
  const [privacyExpanded, setPrivacyExpanded] = useState(false);

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
      {/* ── APPEARANCE ── */}
      <SectionHeader title="APPEARANCE" />
      <GlassCard padding={0}>
        <SettingRow
          icon={<Moon size={16} color={Colors.text1} />}
          label="Dark Mode"
          onPress={showComingSoon}
          trailing={
            <Switch
              value={true}
              onValueChange={showComingSoon}
              trackColor={{ false: Colors.surface2, true: Colors.goldDim }}
              thumbColor={Colors.gold}
              ios_backgroundColor={Colors.surface2}
            />
          }
        />
      </GlassCard>

      {/* ── ACCOUNT ── */}
      <SectionHeader title="ACCOUNT" />
      <GlassCard padding={0}>
        {/* Profile Information — expandable */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setProfileExpanded((v) => !v)}
          activeOpacity={0.6}
        >
          <View style={styles.iconBox}>
            <User size={16} color={Colors.text1} />
          </View>
          <Text style={styles.rowLabel}>Profile Information</Text>
          <View style={styles.rowTrailing}>
            {profileExpanded ? (
              <ChevronDown size={16} color={Colors.text3} />
            ) : (
              <ChevronRight size={16} color={Colors.text3} />
            )}
          </View>
        </TouchableOpacity>

        {profileExpanded && (
          <View style={styles.expandedContent}>
            {/* User ID */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>User ID</Text>
              {isEditingUserId ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.input}
                    value={userIdValue}
                    onChangeText={setUserIdValue}
                    placeholder="User ID"
                    placeholderTextColor={Colors.text3}
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
                  style={styles.fieldValueRow}
                >
                  <Text style={styles.fieldValue}>{userIdValue || '—'}</Text>
                  <Text style={styles.editHint}>Tap to edit</Text>
                </TouchableOpacity>
              )}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {/* Name */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Name</Text>
              {isEditingName ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.input}
                    value={nameValue}
                    onChangeText={setNameValue}
                    placeholder="Name"
                    placeholderTextColor={Colors.text3}
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
                  style={styles.fieldValueRow}
                >
                  <Text style={styles.fieldValue}>{user?.name ?? '—'}</Text>
                  <Text style={styles.editHint}>Tap to edit</Text>
                </TouchableOpacity>
              )}
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            {/* Email (read-only) */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{user?.email ?? '—'}</Text>
            </View>
          </View>
        )}

        {/* Separator */}
        <View style={styles.separator} />

        {/* Privacy & Security — expandable */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setPrivacyExpanded((v) => !v)}
          activeOpacity={0.6}
        >
          <View style={styles.iconBox}>
            <Shield size={16} color={Colors.text1} />
          </View>
          <Text style={styles.rowLabel}>Privacy & Security</Text>
          <View style={styles.rowTrailing}>
            {privacyExpanded ? (
              <ChevronDown size={16} color={Colors.text3} />
            ) : (
              <ChevronRight size={16} color={Colors.text3} />
            )}
          </View>
        </TouchableOpacity>

        {privacyExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.fieldLabel}>Account Privacy</Text>
            <View style={styles.privacyRow}>
              <TouchableOpacity
                style={[
                  styles.privacyOption,
                  privacy === 'public' && styles.privacyOptionActive,
                ]}
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
                style={[
                  styles.privacyOption,
                  privacy === 'private' && styles.privacyOptionActive,
                ]}
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
              {savingPrivacy && (
                <ActivityIndicator size="small" color={Colors.gold} />
              )}
            </View>
          </View>
        )}

        <View style={styles.separator} />

        {/* Notifications — placeholder */}
        <SettingRow
          icon={<Bell size={16} color={Colors.text1} />}
          label="Notifications"
          onPress={showComingSoon}
        />

        <View style={styles.separator} />

        {/* Language — placeholder */}
        <SettingRow
          icon={<Globe size={16} color={Colors.text1} />}
          label="Language"
          onPress={showComingSoon}
        />
      </GlassCard>

      {/* ── SUPPORT ── */}
      <SectionHeader title="SUPPORT" />
      <GlassCard padding={0}>
        <SettingRow
          icon={<HelpCircle size={16} color={Colors.text1} />}
          label="Help Center"
          onPress={showComingSoon}
        />
        <View style={styles.separator} />
        <SettingRow
          icon={<Flag size={16} color={Colors.text1} />}
          label="Report a Problem"
          onPress={showComingSoon}
        />
        <View style={styles.separator} />
        <SettingRow
          icon={<FileText size={16} color={Colors.text1} />}
          label="Terms of Service"
          onPress={showComingSoon}
        />
      </GlassCard>

      {/* ── LOGOUT ── */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
        <LogOut color="#ef4444" size={18} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  content: {
    padding: Space.lg,
    paddingBottom: 48,
  },

  // Section header
  sectionHeader: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: Space.xxl,
    marginBottom: Space.sm,
    marginLeft: Space.xs,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    minHeight: 48,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Space.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text1,
  },
  rowTrailing: {
    marginLeft: Space.sm,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: Colors.glassBorder,
    marginHorizontal: Space.lg,
  },

  // Expandable content
  expandedContent: {
    paddingHorizontal: Space.lg,
    paddingBottom: Space.lg,
  },

  // Field rows inside expanded sections
  fieldRow: {
    paddingVertical: Space.sm,
  },
  fieldLabel: {
    fontSize: 10,
    color: Colors.text3,
    marginBottom: Space.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldValue: {
    fontSize: 14,
    color: Colors.text1,
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editHint: {
    fontSize: 10,
    color: Colors.text3,
  },

  // Editing
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minWidth: 120,
    backgroundColor: Colors.surface2,
    color: Colors.text1,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    borderRadius: Radius.sm,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  saveBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm,
    borderRadius: Radius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.bg0,
    fontWeight: '700',
    fontSize: 13,
  },
  cancelBtn: {
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
  },
  cancelBtnText: {
    color: Colors.text3,
    fontSize: 13,
  },
  errorText: {
    color: Colors.error,
    fontSize: 11,
    marginTop: Space.xs,
  },

  // Privacy
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    marginTop: Space.xs,
  },
  privacyOption: {
    paddingHorizontal: Space.lg,
    paddingVertical: Space.sm,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  privacyOptionActive: {
    backgroundColor: Colors.goldFaint,
    borderColor: Colors.goldDim,
  },
  privacyText: {
    color: Colors.text3,
    fontSize: 13,
    fontWeight: '500',
  },
  privacyTextActive: {
    color: Colors.gold,
    fontWeight: '600',
  },

  // Logout
  logoutButton: {
    marginTop: Space.xxxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: Space.lg,
    paddingHorizontal: Space.xxl,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.20)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
