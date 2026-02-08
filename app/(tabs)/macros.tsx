import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, History, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

export default function MacrosScreen() {
    const router = useRouter();
    const { user, meals, totalCalories, totalProtein, totalCarbs, totalFats } = useApp();

    const remaining = user.caloriesGoal - totalCalories;
    const isOverCalories = remaining < 0;

    const getProgressColor = (current: number, goal: number) => {
        const ratio = current / goal;
        if (ratio < 0.5) return '#52525b';
        if (ratio < 0.8) return '#eab308';
        if (ratio <= 1) return '#22c55e';
        return '#f87171';
    };

    const getStatus = () => {
        if (isOverCalories) return { text: 'Over Budget', color: 'text-red-400', icon: TrendingUp };
        if (remaining < 300) return { text: 'Almost There', color: 'text-yellow-400', icon: TrendingUp };
        if (remaining > 800) return { text: 'On Track', color: 'text-green-500', icon: Minus };
        return { text: 'Good Progress', color: 'text-green-400', icon: TrendingDown };
    };

    const status = getStatus();
    const StatusIcon = status.icon;

    const macroData = [
        { name: 'Protein', current: totalProtein, goal: user.proteinGoal, unit: 'g', color: '#3b82f6', bgClass: 'bg-blue-500' },
        { name: 'Carbs', current: totalCarbs, goal: user.carbsGoal, unit: 'g', color: '#eab308', bgClass: 'bg-yellow-500' },
        { name: 'Fats', current: totalFats, goal: user.fatsGoal, unit: 'g', color: '#ef4444', bgClass: 'bg-red-500' },
    ];

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between items-center mb-12">
                    <TouchableOpacity
                        onPress={() => router.push('/macros/history')}
                        className="p-3 bg-zinc-900 rounded-full"
                    >
                        <History size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="text-zinc-500 uppercase text-xs font-bold tracking-[0.2em]">{today}</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/settings')}
                        className="p-3 bg-zinc-900 rounded-full"
                    >
                        <Calendar size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="items-center mb-12">
                    <Text className={`text-8xl font-black tracking-tighter leading-none mb-2 text-white ${isOverCalories ? 'text-red-500' : ''}`}>
                        {Math.abs(remaining).toLocaleString()}
                    </Text>
                    <Text className="text-zinc-500 uppercase text-xs font-bold tracking-[0.2em] mb-6 text-center">
                        {isOverCalories ? 'Calories Over' : 'Calories Remaining'}
                    </Text>
                    <View className="flex-row items-center justify-center gap-2">
                        <View className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-')}`} />
                        <View className="flex-row items-center gap-1">
                            <StatusIcon size={12} color={getProgressColor(totalCalories, user.caloriesGoal)} />
                            <Text className={`font-black text-xs uppercase tracking-widest ${status.color}`}>
                                {status.text}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="mb-10">
                    <View className="flex-row justify-between items-center mb-3 text-white">
                        <Text className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Daily Progress</Text>
                        <Text className="text-sm font-black">
                            <Text style={{ color: getProgressColor(totalCalories, user.caloriesGoal) }}>{totalCalories}</Text>
                            <Text className="text-zinc-500"> / {user.caloriesGoal}</Text>
                        </Text>
                    </View>
                    <View className="h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <View
                            className="h-full rounded-full"
                            style={{
                                width: `${Math.min(100, (totalCalories / user.caloriesGoal) * 100)}%`,
                                backgroundColor: getProgressColor(totalCalories, user.caloriesGoal)
                            }}
                        />
                    </View>
                </View>

                <View className="space-y-8 mb-12">
                    {macroData.map((macro) => {
                        const progress = Math.min(100, (macro.current / macro.goal) * 100);
                        const isOver = macro.current > macro.goal;

                        return (
                            <View key={macro.name} className="mb-6">
                                <View className="flex-row justify-between items-end mb-2">
                                    <View className="flex-row items-center gap-2">
                                        <View className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                                        <Text className="text-xl font-black text-white uppercase italic tracking-tighter">{macro.name}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className={`text-2xl font-black ${isOver ? 'text-red-400' : 'text-white'}`}>
                                            {macro.current}
                                            <Text className="text-zinc-500 text-sm font-bold"> / {macro.goal}{macro.unit}</Text>
                                        </Text>
                                    </View>
                                </View>
                                <View className="h-2.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <View
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${progress}%`,
                                            backgroundColor: isOver ? '#ef4444' : macro.color
                                        }}
                                    />
                                </View>
                            </View>
                        );
                    })}
                </View>

                {meals.length > 0 && (
                    <View className="mb-8">
                        <Text className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-4 italic">Operational Intake</Text>
                        <View className="space-y-3">
                            {meals.slice(0, 5).map((meal) => (
                                <View key={meal.id} className="flex-row justify-between items-center p-4 bg-zinc-900 rounded-2xl border border-zinc-800 mb-3">
                                    <View>
                                        <Text className="font-black text-white uppercase tracking-tight text-sm">{meal.name}</Text>
                                        {meal.mealType && (
                                            <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{meal.mealType}</Text>
                                        )}
                                    </View>
                                    <Text className="text-sm font-black text-green-500 italic">{meal.calories} CAL</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View className="space-y-4 pb-20">
                    <TouchableOpacity
                        onPress={() => router.push('/macros/add')}
                        className="w-full bg-white py-6 rounded-3xl flex-row items-center justify-center gap-3 shadow-lg"
                    >
                        <Plus size={24} color="black" />
                        <Text className="text-black font-black uppercase tracking-[0.2em] text-xs text-center">Register Sustenance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/macros/history')}
                        className="w-full bg-zinc-900 py-5 rounded-3xl border border-zinc-800 flex-row items-center justify-center gap-2"
                    >
                        <History size={18} color="#71717a" />
                        <Text className="text-zinc-500 font-black uppercase tracking-[0.1em] text-[10px] text-center">Ingestion Logs</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
