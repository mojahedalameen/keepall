import {
  getGetDashboardStatsQueryKey,
  getGetTasksQueryKey,
  useCreateTask,
  useDeleteTask,
  useGetTasks,
  useUpdateTask,
} from "../../lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/contexts/LanguageContext";

type TaskStatus = "pending" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";
type FilterTab = "all" | "pending" | "done";
type DuePreset = "none" | "today" | "tomorrow" | "week";

function getDueDate(preset: DuePreset): string | undefined {
  if (preset === "none") return undefined;
  const d = new Date();
  if (preset === "today") return d.toISOString();
  if (preset === "tomorrow") { d.setDate(d.getDate() + 1); return d.toISOString(); }
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

function formatDueDate(dueDate: string): string {
  const d = new Date(dueDate);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dueDate: string, status: string): boolean {
  return status !== "done" && new Date(dueDate) < new Date();
}

function SkeletonRow({ bg }: { bg: string }) {
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
    <Animated.View style={[{ height: 80, borderRadius: 18, marginBottom: 10, backgroundColor: bg, opacity: anim }]}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 14 }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.08)" }} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 14, borderRadius: 6, width: "70%", backgroundColor: "rgba(0,0,0,0.08)" }} />
          <View style={{ height: 10, borderRadius: 5, width: "35%", backgroundColor: "rgba(0,0,0,0.06)" }} />
        </View>
      </View>
    </Animated.View>
  );
}

const SKELETON_BG = ["#EDE9FE", "#FEF9C3", "#DCFCE7", "#DBEAFE"];

type SwipeableTaskRowProps = {
  task: {
    id: number;
    title: string;
    status: string;
    priority: string;
    dueDate?: string | null;
  };
  onToggle: (id: number, status: TaskStatus) => void;
  onDelete: (id: number, title: string) => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  lang: ReturnType<typeof import("@/contexts/LanguageContext").useLanguage>;
  priorityConfig: Record<TaskPriority, { bg: string; color: string; label: string; emoji: string }>;
};

function SwipeableTaskRow({ task, onToggle, onDelete, colors, lang, priorityConfig }: SwipeableTaskRowProps) {
  const swipeRef = useRef<Swipeable>(null);
  const isDone = task.status === "done";
  const p = priorityConfig[task.priority as TaskPriority] ?? priorityConfig.medium;
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;
  const overdue = task.dueDate ? isOverdue(task.dueDate, task.status) : false;

  const handleToggle = () => {
    swipeRef.current?.close();
    setTimeout(() => onToggle(task.id, task.status as TaskStatus), 150);
  };

  const handleDelete = () => {
    swipeRef.current?.close();
    setTimeout(() => onDelete(task.id, task.title), 150);
  };

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => (
        <Pressable
          style={[swipeStyles.leftAction, { backgroundColor: isDone ? "#F59E0B" : "#10B981" }]}
          onPress={handleToggle}
        >
          <Feather name={isDone ? "rotate-ccw" : "check"} size={22} color="#fff" />
          <Text style={[swipeStyles.actionText, { fontFamily: lang.fontSB }]}>
            {isDone ? "Undo" : lang.t("filterDone")}
          </Text>
        </Pressable>
      )}
      renderRightActions={() => (
        <Pressable style={[swipeStyles.rightAction, { backgroundColor: "#EF4444" }]} onPress={handleDelete}>
          <Feather name="trash-2" size={22} color="#fff" />
          <Text style={[swipeStyles.actionText, { fontFamily: lang.fontSB }]}>{lang.t("deleteLabel")}</Text>
        </Pressable>
      )}
    >
      <View style={[swipeStyles.row, { backgroundColor: isDone ? colors.muted : colors.card }]}>
        <Pressable
          style={[swipeStyles.checkbox, { borderColor: isDone ? "#10B981" : p.color, backgroundColor: isDone ? "#10B981" : "transparent" }]}
          onPress={handleToggle}
        >
          {isDone && <Feather name="check" size={13} color="#fff" />}
        </Pressable>

        <View style={swipeStyles.content}>
          <Text
            style={[swipeStyles.title, { color: isDone ? colors.mutedForeground : colors.foreground, textDecorationLine: isDone ? "line-through" : "none", fontFamily: lang.fontM }]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <View style={[swipeStyles.chip, { backgroundColor: p.bg }]}>
              <Text style={[swipeStyles.chipText, { color: p.color, fontFamily: lang.fontSB }]}>
                {p.emoji} {p.label}
              </Text>
            </View>
            {due && (
              <View style={[swipeStyles.chip, { backgroundColor: overdue ? "#FEE2E2" : "#F3F4F6" }]}>
                <Text style={[swipeStyles.chipText, { color: overdue ? "#DC2626" : "#6B7280", fontFamily: lang.fontSB }]}>
                  {overdue ? "⚠️ " : "📅 "}{due}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Feather name="chevron-right" size={14} color={colors.mutedForeground} style={{ opacity: 0.4 }} />
      </View>
    </Swipeable>
  );
}

const swipeStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, gap: 6 },
  title: { fontSize: 14 },
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11 },
  leftAction: { justifyContent: "center", alignItems: "center", width: 80, borderRadius: 18, marginBottom: 10, gap: 4, marginRight: 6 },
  rightAction: { justifyContent: "center", alignItems: "center", width: 80, borderRadius: 18, marginBottom: 10, gap: 4, marginLeft: 6 },
  actionText: { color: "#fff", fontSize: 11 },
});

export default function TasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const isWeb = Platform.OS === "web";
  const lang = useLanguage();

  const PRIORITY_CONFIG: Record<TaskPriority, { bg: string; color: string; label: string; emoji: string }> = {
    high: { bg: "#FEE2E2", color: "#DC2626", label: lang.t("highPriority"), emoji: "🔴" },
    medium: { bg: "#FEF9C3", color: "#B45309", label: lang.t("mediumPriority"), emoji: "🟡" },
    low: { bg: "#DCFCE7", color: "#059669", label: lang.t("lowPriority"), emoji: "🟢" },
  };

  const DUE_PRESETS: { key: DuePreset; label: string }[] = [
    { key: "none", label: lang.t("noDueDate") },
    { key: "today", label: lang.t("dueToday") },
    { key: "tomorrow", label: lang.t("dueTomorrow") },
    { key: "week", label: lang.t("dueThisWeek") },
  ];

  const FILTERS: { key: FilterTab; label: string; icon: React.ComponentProps<typeof Feather>["name"] }[] = [
    { key: "all", label: lang.t("filterAll"), icon: "list" },
    { key: "pending", label: lang.t("filterPending"), icon: "clock" },
    { key: "done", label: lang.t("filterDone"), icon: "check-circle" },
  ];

  const [filter, setFilter] = useState<FilterTab>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [duePreset, setDuePreset] = useState<DuePreset>("none");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const statusParam = filter === "all" ? undefined : filter === "pending" ? "pending" : "done";
  const { data: tasks, isLoading, refetch } = useGetTasks({ status: statusParam });
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetTasksQueryKey({}) });
    qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const onToggle = async (id: number, currentStatus: TaskStatus) => {
    Haptics.impactAsync(currentStatus === "done" ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy);
    const newStatus: TaskStatus = currentStatus === "done" ? "pending" : "done";
    await updateMutation.mutateAsync({ id, data: { status: newStatus } });
    invalidate();
  };

  const onDelete = (id: number, title: string) => {
    Alert.alert(lang.t("deleteTaskTitle"), `"${title}"?`, [
      { text: lang.t("cancelLabel"), style: "cancel" },
      {
        text: lang.t("deleteBtn"),
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteMutation.mutateAsync({ id });
          invalidate();
        },
      },
    ]);
  };

  const onSave = async () => {
    if (!taskTitle.trim()) return;
    setSaving(true);
    try {
      const dueDate = getDueDate(duePreset);
      await createMutation.mutateAsync({
        data: { title: taskTitle.trim(), priority, status: "pending", ...(dueDate ? { dueDate } : {}) },
      });
      invalidate();
      setModalVisible(false);
      setTaskTitle("");
      setPriority("medium");
      setDuePreset("none");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSaving(false);
    }
  };

  const totalDone = tasks?.filter((t) => t.status === "done").length ?? 0;
  const total = tasks?.length ?? 0;
  const progressPct = total > 0 ? totalDone / total : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (isWeb ? 67 : 0) + 20 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
            {lang.t("manageLabel")}
          </Text>
          <Text style={[styles.titleText, { color: colors.foreground, fontFamily: lang.fontB }]}>
            {lang.t("tasksTitle")}
          </Text>
        </View>
        <Pressable style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.8 : 1 }]} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      {total > 0 && (
        <View style={{ paddingHorizontal: 24, marginBottom: 4 }}>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.round(progressPct * 100)}%` as any }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.mutedForeground, fontFamily: lang.fontM }]}>
            {totalDone}/{total} {lang.t("completedLabel")}
          </Text>
        </View>
      )}

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterBtn, { backgroundColor: filter === f.key ? colors.primary : colors.muted, borderColor: filter === f.key ? colors.primary : "transparent" }]}
            onPress={() => setFilter(f.key)}
          >
            <Feather name={f.icon} size={13} color={filter === f.key ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.filterBtnText, { color: filter === f.key ? "#fff" : colors.mutedForeground, fontFamily: lang.fontSB }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {!isLoading && (tasks?.length ?? 0) > 0 && (
        <Text style={[styles.swipeHint, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
          {lang.t("swipeHint")}
        </Text>
      )}

      {isLoading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
          {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} bg={SKELETON_BG[i % SKELETON_BG.length]} />)}
        </View>
      ) : (tasks?.length ?? 0) === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✅</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: lang.fontB }]}>
            {filter === "done" ? lang.t("nothingDone") : lang.t("allClear")}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
            {filter === "done" ? lang.t("completeSomeFirst") : lang.t("tapPlusTask")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (isWeb ? 34 : 0) + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {tasks!.map((task) => (
            <View key={task.id} style={{ borderRadius: 18, overflow: "hidden", marginBottom: 10 }}>
              <SwipeableTaskRow
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                colors={colors}
                lang={lang}
                priorityConfig={PRIORITY_CONFIG}
              />
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: lang.fontB }]}>
              📝 {lang.t("newTaskSheet")}
            </Text>

            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border, fontFamily: lang.fontR }]}
              value={taskTitle} onChangeText={setTaskTitle} placeholder={lang.t("whatToDo")}
              placeholderTextColor={colors.mutedForeground} autoFocus returnKeyType="done" multiline
            />

            <Text style={[styles.sheetLabel, { color: colors.mutedForeground, fontFamily: lang.fontM }]}>
              {lang.t("priorityLabel")}
            </Text>
            <View style={styles.priorityRow}>
              {(["low", "medium", "high"] as TaskPriority[]).map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                const sel = priority === p;
                return (
                  <Pressable key={p} style={[styles.priorityBtn, { backgroundColor: sel ? cfg.bg : colors.muted, borderColor: sel ? cfg.color : "transparent" }]} onPress={() => setPriority(p)}>
                    <Text style={styles.priorityEmoji}>{cfg.emoji}</Text>
                    <Text style={[styles.priorityBtnText, { color: sel ? cfg.color : colors.mutedForeground, fontFamily: lang.fontSB }]}>{cfg.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sheetLabel, { color: colors.mutedForeground, fontFamily: lang.fontM }]}>
              📅 {lang.t("dueDateLabel")}
            </Text>
            <View style={styles.dueRow}>
              {DUE_PRESETS.map((preset) => {
                const sel = duePreset === preset.key;
                return (
                  <Pressable key={preset.key} style={[styles.dueBtn, { backgroundColor: sel ? "#EDE9FE" : colors.muted, borderColor: sel ? colors.primary : "transparent" }]} onPress={() => setDuePreset(preset.key)}>
                    <Text style={[styles.dueBtnText, { color: sel ? colors.primary : colors.mutedForeground, fontFamily: lang.fontSB }]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={onSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <Text style={[styles.saveBtnText, { fontFamily: lang.fontSB }]}>{lang.t("addTaskBtn")}</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16 },
  subtitle: { fontSize: 13, marginBottom: 2 },
  titleText: { fontSize: 28 },
  addBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center", shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  progressTrack: { height: 6, borderRadius: 6, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 6 },
  progressText: { fontSize: 11, marginTop: 6, marginBottom: 4 },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 8, marginTop: 14 },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5 },
  filterBtnText: { fontSize: 13 },
  swipeHint: { fontSize: 11, textAlign: "center", marginBottom: 10, opacity: 0.6 },
  scroll: { paddingHorizontal: 12 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 15, textAlign: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 24 },
  sheetTitle: { fontSize: 22, marginBottom: 16 },
  sheetLabel: { fontSize: 13, marginBottom: 10 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 20, minHeight: 60 },
  priorityRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  priorityBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14, borderWidth: 2, gap: 4 },
  priorityEmoji: { fontSize: 18 },
  priorityBtnText: { fontSize: 12 },
  dueRow: { flexDirection: "row", gap: 6, marginBottom: 20, flexWrap: "wrap" },
  dueBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5 },
  dueBtnText: { fontSize: 12 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16 },
});
