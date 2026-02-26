import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Dumbbell, LayoutGrid, User, Utensils, Share2 } from 'lucide-react-native';
import { View, BackHandler } from 'react-native';
import { useSupabase } from '../../context/SupabaseContext';

export default function TabLayout() {
    const router = useRouter();
    const { user } = useSupabase();

    // Handle back button within tabs
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            // Get current route
            const currentRoute = router.getState()?.routes?.[router.getState()?.index];
            
            // If we're on the main tab screen, allow app to close
            if (currentRoute?.name === 'index') {
                return false; // Let default behavior handle it
            }
            
            // Otherwise, navigate to home tab
            router.replace('/(tabs)');
            return true; // Prevent default behavior
        });

        return () => backHandler.remove();
    }, [router]);

    // Redirect to auth if not authenticated
    useEffect(() => {
        if (!user) {
            router.replace('/auth');
        }
    }, [user, router]);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#22c55e',
                tabBarInactiveTintColor: '#71717a',
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#09090b',
                    borderTopWidth: 1,
                    borderTopColor: '#18181b',
                    height: 85,
                    paddingBottom: 25,
                    paddingTop: 10,
                },
                tabBarShowLabel: false,
                tabBarButton: (props) => (
                    <View {...props} style={props.style}>
                        {props.children}
                    </View>
                ),
                // Add safe area insets for tab bar
                tabBarBackground: () => (
                    <View className="absolute inset-0 bg-zinc-950" />
                ),
            }}
            // Prevent tab switching animation issues
            sceneContainerStyle={{
                backgroundColor: '#000',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className={`p-2 rounded-lg ${focused ? 'bg-green-500/20' : ''}`}>
                            <Dumbbell size={24} color={color} />
                        </View>
                    ),
                    href: '/(tabs)',
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className={`p-2 rounded-lg ${focused ? 'bg-green-500/20' : ''}`}>
                            <LayoutGrid size={24} color={color} />
                        </View>
                    ),
                    href: '/(tabs)/tasks',
                }}
            />
            <Tabs.Screen
                name="macros"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className={`p-2 rounded-lg ${focused ? 'bg-green-500/20' : ''}`}>
                            <Utensils size={24} color={color} />
                        </View>
                    ),
                    href: '/(tabs)/macros',
                }}
            />
            <Tabs.Screen
                name="hub"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className={`p-2 rounded-lg ${focused ? 'bg-green-500/20' : ''}`}>
                            <Share2 size={24} color={color} />
                        </View>
                    ),
                    href: '/(tabs)/hub',
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className={`p-2 rounded-lg ${focused ? 'bg-green-500/20' : ''}`}>
                            <User size={24} color={color} />
                        </View>
                    ),
                    href: '/(tabs)/settings',
                }}
            />
        </Tabs>
    );
}
