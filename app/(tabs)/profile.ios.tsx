
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user } = useUser();

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>טוען...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={48}
                color="#FFFFFF"
              />
            </View>
          </View>
          <Text style={styles.userName}>{user.fullName}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {user.hasSignedAgreement ? 'לקוח פעיל' : 'בתהליך רישום'}
            </Text>
          </View>
        </LinearGradient>

        {/* Profile Details */}
        <View style={styles.detailsContainer}>
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={24}
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
                  size={24}
                  color="#2784F5"
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.text + '99' }]}>טלפון</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{user.phoneNumber}</Text>
              </View>
            </View>
          </View>

          {user.travelDate && (
            <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={24}
                    color="#F5AD27"
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.text + '99' }]}>תאריך נסיעה</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(user.travelDate).toLocaleDateString('he-IL')}
                  </Text>
                </View>
              </View>
            </View>
          )}

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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  detailCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  infoCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginRight: 12,
    textAlign: 'right',
  },
});
