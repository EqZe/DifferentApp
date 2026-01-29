
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="category/[name]" 
        options={{ 
          headerShown: true,
          headerBackTitle: 'חזרה',
          headerTitle: '',
        }} 
      />
    </Stack>
  );
}
