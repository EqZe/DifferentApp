
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2784F5',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5AD27',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusBadgeAgreed: {
    backgroundColor: '#4CAF50',
  },
});

export default function ProfileScreen() {
  const { user } = useUser();
  const { colors } = useTheme();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'לא נקבע';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  const statusText = user?.hasSignedAgreement ? 'חתמת על הסכם' : 'טרם חתמת על הסכם';
  const statusIcon = user?.hasSignedAgreement ? 'check-circle' : 'info';

  return (
    <LinearGradient colors={['#2784F5', '#1a5fb8']} style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/864198af-83b6-4cbd-bb45-8f2196a4449e.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>הפרופיל שלי</Text>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={24}
                color="#2784F5"
                style={styles.infoIcon}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>שם מלא</Text>
                <Text style={styles.infoValue}>{user?.fullName || '-'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={24}
                color="#2784F5"
                style={styles.infoIcon}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>עיר</Text>
                <Text style={styles.infoValue}>{user?.city || '-'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={24}
                color="#2784F5"
                style={styles.infoIcon}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>טלפון</Text>
                <Text style={styles.infoValue}>{user?.phoneNumber || '-'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>סטטוס</Text>
            <View
              style={[
                styles.statusBadge,
                user?.hasSignedAgreement && styles.statusBadgeAgreed,
              ]}
            >
              <IconSymbol
                ios_icon_name={
                  user?.hasSignedAgreement ? 'checkmark.circle.fill' : 'info.circle.fill'
                }
                android_material_icon_name={statusIcon}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.statusBadgeText}>{statusText}</Text>
            </View>
          </View>

          {user?.hasSignedAgreement && (
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>תאריך נסיעה</Text>
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={24}
                  color="#2784F5"
                  style={styles.infoIcon}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {formatDate(user?.travelDate || null)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
