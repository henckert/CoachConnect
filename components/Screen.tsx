import { ReactNode } from "react";
import { SafeAreaView, View, Text } from "react-native";

export function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="px-4 py-3">
        <Text className="text-2xl font-bold text-text">{title}</Text>
      </View>
      <View className="flex-1 px-4 pb-4">{children}</View>
    </SafeAreaView>
  );
}
