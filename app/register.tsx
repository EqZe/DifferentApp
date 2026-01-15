
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { api } from '@/utils/api';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setUser } = useUser();
  
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  
  const progress = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${progress.value}%`, {
        damping: 15,
        stiffness: 100,
      }),
    };
  });

  const handleNext = () => {
    console.log('User tapped Continue button on step', step);
    
    if (step === 1) {
      if (!fullName.trim()) {
        return;
      }
      setStep(2);
      progress.value = 33;
      setTimeout(() => inputRef.current?.focus(), 300);
    } else if (step === 2) {
      if (!city.trim()) {
        return;
      }
      setStep(3);
      progress.value = 66;
      setTimeout(() => inputRef.current?.focus(), 300);
    } else if (step === 3) {
      handleRegister();
    }
  };

  const handleRegister = async () => {
    console.log('Registering/logging in user with phone:', phoneNumber);
    
    if (!phoneNumber.trim() || phoneNumber.length < 9) {
      return;
    }

    setIsLoading(true);
    progress.value = 100;
    
    try {
      // First, check if user already exists with this phone number
      console.log('Checking if user exists with phone:', phoneNumber);
      const existingUser = await api.getUserByPhone(phoneNumber);
      
      if (existingUser) {
        // User exists, log them in
        console.log('User found, logging in:', existingUser.fullName);
        await setUser(existingUser);
        
        setTimeout(() => {
          router.replace('/(tabs)/(home)');
        }, 500);
        return;
      }

      // User doesn't exist, register new user
      console.log('User not found, registering new user');
      const registeredUser = await api.register(fullName, city, phoneNumber);
      console.log('User registered successfully:', registeredUser);

      await setUser(registeredUser);
      
      // Small delay for smooth transition
      setTimeout(() => {
        router.replace('/(tabs)/(home)');
      }, 500);
    } catch (error) {
      console.error('Registration/login error:', error);
      
      if (Platform.OS === 'web') {
        alert('שגיאה בהרשמה. אנא נסה שוב.');
      } else {
        Alert.alert('שגיאה', 'לא הצלחנו לרשום אותך. אנא נסה שוב.');
      }
      
      setIsLoading(false);
      progress.value = 66;
    }
  };

  const canContinue = () => {
    if (step === 1) return fullName.trim().length > 0;
    if (step === 2) return city.trim().length > 0;
    if (step === 3) return phoneNumber.trim().length >= 9;
    return false;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Step 1: Full Name */}
          {step === 1 && (
            <Animated.View
              entering={FadeIn.duration(400)}
              exiting={FadeOut.duration(200)}
              style={styles.stepContainer}
            >
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={['#2784F5', '#1E6FD9']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <IconSymbol
                    ios_icon_name="person.fill"
                    android_material_icon_name="person"
                    size={40}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>
              
              <Text style={[styles.title, { color: colors.text }]}>מה השם שלך?</Text>
              <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                נתחיל בהכרות קצרה
              </Text>

              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="שם מלא"
                placeholderTextColor={colors.text + '66'}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                textAlign="center"
                autoFocus
                onSubmitEditing={handleNext}
                returnKeyType="next"
              />
            </Animated.View>
          )}

          {/* Step 2: City */}
          {step === 2 && (
            <Animated.View
              entering={SlideInRight.duration(300)}
              exiting={SlideOutLeft.duration(200)}
              style={styles.stepContainer}
            >
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={['#2784F5', '#1E6FD9']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={40}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>
              
              <Text style={[styles.title, { color: colors.text }]}>איפה הבית שלך?</Text>
              <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                באיזו עיר אתה בונה את הבית
              </Text>

              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="עיר"
                placeholderTextColor={colors.text + '66'}
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
                textAlign="center"
                onSubmitEditing={handleNext}
                returnKeyType="next"
              />
            </Animated.View>
          )}

          {/* Step 3: Phone Number */}
          {step === 3 && (
            <Animated.View
              entering={SlideInRight.duration(300)}
              exiting={SlideOutLeft.duration(200)}
              style={styles.stepContainer}
            >
              <View style={styles.iconCircle}>
                <LinearGradient
                  colors={['#2784F5', '#1E6FD9']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={40}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>
              
              <Text style={[styles.title, { color: colors.text }]}>מספר הטלפון שלך?</Text>
              <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                כדי שנוכל ליצור איתך קשר
              </Text>

              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="05X-XXXXXXX"
                placeholderTextColor={colors.text + '66'}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                textAlign="center"
                onSubmitEditing={handleNext}
                returnKeyType="done"
              />
            </Animated.View>
          )}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              !canContinue() && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canContinue() || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canContinue() ? ['#2784F5', '#1E6FD9'] : ['#94A3B8', '#64748B']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>המשך</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2784F5',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: '#2784F5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 48,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    fontSize: 24,
    fontWeight: '600',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderRadius: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2784F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
