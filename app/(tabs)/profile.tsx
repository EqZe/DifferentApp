
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'התנתקות',
      'האם אתה בטוח שברצונך להתנתק?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'התנתק',
          style: 'destructive',
          onPress: async () => {
            console.log('User confirmed logout');
            await logout();
            router.replace('/register');
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#2784F5', '#1E6FD9']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarContainer}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={48}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.phone}>{user.phoneNumber}</Text>
        </LinearGradient>

        {/* Profile Info */}
        <View style={styles.contentContainer}>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text + '99' }]}>שם מלא</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user.fullName}</Text>
              </View>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={24}
                color="#2784F5"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text + '99' }]}>עיר</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user.city}</Text>
              </View>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={24}
                color="#2784F5"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text + '99' }]}>טלפון</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user.phoneNumber}</Text>
              </View>
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={24}
                color="#2784F5"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text + '99' }]}>סטטוס</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user.hasSignedAgreement ? 'לאחר חתימה' : 'לפני חתימה'}
                </Text>
              </View>
              <IconSymbol
                ios_icon_name={user.hasSignedAgreement ? 'checkmark.circle.fill' : 'clock.fill'}
                android_material_icon_name={user.hasSignedAgreement ? 'check-circle' : 'schedule'}
                size={24}
                color={user.hasSignedAgreement ? '#10B981' : '#F5AD27'}
              />
            </View>

            {user.hasSignedAgreement && user.travelDate && (
              <React.Fragment>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.text + '99' }]}>תאריך נסיעה</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {new Date(user.travelDate).toLocaleDateString('he-IL')}
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={24}
                    color="#2784F5"
                  />
                </View>
              </React.Fragment>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="questionmark.circle.fill"
                android_material_icon_name="help"
                size={24}
                color="#2784F5"
              />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>עזרה ותמיכה</Text>
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow-back"
                size={20}
                color={colors.text + '66'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={24}
                color="#2784F5"
              />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>אודות</Text>
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow-back"
                size={20}
                color={colors.text + '66'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.logoutButton, { borderColor: '#EF4444' }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="arrow.right.square.fill"
                android_material_icon_name="logout"
                size={24}
                color="#EF4444"
              />
              <Text style={styles.logoutButtonText}>התנתקות</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  logoutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    gap: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
});
