import { Redirect } from 'expo-router';
import { useSupabase } from '../context/SupabaseContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
    const { user, isLoading } = useSupabase();

    if (isLoading) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator color="#22c55e" size="large" />
            </View>
        );
    }

    if (!user) {
        return <Redirect href="/auth" />;
    }

    return <Redirect href="/(tabs)" />;
}
