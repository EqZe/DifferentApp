
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  Modal,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, MapPin, Calendar, FileCheck, LogOut } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'לא הוגדר';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'תאריך לא תקין';
  }
}

// Skeleton pulse component
function SkeletonBox({ width: w, height: h, borderRadius = 8, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800 }),
      -1,
      true
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius,
          backgroundColor: '#CBD5E1',
        },
        animStyle,
        style,
      ]}
    />
  );
}

function SkeletonScreen({ isDark }: { isDark: boolean }) {
  const bg = isDark ? Colors.dark.background : Colors.light.backgroundSecondary;
  const surface = isDark ? Colors.dark.card : Colors.light.card;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero skeleton */}
        <View style={{
          alignItems: 'center',
          paddingTop: 40,
          paddingBottom: 32,
          paddingHorizontal: 24,
          backgroundColor: isDark ? '#0F172A' : '#EBF4FF',
        }}>
          <SkeletonBox width={80} height={80} borderRadius={40} />
          <SkeletonBox width={160} height={20} borderRadius={10} style={{ marginTop: 16 }} />
          <SkeletonBox width={120} height={14} borderRadius={7} style={{ marginTop: 8 }} />
        </View>

        {/* Card skeleton */}
        <View style={{
          marginHorizontal: 16,
          marginTop: 20,
          backgroundColor: surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: isDark ? Colors.dark.cardBorder : Colors.light.cardBorder,
        }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: i < 5 ? 1 : 0,
              borderBottomColor: isDark ? Colors.dark.cardBorder : Colors.light.cardBorder,
            }}>
              <SkeletonBox width={20} height={20} borderRadius={4} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <SkeletonBox width={60} height={11} borderRadius={6} style={{ marginBottom: 6 }} />
                <SkeletonBox width={120} height={14} borderRadius={7} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const INFO_ROWS = [
  { key: 'fullName', label: 'שם מלא', Icon: User },
  { key: 'email', label: 'אימייל', Icon: Mail },
  { key: 'phoneNumber', label: 'טלפון', Icon: Phone },
  { key: 'city', label: 'עיר', Icon: MapPin },
  { key: 'travelDate', label: 'תאריך טיסה', Icon: Calendar },
  { key: 'contractStatus', label: 'סטטוס חוזה', Icon: FileCheck },
] as const;

export default function ProfileScreen() {
  const { user, session, refreshUser } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logoutScale = useSharedValue(1);
  const logoutAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoutScale.value }],
  }));

  const C = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    console.log('ProfileScreen: Component mounted');
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    console.log('ProfileScreen: User or session changed');
    console.log('ProfileScreen: user exists:', !!user);
    console.log('ProfileScreen: session exists:', !!session);
    if (!user && !session) {
      console.log('ProfileScreen: No user or session, redirecting to register');
      router.replace('/register');
    }
  }, [user, session, router]);

  const handleLogout = () => {
    console.log('ProfileScreen: Logout button pressed');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('ProfileScreen: Logout confirmed');
    setIsLoggingOut(true);
    try {
      console.log('ProfileScreen: Calling supabase.auth.signOut()');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('ProfileScreen: Logout error:', error);
        throw error;
      }
      console.log('ProfileScreen: ✅ Logout successful');
      setShowLogoutModal(false);
      router.replace('/register');
    } catch (error: any) {
      console.error('ProfileScreen: ❌ Logout failed:', error);
      console.error('ProfileScreen: Error message:', error?.message);
      setShowLogoutModal(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return <SkeletonScreen isDark={isDark} />;
  }

  const avatarInitial = user.fullName ? String(user.fullName).charAt(0).toUpperCase() : '?';
  const formattedTravelDate = formatDate(user.travelDate);

  const contractStatus = user.contractStatus ?? (user.hasContract ? 'active' : null);
  const contractBadgeBg =
    contractStatus === 'active' ? '#D1FAE5' :
    contractStatus === 'inactive' ? '#FEE2E2' :
    isDark ? '#334155' : '#F1F5F9';
  const contractBadgeText =
    contractStatus === 'active' ? '#065F46' :
    contractStatus === 'inactive' ? '#991B1B' :
    C.textSecondary;
  const contractLabel =
    contractStatus === 'active' ? 'חוזה פעיל' :
    contractStatus === 'inactive' ? 'ללא חוזה' :
    'לא הוגדר';

  const rowValues: Record<string, any> = {
    fullName: user.fullName || '—',
    email: user.email || '—',
    phoneNumber: user.phoneNumber || '—',
    city: user.city || '—',
    travelDate: formattedTravelDate,
    contractStatus: null, // rendered as badge
  };

  const heroBg = isDark
    ? ['#0F172A', '#1E293B'] as const
    : ['#EBF4FF', '#F8FAFC'] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
      <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <View style={{
            alignItems: 'center',
            paddingTop: 40,
            paddingBottom: 36,
            paddingHorizontal: 24,
            backgroundColor: heroBg[0],
          }}>
            {/* Gradient-like layered background */}
            <View style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: heroBg[0],
            }} />
            <View style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: '60%',
              backgroundColor: heroBg[1],
              opacity: 0.6,
            }} />

            {/* Avatar */}
            <Animated.View
              entering={ZoomIn.springify().damping(14).stiffness(120).delay(100)}
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: '#2784F5',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0px 8px 24px rgba(39, 132, 245, 0.35)',
                borderWidth: 3,
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#FFFFFF',
              }}
            >
              <Text style={{
                fontSize: 36,
                fontWeight: '700',
                color: '#FFFFFF',
                writingDirection: 'rtl',
                textAlign: 'center',
              }}>
                {avatarInitial}
              </Text>
            </Animated.View>

            {/* Name */}
            <Text style={{
              marginTop: 16,
              fontSize: 24,
              fontWeight: '700',
              color: C.text,
              writingDirection: 'rtl',
              textAlign: 'center',
            }}>
              {user.fullName}
            </Text>

            {/* Email */}
            <Text style={{
              marginTop: 4,
              fontSize: 14,
              color: C.textSecondary,
              writingDirection: 'rtl',
              textAlign: 'center',
            }}>
              {user.email}
            </Text>
          </View>

          {/* Info Card */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(350)}
            style={{
              marginHorizontal: 16,
              marginTop: 20,
              backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark ? Colors.dark.cardBorder : Colors.light.cardBorder,
              boxShadow: isDark
                ? '0px 4px 16px rgba(0,0,0,0.3)'
                : '0px 4px 16px rgba(15,23,42,0.06)',
              overflow: 'hidden',
            }}
          >
            {INFO_ROWS.map(({ key, label, Icon }, index) => {
              const isLast = index === INFO_ROWS.length - 1;
              const rowDelay = 150 + index * 40;

              return (
                <Animated.View
                  key={key}
                  entering={FadeInDown.delay(rowDelay).duration(300)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: isDark ? Colors.dark.cardBorder : Colors.light.cardBorder,
                  }}
                >
                  {/* Icon */}
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: isDark ? 'rgba(39,132,245,0.15)' : '#EBF4FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 12,
                  }}>
                    <Icon size={18} color="#2784F5" strokeWidth={2} />
                  </View>

                  {/* Label + Value */}
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{
                      fontSize: 12,
                      color: C.textSecondary,
                      marginBottom: 2,
                      writingDirection: 'rtl',
                      textAlign: 'right',
                    }}>
                      {label}
                    </Text>

                    {key === 'contractStatus' ? (
                      <View style={{
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 9999,
                        backgroundColor: contractBadgeBg,
                      }}>
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: contractBadgeText,
                          writingDirection: 'rtl',
                          textAlign: 'right',
                        }}>
                          {contractLabel}
                        </Text>
                      </View>
                    ) : (
                      <Text style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: C.text,
                        writingDirection: 'rtl',
                        textAlign: 'right',
                      }}>
                        {rowValues[key]}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Logout Button */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(350)}
            style={{ marginHorizontal: 16, marginTop: 20 }}
          >
            <Animated.View style={logoutAnimStyle}>
              <Pressable
                onPress={handleLogout}
                onPressIn={() => {
                  logoutScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
                }}
                onPressOut={() => {
                  logoutScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                }}
                style={{
                  height: 52,
                  backgroundColor: '#EF4444',
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0px 4px 12px rgba(239,68,68,0.3)',
                }}
              >
                <LogOut size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#FFFFFF',
                  writingDirection: 'rtl',
                  textAlign: 'right',
                }}>
                  התנתק
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </Animated.View>

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          console.log('ProfileScreen: Logout modal dismissed');
          setShowLogoutModal(false);
        }}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}>
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
              borderRadius: 20,
              padding: 28,
              boxShadow: isDark
                ? '0px 20px 60px rgba(0,0,0,0.6)'
                : '0px 20px 60px rgba(15,23,42,0.15)',
            }}
          >
            {/* Modal Icon */}
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 16,
            }}>
              <LogOut size={24} color="#EF4444" strokeWidth={2} />
            </View>

            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: C.text,
              textAlign: 'center',
              writingDirection: 'rtl',
              marginBottom: 8,
            }}>
              התנתקות
            </Text>

            <Text style={{
              fontSize: 15,
              color: C.textSecondary,
              textAlign: 'center',
              writingDirection: 'rtl',
              lineHeight: 22,
              marginBottom: 24,
            }}>
              האם אתה בטוח שברצונך להתנתק מהחשבון?
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => {
                  console.log('ProfileScreen: Cancel logout pressed');
                  setShowLogoutModal(false);
                }}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#334155' : '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: C.text,
                  writingDirection: 'rtl',
                  textAlign: 'center',
                }}>
                  ביטול
                </Text>
              </Pressable>

              <Pressable
                onPress={confirmLogout}
                disabled={isLoggingOut}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#EF4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    writingDirection: 'rtl',
                    textAlign: 'center',
                  }}>
                    התנתק
                  </Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
