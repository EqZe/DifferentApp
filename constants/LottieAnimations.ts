
/**
 * Centralized Lottie Animation Configuration
 * 
 * This file defines all Lottie animations used in the app to prevent confusion
 * and ensure consistency. Each animation has a specific purpose and fallback.
 */

export interface LottieConfig {
  uri: string;
  purpose: string;
  fallbackColor?: string;
}

/**
 * All Lottie animations used in the app
 * DO NOT modify these URLs without updating all references
 */
export const LOTTIE_ANIMATIONS = {
  // Loading animation - Used across all screens for data loading states
  LOADING: {
    uri: 'https://lottie.host/6f61ecb2-edc0-4962-9779-c5cb64c8799e/LgBcgiSDs0.json',
    purpose: 'Global loading indicator for all screens',
    fallbackColor: '#2784F5',
  } as LottieConfig,

  // Profile header animation - Used only on profile screen
  PROFILE_HEADER: {
    uri: 'https://lottie.host/200cc226-843c-464f-a346-c8faad8e7407/8Y1UmkMrvF.json',
    purpose: 'Profile screen header decoration',
    fallbackColor: '#2784F5',
  } as LottieConfig,

  // Home header animation - Used only on home screen
  HOME_HEADER: {
    uri: 'https://lottie.host/fcc59560-b2cd-4dad-85d1-02d5cf35c039/OcOTugphwV.json',
    purpose: 'Home screen header background',
    fallbackColor: '#2784F5',
  } as LottieConfig,
} as const;

/**
 * Validate that a Lottie URI is from our approved list
 * This prevents accidental use of wrong animations
 */
export function isValidLottieUri(uri: string): boolean {
  const validUris = Object.values(LOTTIE_ANIMATIONS).map(config => config.uri);
  return validUris.includes(uri);
}

/**
 * Get Lottie config by purpose
 * This ensures the right animation is used for the right purpose
 */
export function getLottieByPurpose(purpose: 'loading' | 'profile' | 'home'): LottieConfig {
  switch (purpose) {
    case 'loading':
      return LOTTIE_ANIMATIONS.LOADING;
    case 'profile':
      return LOTTIE_ANIMATIONS.PROFILE_HEADER;
    case 'home':
      return LOTTIE_ANIMATIONS.HOME_HEADER;
    default:
      console.warn(`Unknown Lottie purpose: ${purpose}, falling back to loading animation`);
      return LOTTIE_ANIMATIONS.LOADING;
  }
}
