import {
  getGetDashboardStatsQueryKey,
  getGetSemestersQueryKey,
  useActivateSemester,
  useCreateSemester,
  useDeleteSemester,
  useGetSemesters,
  useUpdateSemester,
} from "../../lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
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

type Semester = {
  id: number;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
};

const CARD_COLORS = ["#EDE9FE", "#DCFCE7", "#FEF9C3", "#DBEAFE", "#FCE7F3", "#FFEDD5"];
const CARD_ICONS = ["📖", "🎓", "📚", "🏫", "✏️", "🔬"];

function SkeletonCard({ bg }: { bg: string }) {
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
    <Animated.View style={[skStyles.card, { backgroundColor: bg, opacity: anim }]}>
      <View style={skStyles.topRow}>
        <View style={[skStyles.iconBox, { backgroundColor: "rgba(0,0,0,0.08)" }]} />
        <View style={[skStyles.badge, { backgroundColor: "rgba(0,0,0,0.08)" }]} />
      </View>
      <View style={[skStyles.titleLine, { backgroundColor: "rgba(0,0,0,0.1)" }]} />
      <View style={[skStyles.dateLine, { backgroundColor: "rgba(0,0,0,0.07)" }]} />
      <View style={skStyles.actionsRow}>
        <View style={[skStyles.actionPill, { backgroundColor: "rgba(0,0,0,0.08)" }]} />
        <View style={[skStyles.actionPill, { backgroundColor: "rgba(0,0,0,0.08)" }]} />
      </View>
    </Animated.View>
  );
}
const skStyles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, marginBottom: 14, height: 168 },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12 },
  badge: { width: 64, height: 24, borderRadius: 10 },
  titleLine: { height: 20, borderRadius: 8, width: "70%", marginBottom: 8 },
  dateLine: { height: 14, borderRadius: 6, width: "45%", marginBottom: 16 },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionPill: { height: 32, width: 72, borderRadius: 10 },
});

export default function SemestersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const isWeb = Platform.OS === "web";
  const lang = useLanguage();

  const { data: semesters, isLoading, refetch } = useGetSemesters();
  const [refreshing, setRefreshing] = useState(false);
  const createMutation = useCreateSemester();
  const updateMutation = useUpdateSemester();
  const deleteMutation = useDeleteSemester();
  const activateMutation = useActivateSemester();

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Semester | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetSemestersQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const openCreate = () => { setEditing(null); setTitle(""); setModalVisible(true); };
  const openEdit = (s: Semester) => { setEditing(s); setTitle(s.title); setModalVisible(true); };

  const onSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: { title: title.trim() } });
      } else {
        await createMutation.mutateAsync({ data: { title: title.trim() } });
      }
      invalidate();
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (s: Semester) => {
    Alert.alert(lang.t("deleteSemesterTitle"), `"${s.title}"? ${lang.t("deleteAllSubjects")}`, [
      { text: lang.t("cancelLabel"), style: "cancel" },
      {
        text: lang.t("deleteBtn"),
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteMutation.mutateAsync({ id: s.id });
          invalidate();
        },
      },
    ]);
  };

  const onActivate = async (s: Semester) => {
    if (s.isActive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await activateMutation.mutateAsync({ id: s.id });
    invalidate();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (isWeb ? 67 : 0) + 20 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
            {lang.t("yourLabel")}
          </Text>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: lang.fontB }]}>
            {lang.t("semestersTitle")}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={openCreate}
        >
          <Feather name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4 }} showsVerticalScrollIndicator={false}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} bg={CARD_COLORS[i % CARD_COLORS.length]} />
          ))}
        </ScrollView>
      ) : (semesters?.length ?? 0) === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: lang.fontB }]}>
            {lang.t("noSemestersYet")}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
            {lang.t("tapPlusCreate")}
          </Text>
          <Pressable style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={openCreate}>
            <Text style={[styles.emptyBtnText, { fontFamily: lang.fontSB }]}>{lang.t("createSemester")}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (isWeb ? 34 : 0) + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {semesters!.map((s, i) => {
            const bg = CARD_COLORS[i % CARD_COLORS.length];
            const icon = CARD_ICONS[i % CARD_ICONS.length];
            return (
              <Pressable
                key={s.id}
                style={({ pressed }) => [styles.card, { backgroundColor: bg, opacity: pressed ? 0.95 : 1 }]}
                onPress={() => router.push(`/semester/${s.id}`)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardIcon}>{icon}</Text>
                  {s.isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                      <Feather name="check-circle" size={11} color="#fff" />
                      <Text style={[styles.activeBadgeText, { fontFamily: lang.fontB }]}>
                        {lang.t("activeBadge")}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.semTitle, { fontFamily: lang.fontB }]} numberOfLines={2}>
                  {s.title}
                </Text>

                {(s.startDate || s.endDate) && (
                  <View style={styles.dateRow}>
                    <Feather name="calendar" size={12} color="#6B7280" />
                    <Text style={[styles.dateText, { fontFamily: lang.fontR }]}>
                      {s.startDate
                        ? new Date(s.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                        : ""}
                      {s.startDate && s.endDate ? " → " : ""}
                      {s.endDate
                        ? new Date(s.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                        : ""}
                    </Text>
                  </View>
                )}

                <View style={styles.actions}>
                  {!s.isActive && (
                    <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => onActivate(s)}>
                      <Feather name="check-circle" size={13} color="#fff" />
                      <Text style={[styles.actionBtnText, { color: "#fff", fontFamily: lang.fontSB }]}>
                        {lang.t("activateSemester")}
                      </Text>
                    </Pressable>
                  )}
                  <Pressable style={[styles.actionBtn, { backgroundColor: "rgba(0,0,0,0.08)" }]} onPress={() => openEdit(s)}>
                    <Feather name="edit-2" size={13} color="#1A1035" />
                    <Text style={[styles.actionBtnText, { color: "#1A1035", fontFamily: lang.fontSB }]}>
                      {lang.t("editLabel")}
                    </Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, { backgroundColor: "#FEE2E2" }]} onPress={() => onDelete(s)}>
                    <Feather name="trash-2" size={13} color="#DC2626" />
                    <Text style={[styles.actionBtnText, { color: "#DC2626", fontFamily: lang.fontSB }]}>
                      {lang.t("deleteLabel")}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
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
              {editing ? `✏️ ${lang.t("editSemesterSheet")}` : `📖 ${lang.t("newSemesterSheet")}`}
            </Text>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: lang.fontM }]}>
              {lang.t("semesterName")}
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border, fontFamily: lang.fontR }]}
              value={title} onChangeText={setTitle} placeholder={lang.t("semesterPlaceholder")}
              placeholderTextColor={colors.mutedForeground} autoFocus returnKeyType="done" onSubmitEditing={onSave}
            />
            <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={onSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <Text style={[styles.saveBtnText, { fontFamily: lang.fontSB }]}>
                  {editing ? lang.t("saveChanges") : lang.t("createSemester")}
                </Text>
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
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 20 },
  subtitle: { fontSize: 13, marginBottom: 2 },
  title: { fontSize: 28 },
  addBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center", shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  card: { borderRadius: 24, padding: 20, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cardIcon: { fontSize: 32 },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  activeBadgeText: { color: "#fff", fontSize: 11, letterSpacing: 0.5 },
  semTitle: { fontSize: 20, color: "#1A1035", marginBottom: 8 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  dateText: { fontSize: 13, color: "#6B7280" },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionBtnText: { fontSize: 13 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, marginBottom: 10, textAlign: "center" },
  emptyText: { fontSize: 15, textAlign: "center", marginBottom: 24 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { color: "#fff", fontSize: 16 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  sheetHandle: { width: 44, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 24 },
  sheetTitle: { fontSize: 22, marginBottom: 20 },
  inputLabel: { fontSize: 13, marginBottom: 8 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 20 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16 },
});
