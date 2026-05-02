import {
  getGetSubjectsQueryKey,
  useCreateSubject,
  useDeleteSubject,
  useGetSemester,
  useGetSubjects,
} from "../../lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const SUBJECT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

export default function SemesterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const semId = Number(id);

  const { data: semester } = useGetSemester(semId);
  const { data: subjects, isLoading } = useGetSubjects({ semesterId: semId });
  const createMutation = useCreateSubject();
  const deleteMutation = useDeleteSubject();

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [instructor, setInstructor] = useState("");
  const [selectedColor, setSelectedColor] = useState(SUBJECT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetSubjectsQueryKey({ semesterId: semId }) });

  const onSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        data: {
          title: title.trim(),
          code: code.trim() || null,
          instructor: instructor.trim() || null,
          color: selectedColor,
          semesterId: semId,
        },
      });
      invalidate();
      setModalVisible(false);
      setTitle(""); setCode(""); setInstructor(""); setSelectedColor(SUBJECT_COLORS[0]);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (subId: number, subTitle: string) => {
    Alert.alert("Delete Subject", `Delete "${subTitle}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await deleteMutation.mutateAsync({ id: subId });
          invalidate();
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: insets.top + 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 8,
    },
    backBtn: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    scroll: { paddingHorizontal: 16, paddingBottom: insets.bottom + 32 },
    semesterBadge: {
      alignSelf: "flex-start",
      backgroundColor: colors.muted,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginBottom: 16,
    },
    semesterBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    subjectCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    colorStripe: { width: 4, height: 48, borderRadius: 2 },
    subjectInfo: { flex: 1 },
    subjectTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 2 },
    subjectMeta: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    chevron: { padding: 4 },
    deleteBtn: { padding: 4, marginLeft: 4 },
    emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center" },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: insets.bottom + 24,
    },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 },
    sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 20 },
    inputLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 15,
      color: colors.foreground,
      backgroundColor: colors.background,
      fontFamily: "Inter_400Regular",
      marginBottom: 14,
    },
    colorRow: { flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" },
    colorDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: "transparent" },
    saveBtn: { backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 14, alignItems: "center" },
    saveBtnText: { color: colors.primaryForeground, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{semester?.title ?? "Subjects"}</Text>
        <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (subjects?.length ?? 0) === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="book" size={48} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>No subjects yet</Text>
          <Text style={styles.emptyText}>Tap + to add a subject to this semester</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.semesterBadge}>
            <Text style={styles.semesterBadgeText}>{subjects!.length} {subjects!.length === 1 ? "Subject" : "Subjects"}</Text>
          </View>
          {subjects!.map((sub) => (
            <Pressable key={sub.id} style={styles.subjectCard} onPress={() => router.push(`/subject/${sub.id}`)}>
              <View style={[styles.colorStripe, { backgroundColor: sub.color ?? colors.primary }]} />
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectTitle} numberOfLines={1}>{sub.title}</Text>
                <Text style={styles.subjectMeta} numberOfLines={1}>
                  {[sub.code, sub.instructor].filter(Boolean).join(" · ") || "No details"}
                </Text>
              </View>
              <Pressable style={styles.deleteBtn} onPress={() => onDelete(sub.id, sub.title)}>
                <Feather name="trash-2" size={16} color={colors.mutedForeground} />
              </Pressable>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New Subject</Text>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Calculus II" placeholderTextColor={colors.mutedForeground} autoFocus />
            <Text style={styles.inputLabel}>Code (optional)</Text>
            <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="e.g. MATH 201" placeholderTextColor={colors.mutedForeground} />
            <Text style={styles.inputLabel}>Instructor (optional)</Text>
            <TextInput style={styles.input} value={instructor} onChangeText={setInstructor} placeholder="e.g. Dr. Smith" placeholderTextColor={colors.mutedForeground} />
            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorRow}>
              {SUBJECT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c, borderColor: selectedColor === c ? colors.foreground : "transparent" }]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>
            <Pressable style={styles.saveBtn} onPress={onSave} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.saveBtnText}>Add Subject</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
