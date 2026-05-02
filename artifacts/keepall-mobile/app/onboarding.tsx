import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/contexts/LanguageContext";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    titleKey: "onboarding1Title" as const,
    subKey: "onboarding1Sub" as const,
    gradient: ["#7C3AED", "#9333EA"] as [string, string],
    bg: "#EDE9FE",
    icon: "📚",
    circles: ["#C4B5FD", "#A78BFA", "#8B5CF6"],
  },
  {
    titleKey: "onboarding2Title" as const,
    subKey: "onboarding2Sub" as const,
    gradient: ["#059669", "#10B981"] as [string, string],
    bg: "#DCFCE7",
    icon: "✅",
    circles: ["#6EE7B7", "#34D399", "#10B981"],
  },
  {
    titleKey: "onboarding3Title" as const,
    subKey: "onboarding3Sub" as const,
    gradient: ["#2563EB", "#3B82F6"] as [string, string],
    bg: "#DBEAFE",
    icon: "🔍",
    circles: ["#BFDBFE", "#93C5FD", "#60A5FA"],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const finish = async () => {
    await AsyncStorage.setItem("@keepall/onboarding_seen", "true");
    router.replace("/sign-in");
  };

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      finish();
    }
  };

  const skip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    finish();
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <LinearGradient colors={item.gradient} style={[styles.illustration, { paddingTop: insets.top + 60 }]}>
              <View style={styles.circleContainer}>
                <View style={[styles.circle1, { backgroundColor: item.circles[0] + "60" }]} />
                <View style={[styles.circle2, { backgroundColor: item.circles[1] + "40" }]} />
                <View style={[styles.circle3, { backgroundColor: item.circles[2] + "30" }]} />
              </View>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
            </LinearGradient>

            <View style={[styles.textCard, { backgroundColor: item.bg }]}>
              <Text style={[styles.title, { fontFamily: lang.fontB }]}>
                {lang.t(item.titleKey)}
              </Text>
              <Text style={[styles.sub, { fontFamily: lang.fontR }]}>
                {lang.t(item.subKey)}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => listRef.current?.scrollToIndex({ index: i })}
              style={[
                styles.dot,
                {
                  width: i === activeIndex ? 24 : 8,
                  backgroundColor: i === activeIndex ? SLIDES[activeIndex].gradient[0] : "#D1D5DB",
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.btnRow}>
          {!isLast && (
            <Pressable style={styles.skipBtn} onPress={skip}>
              <Text style={[styles.skipText, { fontFamily: lang.fontM, color: "#9CA3AF" }]}>
                {lang.t("onboardingSkip")}
              </Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.nextBtn,
              { backgroundColor: SLIDES[activeIndex].gradient[0], opacity: pressed ? 0.9 : 1 },
              isLast && styles.fullBtn,
            ]}
            onPress={next}
          >
            <Text style={[styles.nextText, { fontFamily: lang.fontB }]}>
              {isLast ? lang.t("onboardingGetStarted") : lang.t("onboardingNext")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  slide: { flex: 1 },
  illustration: {
    height: 380,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  circleContainer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  circle1: { position: "absolute", width: 320, height: 320, borderRadius: 160 },
  circle2: { position: "absolute", width: 220, height: 220, borderRadius: 110 },
  circle3: { position: "absolute", width: 140, height: 140, borderRadius: 70 },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  iconText: { fontSize: 56 },
  textCard: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 16,
  },
  title: { fontSize: 28, color: "#1A1035", marginBottom: 14, lineHeight: 36 },
  sub: { fontSize: 16, color: "#6B7280", lineHeight: 26 },
  bottom: {
    backgroundColor: "#fff",
    paddingHorizontal: 28,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F3F4F6",
  },
  dotsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 },
  dot: { height: 8, borderRadius: 4 },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  skipBtn: { paddingVertical: 16, paddingHorizontal: 12 },
  skipText: { fontSize: 15 },
  nextBtn: {
    flex: 1,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
  },
  fullBtn: { flex: 1 },
  nextText: { color: "#fff", fontSize: 16 },
});
