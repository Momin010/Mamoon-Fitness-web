import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Trash2, ChevronRight, Sun, Moon, Coffee, Utensils } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Meal } from '../../types';

export default function MealHistoryScreen() {
    const router = useRouter();
    const { allMeals, deleteMeal, user } = useApp();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const mealsByDate = useMemo(() => {
        const grouped = new Map<string, Meal[]>();
        allMeals.forEach(meal => {
            const date = new Date(meal.timestamp).toDateString();
            if (!grouped.has(date)) {
                grouped.set(date, []);
            }
            grouped.get(date)!.push(meal);
        });
        return grouped;
    }, [allMeals]);

    const selectedDateMeals = useMemo(() => {
        return mealsByDate.get(selectedDate.toDateString()) || [];
    }, [mealsByDate, selectedDate]);

    const selectedDateStats = useMemo(() => {
        return selectedDateMeals.reduce((acc, meal) => ({
            calories: acc.calories + meal.calories,
            protein: acc.protein + meal.protein,
            carbs: acc.carbs + meal.carbs,
            fats: acc.fats + meal.fats
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }, [selectedDateMeals]);

    const sortedDates = useMemo(() => {
        return Array.from(mealsByDate.keys()).sort((a, b) =>
            new Date(b).getTime() - new Date(a).getTime()
        );
    }, [mealsByDate]);

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const getMealTypeIcon = (type?: string) => {
        switch (type) {
            case 'breakfast': return <Sun size={20} color="#fbbf24" />;
            case 'lunch': return <Sun size={20} color="#f97316" />;
            case 'dinner': return <Moon size={20} color="#3b82f6" />;
            case 'snack': return <Coffee size={20} color="#a855f7" />;
            default: return <Utensils size={20} color="#22c55e" />;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-row items-center gap-4 p-6 border-b border-zinc-900">
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-2xl font-black uppercase tracking-tighter italic text-white">Meal History</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="p-6 border-b border-zinc-900">
                    <View className="flex-row items-center justify-between mb-8 bg-zinc-900 p-4 rounded-3xl border border-zinc-800">
                        <TouchableOpacity onPress={() => changeDate(-1)} className="p-2">
                            <ChevronLeft size={20} color="white" />
                        </TouchableOpacity>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-white font-black uppercase text-xs italic tracking-widest">{formatDate(selectedDate)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => changeDate(1)} className="p-2">
                            <ChevronRight size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row flex-wrap gap-3">
                        <View className="flex-1 min-w-[45%] p-4 bg-zinc-900 rounded-2xl items-center border border-zinc-800">
                            <Text className="text-2xl font-black text-white italic">{selectedDateStats.calories}</Text>
                            <Text className="text-[10px] text-zinc-500 font-black uppercase mt-1">Calories</Text>
                        </View>
                        <View className="flex-1 min-w-[45%] p-4 bg-zinc-900 rounded-2xl items-center border border-zinc-800">
                            <Text className="text-2xl font-black text-blue-400 italic">{selectedDateStats.protein}g</Text>
                            <Text className="text-[10px] text-zinc-500 font-black uppercase mt-1">Protein</Text>
                        </View>
                        <View className="flex-1 min-w-[45%] p-4 bg-zinc-900 rounded-2xl items-center border border-zinc-800">
                            <Text className="text-2xl font-black text-yellow-400 italic">{selectedDateStats.carbs}g</Text>
                            <Text className="text-[10px] text-zinc-500 font-black uppercase mt-1">Carbs</Text>
                        </View>
                        <View className="flex-1 min-w-[45%] p-4 bg-zinc-900 rounded-2xl items-center border border-zinc-800">
                            <Text className="text-2xl font-black text-red-400 italic">{selectedDateStats.fats}g</Text>
                            <Text className="text-[10px] text-zinc-500 font-black uppercase mt-1">Fats</Text>
                        </View>
                    </View>

                    <View className="mt-8 bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Inbound Energy Progress</Text>
                            <Text className={`font-black text-xs ${selectedDateStats.calories <= user.caloriesGoal ? 'text-green-500' : 'text-red-500'}`}>
                                {Math.round((selectedDateStats.calories / user.caloriesGoal) * 100)}%
                            </Text>
                        </View>
                        <View className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                            <View
                                className="h-full rounded-full"
                                style={{
                                    width: `${Math.min(100, (selectedDateStats.calories / user.caloriesGoal) * 100)}%`,
                                    backgroundColor: selectedDateStats.calories <= user.caloriesGoal ? '#22c55e' : '#ef4444'
                                }}
                            />
                        </View>
                    </View>
                </View>

                <View className="p-6">
                    {selectedDateMeals.length === 0 ? (
                        <View className="items-center py-20 opacity-30">
                            <Utensils size={48} color="#52525b" />
                            <Text className="text-zinc-500 font-black uppercase text-xs italic mt-4">No data for selected cycle</Text>
                        </View>
                    ) : (
                        <View className="space-y-4">
                            {selectedDateMeals
                                .sort((a, b) => b.timestamp - a.timestamp)
                                .map(meal => (
                                    <View key={meal.id} className="p-6 bg-zinc-900 rounded-[2rem] border border-zinc-800 mb-4">
                                        <View className="flex-row items-start justify-between">
                                            <View className="flex-row items-start gap-4">
                                                <View className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                                                    {getMealTypeIcon(meal.mealType)}
                                                </View>
                                                <View>
                                                    <Text className="text-white font-black uppercase italic tracking-tight">{meal.name}</Text>
                                                    <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                                                        {new Date(meal.timestamp).toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        })}
                                                        {meal.mealType && ` • ${meal.mealType}`}
                                                    </Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity onPress={() => deleteMeal(meal.id)} className="p-2">
                                                <Trash2 size={16} color="#3f3f46" />
                                            </TouchableOpacity>
                                        </View>
                                        <View className="mt-6 flex-row gap-6 border-t border-zinc-800/50 pt-4">
                                            <View>
                                                <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Calories</Text>
                                                <Text className="text-white font-black italic">{meal.calories}</Text>
                                            </View>
                                            <View>
                                                <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Protein</Text>
                                                <Text className="text-blue-500 font-black italic">{meal.protein}g</Text>
                                            </View>
                                            <View>
                                                <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Carbs</Text>
                                                <Text className="text-yellow-500 font-black italic">{meal.carbs}g</Text>
                                            </View>
                                            <View>
                                                <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Fats</Text>
                                                <Text className="text-red-500 font-black italic">{meal.fats}g</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                        </View>
                    )}
                </View>

                {sortedDates.length > 0 && (
                    <View className="p-6 border-t border-zinc-900 mb-12">
                        <Text className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 italic">Historical Cycles</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {sortedDates.slice(0, 14).map(dateStr => {
                                const date = new Date(dateStr);
                                const dayMeals = mealsByDate.get(dateStr) || [];
                                const dayCalories = dayMeals.reduce((sum, m) => sum + m.calories, 0);
                                const isSelected = dateStr === selectedDate.toDateString();

                                return (
                                    <TouchableOpacity
                                        key={dateStr}
                                        onPress={() => setSelectedDate(date)}
                                        className={`p-5 rounded-3xl items-center min-w-[85px] mr-3 border ${isSelected ? 'bg-white border-white' : 'bg-zinc-900 border-zinc-800'
                                            }`}
                                    >
                                        <Text className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-black' : 'text-zinc-500'}`}>
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </Text>
                                        <Text className={`text-2xl font-black italic mt-1 ${isSelected ? 'text-black' : 'text-white'}`}>
                                            {date.getDate()}
                                        </Text>
                                        <Text className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-black/60' : 'text-zinc-600'}`}>
                                            {dayCalories}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
