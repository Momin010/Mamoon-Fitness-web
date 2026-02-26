import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useCallback } from 'react';
import { SupabaseProvider, useSupabase } from '../context/SupabaseContext';
import { AppProvider } from '../context/AppContext';
import '../global.css';

function NavigationHandler() {
    const router = useRouter();
    const segments = useSegments();
    const { user, isLoading } = useSupabase();

    // Handle back button navigation
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            // Prevent back navigation on auth screens
            if (segments[0] === 'auth') {
                return true; // Prevent default back behavior
            }
            
            // Handle back navigation for tabs
            if (segments[0] === '(tabs)') {
                const currentTab = segments[1];
                if (currentTab && currentTab !== 'index') {
                    // Navigate to home tab instead of exiting app
                    router.replace('/(tabs)');
                    return true;
                }
            }
            
            return false; // Let default back behavior handle it
        });

        return () => backHandler.remove();
    }, [segments, router]);

    // Handle authentication redirects
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'auth';
        const inTabsGroup = segments[0] === '(tabs)';
        
        if (!user && !inAuthGroup) {
            // Redirect to auth if not authenticated
            router.replace('/auth');
        } else if (user && inAuthGroup) {
            // Redirect to main app if authenticated
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading, router]);

    return null;
}

function RootLayoutContent() {
    return (
        <View className="flex-1 bg-black">
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#000' },
                    animation: 'fade_from_bottom',
                    gestureEnabled: true,
                    animationDuration: 300
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{
                        headerShown: false,
                        gestureEnabled: false // Disable gestures on splash screen
                    }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                        gestureEnabled: true
                    }}
                />
                <Stack.Screen
                    name="auth/index"
                    options={{
                        headerShown: false,
                        gestureEnabled: false // Disable gestures on auth screens
                    }}
                />
                <Stack.Screen
                    name="history"
                    options={{
                        headerShown: false,
                        gestureEnabled: true,
                        presentation: 'modal' // Modal presentation for history
                    }}
                />
            </Stack>
            <StatusBar style="light" />
            <NavigationHandler />
        </View>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <SupabaseProvider>
                <AppProvider>
                    <RootLayoutContent />
                </AppProvider>
            </SupabaseProvider>
        </SafeAreaProvider>
    );
}
