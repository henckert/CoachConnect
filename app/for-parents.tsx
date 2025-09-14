import { Screen } from "../components/Screen";
import { View, Text } from "react-native";

export default function ForParents() {
  return (
    <Screen title="For Parents">
      <View className="bg-white rounded-xl p-4 shadow">
        <Text className="text-text">Announcements, calendar sync, RSVP.</Text>
      </View>
    </Screen>
  );
}
