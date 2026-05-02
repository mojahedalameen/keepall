import { useAuth, useUser } from "@clerk/expo";
import { useGetDashboardStats, useGetProfile } from "../../lib/api-client";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/contexts/LanguageContext";

const STAT_META = [
  { key: "totalSubjects" as const, labelKey: "subjects" as const, icon: "book-open" as const, bg: "#EDE9FE", color: "#7C3AED", gradFrom: "#8B5CF6", gradTo: "#7C3AED" },
  { key: "totalNotes" as const, labelKey: "notes" as const, icon: "file-text" as const, bg: "#DCFCE7", color: "#059669", gradFrom: "#10B981", gradTo: "#059669" },
  { key: "totalTasks" as const, labelKey: "tasks" as const, icon: "check-square" as const, bg: "#FEF9C3", color: "#B45309", gradFrom: "#F59E0B", gradTo: "#B45309" },
  { key: "totalFiles" as const, labelKey: "filesLabel" as const, icon: "paperclip" as const, bg: "#DBEAFE", color: "#2563EB", gradFrom: "#60A5FA", gradTo: "#2563EB" },
];

function SkeletonStatCard({ bg }: { bg: string }) {
  const anim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0.5, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, [anim]);
  return (
    <Animated.View style={[skSt.card, { backgroundColor: bg, opacity: anim }]}>
      <View style={[skSt.iconBox, { backgroundColor: "rgba(0,0,0,0.08)" }]} />
      <View style={[skSt.valueLine, { backgroundColor: "rgba(0,0,0,0.12)" }]} />
      <View style={[skSt.labelLine, { backgroundColor: "rgba(0,0,0,0.07)" }]} />
    </Animated.View>
  );
}
const skSt = StyleSheet.create({
  card: { width: "47%", borderRadius: 22, padding: 20, height: 110, gap: 8 },
  iconBox: { width: 36, height: 36, borderRadius: 10 },
  valueLine: { height: 24, borderRadius: 8, width: "55%" },
  labelLine: { height: 12, borderRadius: 6, width: "75%" },
});

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const lang = useLanguage();

  const { data: profile, refetch: refetchProfile } = useGetProfile();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetDashboardStats();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchStats()]);
    setRefreshing(false);
  };

  const displayName =
    profile?.displayName ||
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "Student";
  const email =
    user?.emailAddresses?.[0]?.emailAddress ||
    profile?.email ||
    "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const onSignOut = () => {
    Alert.alert(lang.t("signOutLabel"), lang.t("signOutConfirm"), [
      { text: lang.t("cancelLabel"), style: "cancel" },
      {
        text: lang.t("signOutLabel"),
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/sign-in");
        },
      },
    ]);
  };

  const onLanguageChange = async (l: "en" | "ar") => {
    if (l === lang.language) return;
    await lang.setLanguage(l);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + (isWeb ? 34 : 0) + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <LinearGradient
          colors={["#6D28D9", "#7C3AED"]}
          style={[styles.headerGradient, { paddingTop: insets.top + (isWeb ? 67 : 0) + 32 }]}
        >
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { fontFamily: lang.fontB }]}>{initials}</Text>
          </View>
          <Text style={[styles.displayName, { fontFamily: lang.fontB }]}>{displayName}</Text>
          {!!email && (
            <View style={styles.emailRow}>
              <Feather name="mail" size={13} color="rgba(255,255,255,0.75)" />
              <Text style={[styles.emailText, { fontFamily: lang.fontR }]}>{email}</Text>
            </View>
          )}
          {profile?.createdAt && (
            <View style={styles.memberBadge}>
              <Feather name="calendar" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={[styles.memberText, { fontFamily: lang.fontM }]}>
                {lang.t("memberSince")}{" "}
                {new Date(profile.createdAt).toLocaleDateString(lang.isArabic ? "ar-SA" : "en-US", { month: "long", year: "numeric" })}
              </Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.body}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: lang.fontB }]}>
            {lang.t("yourProgress")}
          </Text>

          <View style={styles.statsGrid}>
            {statsLoading
              ? STAT_META.map((cfg) => <SkeletonStatCard key={cfg.key} bg={cfg.bg} />)
              : STAT_META.map((cfg) => (
                  <View key={cfg.key} style={[styles.statCard, { backgroundColor: cfg.bg }]}>
                    <View style={[styles.statIconBox, { backgroundColor: cfg.color + "20" }]}>
                      <Feather name={cfg.icon} size={20} color={cfg.color} />
                    </View>
                    <Text style={[styles.statValue, { color: cfg.color, fontFamily: lang.fontB }]}>
                      {(stats as any)?.[cfg.key] ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: cfg.color, fontFamily: lang.fontSB, opacity: 0.8 }]}>
                      {lang.t(cfg.labelKey)}
                    </Text>
                  </View>
                ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: lang.fontB }]}>
            {lang.t("languageLabel")}
          </Text>

          <View style={[styles.langCard, { backgroundColor: colors.card }]}>
            <Pressable
              style={[styles.langBtn, lang.language === "en" && { backgroundColor: colors.primary }]}
              onPress={() => onLanguageChange("en")}
            >
              <Text style={styles.langFlag}>🇺🇸</Text>
              <Text style={[styles.langText, { fontFamily: "Inter_600SemiBold", color: lang.language === "en" ? "#fff" : colors.mutedForeground }]}>
                {lang.t("englishOption")}
              </Text>
              {lang.language === "en" && <Feather name="check" size={14} color="#fff" />}
            </Pressable>
            <Pressable
              style={[styles.langBtn, lang.language === "ar" && { backgroundColor: colors.primary }]}
              onPress={() => onLanguageChange("ar")}
            >
              <Text style={styles.langFlag}>🇸🇦</Text>
              <Text style={[styles.langText, { fontFamily: "IBMPlexSansArabic_600SemiBold", color: lang.language === "ar" ? "#fff" : colors.mutedForeground }]}>
                {lang.t("arabicOption")}
              </Text>
              {lang.language === "ar" && <Feather name="check" size={14} color="#fff" />}
            </Pressable>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: lang.fontB }]}>
            {lang.t("accountSection")}
          </Text>

          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            <Pressable style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]} onPress={onSignOut}>
              <View style={[styles.menuIconBox, { backgroundColor: "#FEE2E2" }]}>
                <Feather name="log-out" size={18} color="#DC2626" />
              </View>
              <Text style={[styles.menuText, { color: "#DC2626", fontFamily: lang.fontSB }]}>
                {lang.t("signOutLabel")}
              </Text>
              <Feather name="chevron-right" size={16} color="#DC2626" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 44, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: "rgba(255,255,255,0.28)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 3, borderColor: "rgba(255,255,255,0.5)" },
  avatarText: { color: "#fff", fontSize: 36 },
  displayName: { color: "#fff", fontSize: 24, marginBottom: 6 },
  emailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  emailText: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  memberBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
  memberText: { color: "rgba(255,255,255,0.9)", fontSize: 12 },
  body: { paddingHorizontal: 20, paddingTop: 28 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14, marginTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  statCard: { width: "47%", borderRadius: 22, padding: 18, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 28 },
  statLabel: { fontSize: 12 },
  langCard: { flexDirection: "row", borderRadius: 22, padding: 6, gap: 6, marginBottom: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  langBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 18, gap: 6 },
  langFlag: { fontSize: 18 },
  langText: { fontSize: 14 },
  menuCard: { borderRadius: 22, overflow: "hidden", marginBottom: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 18, gap: 14 },
  menuIconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  menuText: { flex: 1, fontSize: 15 },
});
