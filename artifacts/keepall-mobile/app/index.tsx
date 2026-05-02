import { useAuth } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const colors = useColors();
  const [checking, setChecking] = useState(true);
  const [onboardingSeen, setOnboardingSeen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@keepall/onboarding_seen")
      .then((val) => {
        setOnboardingSeen(val === "true");
      })
      .finally(() => setChecking(false));
  }, []);

  if (!isLoaded || checking) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isSignedIn) return <Redirect href="/(tabs)" />;
  if (!onboardingSeen) return <Redirect href="/onboarding" />;
  return <Redirect href="/sign-in" />;
}
