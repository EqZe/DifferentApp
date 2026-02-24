
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
  Image,
  ScrollView,
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

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setUser } = useUser();
  
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
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
    
    if (isLogin) {
      if (step === 1) {
        if (!email.trim() || !email.includes('@')) {
          return;
        }
        setStep(2);
        progress.value = 50;
        setTimeout(() => inputRef.current?.focus(), 300);
      } else if (step === 2) {
        handleAuth();
      }
    } else {
      if (step === 1) {
        if (!fullName.trim()) {
          return;
        }
        setStep(2);
        progress.value = 20;
        setTimeout(() => inputRef.current?.focus(), 300);
      } else if (step === 2) {
        if (!city.trim()) {
          return;
        }
        setStep(3);
        progress.value = 40;
        setTimeout(() => inputRef.current?.focus(), 300);
      } else if (step === 3) {
        if (!phoneNumber.trim() || phoneNumber.length < 9) {
          return;
        }
        setStep(4);
        progress.value = 60;
        setTimeout(() => inputRef.current?.focus(), 300);
      } else if (step === 4) {
        if (!email.trim() || !email.includes('@')) {
          return;
        }
        setStep(5);
        progress.value = 80;
        setTimeout(() => inputRef.current?.focus(), 300);
      } else if (step === 5) {
        handleAuth();
      }
    }
  };

  const handleAuth = async () => {
    console.log('Authenticating user:', isLogin ? 'login' : 'signup');
    
    if (!email.trim() || !password.trim()) {
      return;
    }

    setIsLoading(true);
    progress.value = 100;
    
    try {
      let userData;
      
      if (isLogin) {
        console.log('Signing in user with email:', email);
        userData = await api.signIn(email, password);
        console.log('Sign in successful:', userData.fullName);
      } else {
        console.log('Signing up new user');
        userData = await api.signUp(email, password, fullName, city, phoneNumber);
        console.log('Sign up successful:', userData.fullName);
      }
      
      await setUser(userData);
      
      setTimeout(() => {
        console.log('Redirecting to home screen');
        router.replace('/(tabs)/(home)');
      }, 500);
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = isLogin 
        ? 'שגיאה בהתחברות. אנא בדוק את הפרטים ונסה שוב.'
        : 'שגיאה בהרשמה. אנא נסה שוב.';
      
      // Add more specific error messages
      if (error.message) {
        errorMessage += '\n\n' + error.message;
      }
      
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('שגיאה', errorMessage);
      }
      
      setIsLoading(false);
      progress.value = isLogin ? 50 : 80;
    }
  };

  const canContinue = () => {
    if (isLogin) {
      if (step === 1) return email.trim().length > 0 && email.includes('@');
      if (step === 2) return password.trim().length >= 6;
    } else {
      if (step === 1) return fullName.trim().length > 0;
      if (step === 2) return city.trim().length > 0;
      if (step === 3) return phoneNumber.trim().length >= 9;
      if (step === 4) return email.trim().length > 0 && email.includes('@');
      if (step === 5) return password.trim().length >= 6;
    }
    return false;
  };

  const toggleMode = () => {
    console.log('User toggled auth mode to:', isLogin ? 'signup' : 'login');
    setIsLogin(!isLogin);
    setStep(1);
    progress.value = 0;
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior="position"
        style={styles.keyboardView}
        contentContainerStyle={styles.keyboardContent}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/864198af-83b6-4cbd-bb45-8f2196a4449e.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <Animated.View style={[styles.progressBar, progressStyle]} />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Login Mode */}
            {isLogin && (
              <>
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
                          ios_icon_name="envelope.fill"
                          android_material_icon_name="email"
                          size={40}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                    </View>
                    
                    <Text style={[styles.title, { color: colors.text }]}>ברוך שובך!</Text>
                    <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                      מה כתובת האימייל שלך?
                    </Text>

                    <TextInput
                      ref={inputRef}
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      placeholder="example@email.com"
                      placeholderTextColor={colors.text + '66'}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      textAlign="center"
                      autoFocus
                      onSubmitEditing={handleNext}
                      returnKeyType="next"
                    />
                  </Animated.View>
                )}

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
                          ios_icon_name="lock.fill"
                          android_material_icon_name="lock"
                          size={40}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                    </View>
                    
                    <Text style={[styles.title, { color: colors.text }]}>מה הסיסמה שלך?</Text>
                    <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                      הזן את הסיסמה שלך
                    </Text>

                    <TextInput
                      ref={inputRef}
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      placeholder="סיסמה"
                      placeholderTextColor={colors.text + '66'}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      textAlign="center"
                      onSubmitEditing={handleNext}
                      returnKeyType="done"
                    />
                  </Animated.View>
                )}
              </>
            )}

            {/* Signup Mode */}
            {!isLogin && (
              <>
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
                      returnKeyType="next"
                    />
                  </Animated.View>
                )}

                {step === 4 && (
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
                          ios_icon_name="envelope.fill"
                          android_material_icon_name="email"
                          size={40}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                    </View>
                    
                    <Text style={[styles.title, { color: colors.text }]}>מה האימייל שלך?</Text>
                    <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                      לצורך התחברות למערכת
                    </Text>

                    <TextInput
                      ref={inputRef}
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      placeholder="example@email.com"
                      placeholderTextColor={colors.text + '66'}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      textAlign="center"
                      onSubmitEditing={handleNext}
                      returnKeyType="next"
                    />
                  </Animated.View>
                )}

                {step === 5 && (
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
                          ios_icon_name="lock.fill"
                          android_material_icon_name="lock"
                          size={40}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                    </View>
                    
                    <Text style={[styles.title, { color: colors.text }]}>בחר סיסמה</Text>
                    <Text style={[styles.subtitle, { color: colors.text + '99' }]}>
                      לפחות 6 תווים
                    </Text>

                    <TextInput
                      ref={inputRef}
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                      placeholder="סיסמה"
                      placeholderTextColor={colors.text + '66'}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      textAlign="center"
                      onSubmitEditing={handleNext}
                      returnKeyType="done"
                    />
                  </Animated.View>
                )}
              </>
            )}
          </View>

          {/* Toggle Login/Signup */}
          <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
            <Text style={[styles.toggleText, { color: colors.text + '99' }]}>
              {isLogin ? 'אין לך חשבון? ' : 'כבר יש לך חשבון? '}
              <Text style={{ color: '#2784F5', fontWeight: '600' }}>
                {isLogin ? 'הירשם' : 'התחבר'}
              </Text>
            </Text>
          </TouchableOpacity>

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
                  <Text style={styles.buttonText}>
                    {(isLogin && step === 2) || (!isLogin && step === 5) ? 'סיום' : 'המשך'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
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
  keyboardContent: {
    flexGrow: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  logo: {
    width: 240,
    height: 80,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
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
    minHeight: 400,
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
  toggleButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
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
