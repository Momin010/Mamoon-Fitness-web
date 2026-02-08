import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, QrCode, Camera, Keyboard, AlertCircle } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

export default function AddMealScreen() {
    const router = useRouter();
    const { addMeal } = useApp();
    const [view, setView] = useState<'options' | 'manual'>('options');
    const [formData, setFormData] = useState({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        mealType: 'snack' as 'breakfast' | 'lunch' | 'dinner' | 'snack'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = (name: string, value: string): string => {
        switch (name) {
            case 'name':
                if (!value.trim()) return 'Required';
                if (value.trim().length < 2) return 'Too short';
                return '';
            case 'calories':
                if (!value) return 'Required';
                const cal = parseInt(value);
                if (isNaN(cal) || cal < 0) return 'Invalid';
                return '';
            default:
                return '';
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field as keyof typeof formData] as string) }));
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (touched[field]) {
            setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
        }
    };

    const handleSubmit = () => {
        setTouched({ name: true, calories: true, protein: true, carbs: true, fats: true });

        const nameErr = validateField('name', formData.name);
        const calErr = validateField('calories', formData.calories);

        if (nameErr || calErr) {
            setErrors({ name: nameErr, calories: calErr });
            return;
        }

        addMeal({
            name: formData.name.trim(),
            calories: parseInt(formData.calories),
            protein: parseInt(formData.protein) || 0,
            carbs: parseInt(formData.carbs) || 0,
            fats: parseInt(formData.fats) || 0,
            mealType: formData.mealType
        });
        router.back();
    };

    if (view === 'manual') {
        return (
            <SafeAreaView className="flex-1 bg-black">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <View className="flex-row items-center gap-4 p-6 border-b border-zinc-900">
                        <TouchableOpacity onPress={() => setView('options')} className="p-2 bg-zinc-900 rounded-full">
                            <ChevronLeft size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-black uppercase tracking-tighter italic text-white">Manual Entry</Text>
                    </View>

                    <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                        <View className="mb-8">
                            <Text className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4">Select Cycle</Text>
                            <View className="flex-row gap-2">
                                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setFormData(prev => ({ ...prev, mealType: type }))}
                                        className={`flex-1 py-4 rounded-2xl border ${formData.mealType === type
                                                ? 'bg-green-500 border-green-500'
                                                : 'bg-zinc-900 border-zinc-800'
                                            }`}
                                    >
                                        <Text className={`text-center font-black uppercase text-[9px] tracking-widest ${formData.mealType === type ? 'text-black' : 'text-zinc-500'
                                            }`}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View className="space-y-8">
                            <View>
                                <Text className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2 px-1">Mission Objective (Label)</Text>
                                <TextInput
                                    placeholder="e.g., HIGH PROTEIN FUEL"
                                    placeholderTextColor="#3b3b3b"
                                    className={`bg-zinc-900 border rounded-3xl px-6 py-5 text-lg font-black italic text-white ${errors.name && touched.name ? 'border-red-500' : 'border-zinc-800 focus:border-green-500'
                                        }`}
                                    value={formData.name}
                                    onChangeText={val => handleChange('name', val)}
                                    onBlur={() => handleBlur('name')}
                                />
                            </View>

                            <View>
                                <Text className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2 px-1">Gross Energy (KCAL)</Text>
                                <TextInput
                                    placeholder="0 KCAL"
                                    placeholderTextColor="#3b3b3b"
                                    keyboardType="numeric"
                                    className={`bg-zinc-900 border rounded-3xl px-6 py-5 text-lg font-black italic text-white ${errors.calories && touched.calories ? 'border-red-500' : 'border-zinc-800 focus:border-green-500'
                                        }`}
                                    value={formData.calories}
                                    onChangeText={val => handleChange('calories', val)}
                                    onBlur={() => handleBlur('calories')}
                                />
                            </View>

                            <View>
                                <Text className="text-zinc-700 font-black uppercase tracking-[0.5em] text-[10px] mb-4 text-center">Macro Breakdown</Text>
                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-[9px] font-black text-zinc-500 uppercase text-center mb-2">Protein (G)</Text>
                                        <TextInput
                                            placeholder="0"
                                            placeholderTextColor="#3b3b3b"
                                            keyboardType="numeric"
                                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center text-blue-500 font-black"
                                            value={formData.protein}
                                            onChangeText={val => handleChange('protein', val)}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[9px] font-black text-zinc-500 uppercase text-center mb-2">Carbs (G)</Text>
                                        <TextInput
                                            placeholder="0"
                                            placeholderTextColor="#3b3b3b"
                                            keyboardType="numeric"
                                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center text-yellow-500 font-black"
                                            value={formData.carbs}
                                            onChangeText={val => handleChange('carbs', val)}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[9px] font-black text-zinc-500 uppercase text-center mb-2">Fats (G)</Text>
                                        <TextInput
                                            placeholder="0"
                                            placeholderTextColor="#3b3b3b"
                                            keyboardType="numeric"
                                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center text-red-500 font-black"
                                            value={formData.fats}
                                            onChangeText={val => handleChange('fats', val)}
                                        />
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleSubmit}
                                className="bg-white py-6 rounded-3xl shadow-lg mt-8"
                            >
                                <Text className="text-black font-black uppercase tracking-[0.2em] text-center text-xs">Authorize Entry (+50 XP)</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="h-20" />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-row items-center gap-4 p-6 border-b border-zinc-900">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-2xl font-black uppercase tracking-tighter italic text-white">Log Intake</Text>
            </View>

            <View className="p-8 space-y-6 flex-1 justify-center">
                <TouchableOpacity
                    onPress={() => setView('manual')}
                    className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem]"
                >
                    <View className="flex-row items-center gap-6">
                        <View className="p-4 bg-green-500/20 rounded-2xl border border-green-500/20">
                            <Keyboard size={32} color="#22c55e" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-black uppercase italic text-xl">Tactical Input</Text>
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Manual nutrition entry</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    disabled
                    className="bg-zinc-900/40 border border-zinc-900 p-8 rounded-[2.5rem] opacity-40"
                >
                    <View className="flex-row items-center gap-6">
                        <View className="p-4 bg-zinc-800 rounded-2xl">
                            <Camera size={32} color="#52525b" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-zinc-600 font-black uppercase italic text-xl">Visual Recon</Text>
                            <Text className="text-zinc-800 text-[10px] font-bold uppercase tracking-widest mt-1">Coming via update</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    disabled
                    className="bg-zinc-900/40 border border-zinc-900 p-8 rounded-[2.5rem] opacity-40"
                >
                    <View className="flex-row items-center gap-6">
                        <View className="p-4 bg-zinc-800 rounded-2xl">
                            <QrCode size={32} color="#52525b" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-zinc-600 font-black uppercase italic text-xl">Code Scanner</Text>
                            <Text className="text-zinc-800 text-[10px] font-bold uppercase tracking-widest mt-1">Coming via update</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            <View className="items-center pb-12 opacity-30">
                <Text className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em] italic">Forge Protocol 1.0.4</Text>
            </View>
        </SafeAreaView>
    );
}
