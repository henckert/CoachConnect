import { Screen } from "../components/Screen";
import { View, Text } from "react-native";

export default function LocalGrassroots() {
  return (
    <Screen title="Local Grassroots">
      <View className="bg-white rounded-xl p-4 shadow">
        <Text className="text-text">Clubs near you, pitches, contacts.</Text>
      </View>
    </Screen>
  );
}
