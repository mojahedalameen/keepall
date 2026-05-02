import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/contexts/LanguageContext";

function NativeTabLayout() {
  const lang = useLanguage();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>{lang.t("home")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="semesters">
        <Icon sf={{ default: "books.vertical", selected: "books.vertical.fill" }} />
        <Label>{lang.t("semesters")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tasks">
        <Icon sf={{ default: "checklist", selected: "checklist" }} />
        <Label>{lang.t("tasks")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon sf={{ default: "magnifyingglass", selected: "magnifyingglass" }} />
        <Label>{lang.t("search")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>{lang.t("profile")}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

type TabIconProps = {
  name: React.ComponentProps<typeof Feather>["name"];
  sfName?: string;
  sfFocused?: string;
  color: string;
  focused: boolean;
  primaryColor: string;
};

function TabIcon({ name, sfName, sfFocused, color, focused, primaryColor }: TabIconProps) {
  const isIOS = Platform.OS === "ios";
  return (
    <View style={[tabIconStyles.wrap, focused && { backgroundColor: primaryColor + "18" }]}>
      {isIOS && sfName ? (
        <SymbolView name={(focused && sfFocused ? sfFocused : sfName) as any} tintColor={color} size={22} />
      ) : (
        <Feather name={name} size={22} color={color} />
      )}
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrap: {
    width: 52,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginBottom: 2,
  },
});

function ClassicTabLayout() {
  const colors = useColors();
  const lang = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 0,
          elevation: 0,
          height: isWeb ? 84 : 70,
          paddingBottom: isWeb ? 8 : 10,
          paddingTop: 6,
          shadowColor: "#7C3AED",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: lang.fontSB,
          marginTop: 0,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint={isDark ? "dark" : "extraLight"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: lang.t("home"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" sfName="house" sfFocused="house.fill" color={color} focused={focused} primaryColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="semesters"
        options={{
          title: lang.t("semesters"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="book-open" sfName="books.vertical" sfFocused="books.vertical.fill" color={color} focused={focused} primaryColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: lang.t("tasks"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="check-square" sfName="checklist" color={color} focused={focused} primaryColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: lang.t("search"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="search" sfName="magnifyingglass" color={color} focused={focused} primaryColor={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: lang.t("profile"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" sfName="person.circle" sfFocused="person.circle.fill" color={color} focused={focused} primaryColor={colors.primary} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
