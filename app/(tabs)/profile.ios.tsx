
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user } = useUser();

  React.useEffect(() => {
    console.log('✅ ProfileScreen (iOS) mounted, user:', user?.fullName);
  }, []);

  if (!user) {
    console.log('⚠️ ProfileScreen (iOS): No user found');
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>טוען...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('🎨 ProfileScreen (iOS) rendering for user:', user.fullName);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with gradient */}
        <LinearGradient
          colors={['#2784F5', '#1E6FD9']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user.fullName}</Text>
          <View style={styles.statusBadge}>
            <IconSymbol
              ios_icon_name={user.hasSignedAgreement ? 'checkmark.circle.fill' : 'clock.fill'}
              android_material_icon_name={user.hasSignedAgreement ? 'check-circle' : 'schedule'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>
              {user.hasSignedAgreement ? 'לקוח פעיל' : 'בתהליך רישום'}
            </Text>
          </View>
        </LinearGradient>

        {/* Profile Details */}
        <View style={styles.detailsContainer}>
          {/* Personal Information Section */}
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="person.circle.fill"
              android_material_icon_name="account-circle"
              size={24}
              color="#2784F5"
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>פרטים אישיים</Text>
          </View>

          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={22}
                  color="#2784F5"
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.text + '99' }]}>שם מלא</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{user.fullName}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={22}
                  color="#2784F5"
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.text + '99' }]}>עיר</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{user.city}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={22}
                  color="#2784F5"
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.text + '99' }]}>טלפון</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{user.phoneNumber}</Text>
              </View>
            </View>
          </View>

          {/* Travel Information Section */}
          {user.hasSignedAgreement && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <IconSymbol
                  ios_icon_name="airplane"
                  android_material_icon_name="flight"
                  size={24}
                  color="#F5AD27"
                />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>מידע על הנסיעה</Text>
              </View>

              {user.travelDate && (
                <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.detailRow}>
                    <View style={[styles.detailIcon, { backgroundColor: 'rgba(245, 173, 39, 0.1)' }]}>
                      <IconSymbol
                        ios_icon_name="calendar"
                        android_material_icon_name="calendar-today"
                        size={22}
                        color="#F5AD27"
                      />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={[styles.detailLabel, { color: colors.text + '99' }]}>תאריך נסיעה</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {new Date(user.travelDate).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={[styles.highlightCard, { backgroundColor: 'rgba(245, 173, 39, 0.1)' }]}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={24}
                  color="#F5AD27"
                />
                <Text style={[styles.highlightText, { color: colors.text }]}>
                  חתמת על ההסכם! יש לך גישה מלאה לכל שירותי הליווי שלנו.
                </Text>
              </View>
            </>
          )}

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: 'rgba(39, 132, 245, 0.1)' }]}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color="#2784F5"
            />
            <Text style={[styles.infoText, { color: colors.text }]}>
              הפרטים שלך מאובטחים ונשמרים במערכת. צוות הליווי שלנו ישתמש בהם כדי לספק לך את השירות הטוב ביותר.
            </Text>
          </View>

          {/* Account Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={28}
                color="#2784F5"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {new Date(user.createdAt).toLocaleDateString('he-IL', { month: 'short', year: 'numeric' })}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text + '99' }]}>תאריך הצטרפות</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <IconSymbol
                ios_icon_name="checkmark.seal.fill"
                android_material_icon_name="verified"
                size={28}
                color="#10B981"
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {user.hasSignedAgreement ? 'פעיל' : 'ממתין'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text + '99' }]}>סטטוס חשבון</Text>
            </View>
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
    flexGrow: 1,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    gap: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(39, 132, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    marginRight: 16,
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  highlightCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
