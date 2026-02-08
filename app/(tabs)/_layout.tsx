import React from 'react';
import { Tabs } from 'expo-router';
import { Dumbbell, LayoutGrid, User, Utensils, Share2 } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabLayout() {
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
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color }) => <Dumbbell size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="macros"
                options={{
                    tabBarIcon: ({ color }) => <Utensils size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="hub"
                options={{
                    tabBarIcon: ({ color }) => <Share2 size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
