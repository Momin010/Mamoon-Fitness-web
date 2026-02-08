import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { ForgeButton } from '../../components/ForgeButton';

export default function AuthPage() {
    const { signIn, signUp } = useSupabase();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async () => {
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn(email.trim(), password);
                if (error) {
                    setError(error.message || 'Failed to sign in');
                }
            } else {
                const { error } = await signUp(email.trim(), password, name);
                if (error) {
                    setError(error.message || 'Failed to sign up');
                } else {
                    setMessage('Check your email to confirm your account!');
                }
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-black"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
                <View className="flex-1 items-center justify-center py-10">
                    <View className="w-24 h-24 bg-green-500/10 rounded-full items-center justify-center mb-8">
                        <Text style={{ fontSize: 40 }}>⚙️</Text>
                    </View>

                    <Text className="text-3xl font-black uppercase text-white tracking-tighter mb-2">
                        {isLogin ? 'Welcome Back' : 'Get Started'}
                    </Text>
                    <Text className="text-zinc-400 mb-8 text-center px-4">
                        {isLogin ? 'Sign in to sync your progress' : 'Create an account to start tracking'}
                    </Text>

                    {error && (
                        <View className="w-full mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex-row items-center gap-3">
                            <Text className="text-red-400 text-sm flex-1">⚠️ {error}</Text>
                        </View>
                    )}

                    {message && (
                        <View className="w-full mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <Text className="text-green-400 text-sm">{message}</Text>
                        </View>
                    )}

                    <View className="w-full space-y-4">
                        {!isLogin && (
                            <View>
                                <Text className="text-zinc-400 text-sm mb-2 ml-1 font-bold uppercase tracking-widest">Name</Text>
                                <View className="relative">
                                    <TextInput
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white font-bold"
                                        placeholder="Your name"
                                        placeholderTextColor="#3f3f46"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>
                        )}

                        <View>
                            <Text className="text-zinc-400 text-sm mb-2 ml-1 font-bold uppercase tracking-widest">Email</Text>
                            <View className="relative">
                                <TextInput
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white font-bold"
                                    placeholder="you@example.com"
                                    placeholderTextColor="#3f3f46"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-zinc-400 text-sm mb-2 ml-1 font-bold uppercase tracking-widest">Password</Text>
                            <View className="relative">
                                <TextInput
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white font-bold"
                                    placeholder="••••••••"
                                    placeholderTextColor="#3f3f46"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>
                        </View>

                        <View className="pt-4">
                            <ForgeButton
                                fullWidth
                                onPress={handleSubmit}
                                isLoading={isLoading}
                            >
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </ForgeButton>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setMessage('');
                        }}
                        className="mt-6"
                    >
                        <Text className="text-zinc-400 font-bold uppercase tracking-widest text-xs">
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
