import {
  getGetNotesQueryKey,
  getGetTasksQueryKey,
  useCreateNote,
  useCreateTask,
  useDeleteNote,
  useGetNotes,
  useGetSubject,
  useGetSubjectStats,
  useGetTasks,
  useUpdateTask,
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

type TabKey = "notes" | "tasks";

const PRIORITY_COLORS: Record<string, string> = { high: "#f43f5e", medium: "#f59e0b", low: "#10b981" };

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const subId = Number(id);

  const [activeTab, setActiveTab] = useState<TabKey>("notes");
  const [noteModal, setNoteModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [saving, setSaving] = useState(false);

  const { data: subject } = useGetSubject(subId);
  const { data: stats } = useGetSubjectStats(subId);
  const { data: notes, isLoading: notesLoading } = useGetNotes({ subjectId: subId });
  const { data: tasks, isLoading: tasksLoading } = useGetTasks({ subjectId: subId });

  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const invalidateNotes = () => qc.invalidateQueries({ queryKey: getGetNotesQueryKey({ subjectId: subId }) });
  const invalidateTasks = () => qc.invalidateQueries({ queryKey: getGetTasksQueryKey({ subjectId: subId }) });

  const onSaveNote = async () => {
    if (!noteTitle.trim()) return;
    setSaving(true);
    try {
      await createNote.mutateAsync({ data: { title: noteTitle.trim(), content: noteContent.trim() || null, subjectId: subId } });
      invalidateNotes();
      setNoteModal(false);
      setNoteTitle(""); setNoteContent("");
    } finally { setSaving(false); }
  };

  const onDeleteNote = (nId: number, nTitle: string) => {
    Alert.alert("Delete Note", `Delete "${nTitle}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteNote.mutateAsync({ id: nId }); invalidateNotes(); } },
    ]);
  };

  const onSaveTask = async () => {
    if (!taskTitle.trim()) return;
    setSaving(true);
    try {
      await createTask.mutateAsync({ data: { title: taskTitle.trim(), priority: taskPriority, status: "pending", subjectId: subId } });
      invalidateTasks();
      setTaskModal(false);
      setTaskTitle(""); setTaskPriority("medium");
    } finally { setSaving(false); }
  };

  const onToggleTask = async (tId: number, current: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateTask.mutateAsync({ id: tId, data: { status: current === "done" ? "pending" : "done" } });
    invalidateTasks();
  };

  const subjectColor = subject?.color ?? colors.primary;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    backRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 8 },
    backBtn: { padding: 4 },
    headerTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    colorBar: { width: 4, height: 48, borderRadius: 2, marginTop: 2 },
    headerInfo: { flex: 1 },
    subjectName: { fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 2 },
    subjectMeta: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    statsRow: { flexDirection: "row", gap: 16, marginTop: 14 },
    statChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.muted,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    statChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    tabBar: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 8, gap: 4 },
    tabBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
      backgroundColor: colors.muted,
    },
    tabBtnActive: { backgroundColor: colors.primary },
    tabBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    tabBtnTextActive: { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" },
    addRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 16, paddingBottom: 8 },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    addBtnText: { color: colors.primaryForeground, fontSize: 13, fontFamily: "Inter_500Medium" },
    scroll: { paddingHorizontal: 16, paddingBottom: insets.bottom + 32 },
    noteCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 8,
      flexDirection: "row",
      gap: 10,
    },
    noteInfo: { flex: 1 },
    noteTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 3 },
    noteContent: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    deleteBtn: { padding: 4 },
    taskRow: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    taskTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: colors.foreground },
    taskTitleDone: { textDecorationLine: "line-through", color: colors.mutedForeground },
    priorityDot: { width: 8, height: 8, borderRadius: 4 },
    emptyState: { alignItems: "center", paddingTop: 60 },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 12 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: insets.bottom + 24 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 },
    sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 20 },
    inputLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground, marginBottom: 6 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: colors.radius, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colors.foreground, backgroundColor: colors.background, fontFamily: "Inter_400Regular", marginBottom: 14 },
    inputMultiline: { height: 90, textAlignVertical: "top" },
    priorityRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
    priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 2, borderColor: colors.border, alignItems: "center" },
    priorityBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    saveBtn: { backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 14, alignItems: "center" },
    saveBtnText: { color: colors.primaryForeground, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.headerTop}>
          <View style={[styles.colorBar, { backgroundColor: subjectColor }]} />
          <View style={styles.headerInfo}>
            <Text style={styles.subjectName} numberOfLines={2}>{subject?.title ?? "Subject"}</Text>
            <Text style={styles.subjectMeta}>{[subject?.code, subject?.instructor].filter(Boolean).join(" · ") || " "}</Text>
          </View>
        </View>
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Feather name="file-text" size={12} color={colors.mutedForeground} />
              <Text style={styles.statChipText}>{stats.notes} notes</Text>
            </View>
            <View style={styles.statChip}>
              <Feather name="check-square" size={12} color={colors.mutedForeground} />
              <Text style={styles.statChipText}>{stats.tasks} tasks</Text>
            </View>
            <View style={styles.statChip}>
              <Feather name="video" size={12} color={colors.mutedForeground} />
              <Text style={styles.statChipText}>{stats.lectures} lectures</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.tabBar}>
        {(["notes", "tasks"] as TabKey[]).map((t) => (
          <Pressable key={t} style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabBtnText, activeTab === t && styles.tabBtnTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.addRow}>
        <Pressable style={styles.addBtn} onPress={() => activeTab === "notes" ? setNoteModal(true) : setTaskModal(true)}>
          <Feather name="plus" size={16} color={colors.primaryForeground} />
          <Text style={styles.addBtnText}>Add {activeTab === "notes" ? "Note" : "Task"}</Text>
        </Pressable>
      </View>

      {activeTab === "notes" ? (
        notesLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {(notes?.length ?? 0) === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="file-text" size={40} color={colors.mutedForeground} />
                <Text style={styles.emptyText}>No notes yet</Text>
              </View>
            ) : (
              notes!.map((note) => (
                <View key={note.id} style={styles.noteCard}>
                  <View style={styles.noteInfo}>
                    <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
                    {note.content && <Text style={styles.noteContent} numberOfLines={2}>{note.content}</Text>}
                  </View>
                  <Pressable style={styles.deleteBtn} onPress={() => onDeleteNote(note.id, note.title)}>
                    <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        )
      ) : (
        tasksLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {(tasks?.length ?? 0) === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="check-square" size={40} color={colors.mutedForeground} />
                <Text style={styles.emptyText}>No tasks yet</Text>
              </View>
            ) : (
              tasks!.map((task) => {
                const isDone = task.status === "done";
                const pColor = PRIORITY_COLORS[task.priority] ?? colors.mutedForeground;
                return (
                  <View key={task.id} style={styles.taskRow}>
                    <Pressable
                      style={[styles.checkbox, { borderColor: isDone ? colors.success : pColor, backgroundColor: isDone ? colors.success : "transparent" }]}
                      onPress={() => onToggleTask(task.id, task.status)}
                    >
                      {isDone && <Feather name="check" size={14} color="#fff" />}
                    </Pressable>
                    <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={2}>{task.title}</Text>
                    <View style={[styles.priorityDot, { backgroundColor: pColor }]} />
                  </View>
                );
              })
            )}
          </ScrollView>
        )
      )}

      <Modal visible={noteModal} transparent animationType="slide" onRequestClose={() => setNoteModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setNoteModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New Note</Text>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput style={styles.input} value={noteTitle} onChangeText={setNoteTitle} placeholder="Note title..." placeholderTextColor={colors.mutedForeground} autoFocus />
            <Text style={styles.inputLabel}>Content (optional)</Text>
            <TextInput style={[styles.input, styles.inputMultiline]} value={noteContent} onChangeText={setNoteContent} placeholder="Write something..." placeholderTextColor={colors.mutedForeground} multiline />
            <Pressable style={styles.saveBtn} onPress={onSaveNote} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.saveBtnText}>Save Note</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={taskModal} transparent animationType="slide" onRequestClose={() => setTaskModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setTaskModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New Task</Text>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput style={styles.input} value={taskTitle} onChangeText={setTaskTitle} placeholder="Task title..." placeholderTextColor={colors.mutedForeground} autoFocus />
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(["low", "medium", "high"] as const).map((p) => (
                <Pressable
                  key={p}
                  style={[styles.priorityBtn, { borderColor: taskPriority === p ? PRIORITY_COLORS[p] : colors.border, backgroundColor: taskPriority === p ? PRIORITY_COLORS[p] + "22" : "transparent" }]}
                  onPress={() => setTaskPriority(p)}
                >
                  <Text style={[styles.priorityBtnText, { color: taskPriority === p ? PRIORITY_COLORS[p] : colors.mutedForeground }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.saveBtn} onPress={onSaveTask} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.saveBtnText}>Add Task</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
