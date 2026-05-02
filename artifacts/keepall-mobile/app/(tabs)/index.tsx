import { useUser } from "@clerk/expo";
import {
  useGetDashboardRecentNotes,
  useGetDashboardStats,
  useGetDashboardUpcoming,
} from "../../lib/api-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/contexts/LanguageContext";

// ── Shimmer hook ────────────────────────────────────────────────────────────
function useShimmer() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0.4, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, [anim]);
  return anim;
}

// ── Skeleton pill ────────────────────────────────────────────────────────────
function SkeletonPill({ bg }: { bg: string }) {
  const opacity = useShimmer();
  return <Animated.View style={[sk.pill, { backgroundColor: bg, opacity }]} />;
}
const sk = StyleSheet.create({ pill: { flex: 1, height: 100, borderRadius: 20 } });

// ── Progress ring (SVG) ──────────────────────────────────────────────────────
function ProgressRing({
  size,
  strokeWidth,
  progress,
  color,
  bg,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  bg: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={bg} strokeWidth={strokeWidth} fill="none"
      />
      <Circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getGreetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const h = new Date().getHours();
  if (h < 12) return "goodMorning";
  if (h < 18) return "goodAfternoon";
  return "goodEvening";
}

function getGreetingEmoji(key: string) {
  if (key === "goodMorning") return "🌤";
  if (key === "goodAfternoon") return "☀️";
  return "🌙";
}

const PRIORITY_BG: Record<string, string> = { high: "#FEE2E2", medium: "#FEF9C3", low: "#DCFCE7" };
const PRIORITY_COLOR: Record<string, string> = { high: "#DC2626", medium: "#B45309", low: "#059669" };
const NOTE_ACCENT = ["#EDE9FE", "#DCFCE7", "#FEF9C3", "#DBEAFE", "#FCE7F3"];
const NOTE_ICON = ["📝", "📖", "✏️", "💡", "📌"];

// ── Main component ───────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const lang = useLanguage();
  const isWeb = Platform.OS === "web";

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetDashboardStats();
  const { data: upcoming, refetch: refetchUpcoming } = useGetDashboardUpcoming();
  const { data: recentNotes, refetch: refetchNotes } = useGetDashboardRecentNotes();

  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Streak counter
  useEffect(() => {
    const computeStreak = async () => {
      try {
        const today = new Date().toDateString();
        const lastOpen = await AsyncStorage.getItem("@keepall/last_open");
        const stored = parseInt((await AsyncStorage.getItem("@keepall/streak")) ?? "0");
        if (lastOpen === today) { setStreak(stored); return; }
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastOpen === yesterday ? stored + 1 : 1;
        await AsyncStorage.setItem("@keepall/last_open", today);
        await AsyncStorage.setItem("@keepall/streak", String(newStreak));
        setStreak(newStreak);
      } catch {}
    };
    computeStreak();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchUpcoming(), refetchNotes()]);
    setRefreshing(false);
  };

  const firstName =
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "Student";
  const initials = firstName.slice(0, 2).toUpperCase();

  const greetingKey = getGreetingKey();

  const totalTasks = (stats as any)?.totalTasks ?? 0;
  const pendingTasks = stats?.pendingTasks ?? 0;
  const doneTasks = Math.max(0, totalTasks - pendingTasks);
  const progress = totalTasks > 0 ? doneTasks / totalTasks : 0;

  const streakLabel = streak === 0 ? lang.t("streakMsg0")
    : streak >= 7 ? lang.t("streakMsg7")
    : streak >= 3 ? lang.t("streakMsg3")
    : lang.t("streakMsg1");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + (isWeb ? 67 : 0) + 8,
          paddingBottom: insets.bottom + (isWeb ? 34 : 0) + 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <LinearGradient colors={["#6D28D9", "#7C3AED"]} style={styles.headerGradient}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { fontFamily: lang.fontR }]}>
                {lang.t(greetingKey)} {getGreetingEmoji(greetingKey)}
              </Text>
              <Text style={[styles.name, { fontFamily: lang.fontB }]}>{firstName}</Text>
            </View>
            <Pressable
              style={styles.avatar}
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Text style={[styles.avatarText, { fontFamily: lang.fontB }]}>{initials}</Text>
            </Pressable>
          </View>

          {stats?.activeSemester && (
            <View style={styles.semesterPill}>
              <Text style={styles.semesterIcon}>🎓</Text>
              <Text style={[styles.semesterText, { fontFamily: lang.fontSB }]} numberOfLines={1}>
                {stats.activeSemester.title}
              </Text>
            </View>
          )}
        </LinearGradient>

        <View style={[styles.body, { backgroundColor: colors.background }]}>

          {/* Stats row */}
          {statsLoading ? (
            <View style={styles.statsRow}>
              <SkeletonPill bg={colors.cardPurple} />
              <SkeletonPill bg={colors.cardYellow} />
              <SkeletonPill bg={colors.cardMint} />
            </View>
          ) : (
            <View style={styles.statsRow}>
              <StatPill label={lang.t("subjects")} value={stats?.totalSubjects ?? 0} bg={colors.cardPurple} icon="📚" color="#7C3AED" lang={lang} />
              <StatPill label={lang.t("pendingStat")} value={pendingTasks} bg={colors.cardYellow} icon="⏳" color="#B45309" lang={lang} />
              <StatPill label={lang.t("notes")} value={stats?.totalNotes ?? 0} bg={colors.cardMint} icon="📝" color="#059669" lang={lang} />
            </View>
          )}

          {/* Progress card */}
          {!statsLoading && totalTasks > 0 && (
            <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.progressTitle, { color: colors.foreground, fontFamily: lang.fontB }]}>
                  {lang.t("taskProgress")}
                </Text>
                <Text style={[styles.progressSub, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
                  {doneTasks}/{totalTasks} {lang.t("tasksCompleted")}
                </Text>
                {streak > 0 && (
                  <View style={[styles.streakBadge, { backgroundColor: "#FEF9C3" }]}>
                    <Text style={styles.streakFire}>🔥</Text>
                    <Text style={[styles.streakText, { fontFamily: lang.fontSB, color: "#B45309" }]}>
                      {streak} {lang.t("streakDays")}
                    </Text>
                  </View>
                )}
                <Text style={[styles.streakMsg, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
                  {streakLabel}
                </Text>
              </View>
              <View style={styles.ringWrap}>
                <ProgressRing
                  size={96}
                  strokeWidth={10}
                  progress={progress}
                  color="#7C3AED"
                  bg="#EDE9FE"
                />
                <View style={StyleSheet.absoluteFill}>
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={[styles.ringPct, { color: colors.foreground, fontFamily: lang.fontB }]}>
                      {Math.round(progress * 100)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Upcoming Tasks */}
          {(upcoming?.tasks?.length ?? 0) > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: lang.fontB }]}>
                  {lang.t("upcomingTasks")}
                </Text>
                <Pressable onPress={() => router.push("/(tabs)/tasks")}>
                  <Text style={[styles.seeAll, { color: colors.primary, fontFamily: lang.fontM }]}>{lang.t("seeAll")}</Text>
                </Pressable>
              </View>
              {upcoming!.tasks.slice(0, 4).map((task) => {
                const pBg = PRIORITY_BG[task.priority] ?? colors.muted;
                const pColor = PRIORITY_COLOR[task.priority] ?? colors.mutedForeground;
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
                return (
                  <View key={task.id} style={[styles.taskCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.priorityBar, { backgroundColor: pColor }]} />
                    <View style={styles.taskBody}>
                      <Text style={[styles.taskTitle, { color: colors.foreground, fontFamily: lang.fontM }]} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                        {task.dueDate && (
                          <View style={[styles.dueBadge, { backgroundColor: isOverdue ? "#FEE2E2" : pBg }]}>
                            <Text style={[styles.dueText, { color: isOverdue ? "#DC2626" : pColor, fontFamily: lang.fontSB }]}>
                              {isOverdue ? "⚠️ Overdue" : new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.priorityIcon}>
                      {task.priority === "high" ? "🔴" : task.priority === "medium" ? "🟡" : "🟢"}
                    </Text>
                  </View>
                );
              })}
            </>
          )}

          {/* Recent Notes */}
          {(recentNotes?.length ?? 0) > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: lang.fontB, marginTop: 8, marginBottom: 12 }]}>
                {lang.t("recentNotes")}
              </Text>
              {recentNotes!.slice(0, 3).map((note, i) => (
                <Pressable key={note.id} style={[styles.noteCard, { backgroundColor: NOTE_ACCENT[i % NOTE_ACCENT.length] }]}>
                  <Text style={styles.noteIcon}>{NOTE_ICON[i % NOTE_ICON.length]}</Text>
                  <View style={styles.noteBody}>
                    <Text style={[styles.noteTitle, { fontFamily: lang.fontSB }]} numberOfLines={1}>{note.title}</Text>
                    {note.content && (
                      <Text style={[styles.noteSub, { fontFamily: lang.fontR }]} numberOfLines={1}>{note.content}</Text>
                    )}
                  </View>
                  <Text style={styles.noteArrow}>›</Text>
                </Pressable>
              ))}
            </>
          )}

          {/* Empty state */}
          {!statsLoading && !stats && (
            <View style={[styles.emptyBox, { backgroundColor: colors.cardPurple }]}>
              <Text style={styles.emptyEmoji}>🎓</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: lang.fontB }]}>
                {lang.t("readyToStart")}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
                {lang.t("createFirstSemester")}
              </Text>
              <Pressable
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)/semesters")}
              >
                <Text style={[styles.emptyBtnText, { fontFamily: lang.fontSB }]}>{lang.t("addSemester")}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatPill({ label, value, bg, icon, color, lang }: {
  label: string; value: number; bg: string; icon: string; color: string;
  lang: ReturnType<typeof import("@/contexts/LanguageContext").useLanguage>;
}) {
  return (
    <View style={[spStyles.pill, { backgroundColor: bg }]}>
      <Text style={spStyles.icon}>{icon}</Text>
      <Text style={[spStyles.value, { color, fontFamily: lang.fontB }]}>{value}</Text>
      <Text style={[spStyles.label, { color, fontFamily: lang.fontM }]}>{label}</Text>
    </View>
  );
}
const spStyles = StyleSheet.create({
  pill: { flex: 1, borderRadius: 20, padding: 16, alignItems: "center", gap: 4 },
  icon: { fontSize: 22 },
  value: { fontSize: 26 },
  label: { fontSize: 11, textAlign: "center", opacity: 0.8 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginBottom: 4 },
  name: { color: "#fff", fontSize: 28 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  avatarText: { color: "#fff", fontSize: 18 },
  semesterPill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9, gap: 8, alignSelf: "flex-start", maxWidth: "100%" },
  semesterIcon: { fontSize: 16 },
  semesterText: { color: "#fff", fontSize: 14, flexShrink: 1 },
  body: { paddingHorizontal: 20, paddingTop: 24 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  progressTitle: { fontSize: 16, marginBottom: 4 },
  progressSub: { fontSize: 13, marginBottom: 10 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start", marginBottom: 6 },
  streakFire: { fontSize: 14 },
  streakText: { fontSize: 12 },
  streakMsg: { fontSize: 12 },
  ringWrap: { width: 96, height: 96 },
  ringPct: { fontSize: 18 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18 },
  seeAll: { fontSize: 13 },
  taskCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, marginBottom: 10, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  priorityBar: { width: 4, alignSelf: "stretch" },
  taskBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, gap: 6 },
  taskTitle: { fontSize: 14 },
  dueBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dueText: { fontSize: 11 },
  priorityIcon: { fontSize: 16, paddingRight: 14 },
  noteCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, marginBottom: 10, gap: 12 },
  noteIcon: { fontSize: 24 },
  noteBody: { flex: 1 },
  noteTitle: { fontSize: 14, color: "#1A1035", marginBottom: 2 },
  noteSub: { fontSize: 12, color: "#6B7280" },
  noteArrow: { fontSize: 20, color: "#9CA3AF" },
  emptyBox: { borderRadius: 24, padding: 28, alignItems: "center", marginTop: 12 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: "#fff", fontSize: 15 },
});
