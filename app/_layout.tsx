import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SupabaseProvider } from '../context/SupabaseContext';
import { AppProvider } from '../context/AppContext';
import '../global.css';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <SupabaseProvider>
                <AppProvider>
                    <View className="flex-1 bg-black">
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                contentStyle: { backgroundColor: '#000' },
                                animation: 'fade_from_bottom'
                            }}
                        >
                            <Stack.Screen name="index" options={{ headerShown: false }} />
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="auth/index" options={{ headerShown: false }} />
                            <Stack.Screen name="history" options={{ headerShown: false }} />
                        </Stack>
                        <StatusBar style="light" />
                    </View>
                </AppProvider>
            </SupabaseProvider>
        </SafeAreaProvider>
    );
}
