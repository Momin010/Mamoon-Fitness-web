import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Dumbbell, Mail, Lock, User, AlertCircle, Loader2, ChevronRight } from 'lucide-react-native';
import { useSupabase } from '../context/SupabaseContext';
import { ForgeButton } from '../components/ForgeButton';

export default function AuthScreen() {
    const router = useRouter();
    const { signIn, signUp, isConfigured } = useSupabase();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    if (!isConfigured) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center p-8">
                <View className="w-24 h-24 bg-zinc-900 rounded-[2rem] items-center justify-center mb-10">
                    <Dumbbell size={40} color="#3f3f46" />
                </View>
                <Text className="text-2xl font-black uppercase text-white tracking-tighter italic text-center">System Offline</Text>
                <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest text-center mt-4 leading-relaxed bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                    Supabase credentials not detected in architecture. Initialize cloud protocols to proceed.
                </Text>
            </SafeAreaView>
        );
    }

    const handleSubmit = async () => {
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message || 'Access Denied');
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                const { error } = await signUp(email, password, name);
                if (error) {
                    setError(error.message || 'Registration Failed');
                } else {
                    setMessage('Verification frequency established. Check email.');
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-8">
                    <View className="flex-1 justify-center">
                        <View className="items-center mb-12">
                            <View className="w-24 h-24 bg-green-500/10 rounded-[2.5rem] items-center justify-center border border-green-500/20">
                                <Dumbbell size={44} color="#22c55e" />
                            </View>
                            <Text className="text-4xl font-black uppercase italic tracking-tighter text-white mt-8 leading-none">
                                {isLogin ? 'Forge\n' : 'Initial\n'}<Text className="text-green-500">{isLogin ? 'Access' : 'Sync'}</Text>
                            </Text>
                            <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4 italic">
                                {isLogin ? 'Authorize tactical credentials' : 'Deploy new agent profile'}
                            </Text>
                        </View>

                        {error ? (
                            <View className="bg-red-500/5 border border-red-500/20 p-5 rounded-3xl flex-row items-center gap-4 mb-8">
                                <AlertCircle size={20} color="#ef4444" />
                                <Text className="flex-1 text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</Text>
                            </View>
                        ) : null}

                        {message ? (
                            <View className="bg-green-500/5 border border-green-500/20 p-5 rounded-3xl mb-8">
                                <Text className="text-green-500 text-[10px] font-black uppercase tracking-widest text-center">{message}</Text>
                            </View>
                        ) : null}

                        <View className="space-y-6">
                            {!isLogin && (
                                <View>
                                    <Text className="text-zinc-600 font-black uppercase text-[9px] tracking-[0.3em] ml-4 mb-2">Agent ID / Name</Text>
                                    <View className="relative">
                                        <View className="absolute left-6 top-[18px] z-10">
                                            <User size={18} color="#3f3f46" />
                                        </View>
                                        <TextInput
                                            value={name}
                                            onChangeText={setName}
                                            placeholder="OPERATIVE NAME"
                                            placeholderTextColor="#27272a"
                                            className="bg-zinc-900 border border-zinc-900 focus:border-green-500/50 rounded-[2rem] py-5 pl-14 pr-6 text-white font-black italic shadow-inner"
                                        />
                                    </View>
                                </View>
                            )}

                            <View>
                                <Text className="text-zinc-600 font-black uppercase text-[9px] tracking-[0.3em] ml-4 mb-2">Comms Frequency (Email)</Text>
                                <View className="relative">
                                    <View className="absolute left-6 top-[18px] z-10">
                                        <Mail size={18} color="#3f3f46" />
                                    </View>
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        placeholder="AGENT@FORGE.COM"
                                        placeholderTextColor="#27272a"
                                        className="bg-zinc-900 border border-zinc-900 focus:border-green-500/50 rounded-[2rem] py-5 pl-14 pr-6 text-white font-black italic shadow-inner"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-zinc-600 font-black uppercase text-[9px] tracking-[0.3em] ml-4 mb-2">Cryptographic Key (Password)</Text>
                                <View className="relative">
                                    <View className="absolute left-6 top-[18px] z-10">
                                        <Lock size={18} color="#3f3f46" />
                                    </View>
                                    <TextInput
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        placeholder="••••••••"
                                        placeholderTextColor="#27272a"
                                        className="bg-zinc-900 border border-zinc-900 focus:border-green-500/50 rounded-[2rem] py-5 pl-14 pr-6 text-white font-black italic shadow-inner"
                                    />
                                </View>
                            </View>

                            <View className="mt-8 pt-4">
                                <ForgeButton
                                    variant="primary"
                                    onPress={handleSubmit}
                                    isLoading={isLoading}
                                    uppercase
                                >
                                    {isLogin ? 'Grant Access' : 'Establish Profile'}
                                </ForgeButton>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                    setMessage('');
                                }}
                                className="items-center py-4"
                            >
                                <Text className="text-zinc-600 font-black uppercase text-[9px] tracking-[0.2em]">
                                    {isLogin ? "Generate New Frequency?" : "Existing operative? Login"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
