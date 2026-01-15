
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import Constants from 'expo-constants';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setUser } = useUser();
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('שגיאה', 'נא להזין שם מלא');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('שגיאה', 'נא להזין עיר');
      return false;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('שגיאה', 'נא להזין מספר טלפון');
      return false;
    }
    if (phoneNumber.length < 9) {
      Alert.alert('שגיאה', 'מספר טלפון לא תקין');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    console.log('Register button pressed');
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('Registering user:', { fullName, city, phoneNumber });
      
      // Get backend URL from app.json configuration
      const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;
      console.log('Backend URL:', BACKEND_URL);
      
      if (!BACKEND_URL) {
        throw new Error('Backend URL not configured');
      }

      // Call the registration API endpoint
      const response = await fetch(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          city,
          phoneNumber,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Registration API error:', response.status, errorText);
        throw new Error(`Registration failed: ${response.status}`);
      }

      const registeredUser = await response.json();
      console.log('User registered successfully:', registeredUser);

      // Save user to context and secure storage
      await setUser(registeredUser);
      
      // Navigate to home screen
      router.replace('/(tabs)/(home)');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בהרשמה. נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with gradient */}
          <LinearGradient
            colors={['#2784F5', '#1E6FD9']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name="house.fill"
                android_material_icon_name="home"
                size={48}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.title}>ברוכים הבאים</Text>
            <Text style={styles.subtitle}>ייבוא תכולת בית מסין לישראל</Text>
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={[styles.formTitle, { color: colors.text }]}>הרשמה למערכת</Text>
            <Text style={[styles.formSubtitle, { color: colors.text + '99' }]}>
              נא למלא את הפרטים הבאים להתחלת התהליך
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>שם מלא</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={20}
                  color={colors.text + '66'}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="הזן שם מלא"
                  placeholderTextColor={colors.text + '66'}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  textAlign="right"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>עיר בניית הבית</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={20}
                  color={colors.text + '66'}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="הזן עיר"
                  placeholderTextColor={colors.text + '66'}
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                  textAlign="right"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>מספר טלפון</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={20}
                  color={colors.text + '66'}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="05X-XXXXXXX"
                  placeholderTextColor={colors.text + '66'}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2784F5', '#1E6FD9']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>המשך</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color="#F5AD27"
              />
              <Text style={[styles.infoText, { color: colors.text + '99' }]}>
                הפרטים ישמרו במערכת ויאפשרו לנו ללוות אותך לאורך כל התהליך
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'right',
  },
  formSubtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'right',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    textAlign: 'right',
  },
  button: {
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2784F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 173, 39, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    marginRight: 12,
    textAlign: 'right',
  },
});
