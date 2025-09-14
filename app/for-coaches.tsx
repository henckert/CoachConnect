import { Screen } from "../components/Screen";
import { View, Text } from "react-native";

export default function ForCoaches() {
  return (
    <Screen title="For Coaches">
      <View className="bg-white rounded-xl p-4 shadow">
        <Text className="text-text">Coach dashboard placeholder (sessions, drills, bulletin composer).</Text>
      </View>
    </Screen>
  );
}
