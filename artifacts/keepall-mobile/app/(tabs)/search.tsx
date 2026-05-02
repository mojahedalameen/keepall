import { useGlobalSearch } from "../../lib/api-client";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

const TYPE_CONFIG: Record<string, { icon: React.ComponentProps<typeof Feather>["name"]; bg: string; color: string }> = {
  note: { icon: "file-text", bg: "#EDE9FE", color: "#7C3AED" },
  subject: { icon: "book-open", bg: "#DCFCE7", color: "#059669" },
  semester: { icon: "calendar", bg: "#DBEAFE", color: "#2563EB" },
  task: { icon: "check-square", bg: "#FEF9C3", color: "#B45309" },
  file: { icon: "paperclip", bg: "#FCE7F3", color: "#DB2777" },
};

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const lang = useLanguage();

  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: results, isLoading, isFetching, refetch } = useGlobalSearch(
    { q: debouncedQ },
    { query: { enabled: debouncedQ.length >= 2 } as any }
  );

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setDebouncedQ(text), 400);
    setDebounceTimer(timer);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (debouncedQ.length >= 2) await refetch();
    setRefreshing(false);
  };

  const hasResults =
    (results?.notes?.length ?? 0) > 0 ||
    (results?.subjects?.length ?? 0) > 0 ||
    (results?.tasks?.length ?? 0) > 0;

  const totalResults =
    (results?.notes?.length ?? 0) +
    (results?.subjects?.length ?? 0) +
    (results?.tasks?.length ?? 0);

  const HINT_TAGS = [
    { label: lang.t("notes"), icon: "file-text" as const, color: "#7C3AED", bg: "#EDE9FE" },
    { label: lang.t("subjects"), icon: "book-open" as const, color: "#059669", bg: "#DCFCE7" },
    { label: lang.t("tasks"), icon: "check-square" as const, color: "#B45309", bg: "#FEF9C3" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (isWeb ? 67 : 0) + 20 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: lang.fontB }]}>
          {lang.t("searchTitle")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
          {lang.t("findAnything")}
        </Text>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.card,
              borderColor: isFocused ? colors.primary : colors.border,
              borderWidth: isFocused ? 2 : 1.5,
              shadowColor: isFocused ? colors.primary : "#7C3AED",
              shadowOpacity: isFocused ? 0.2 : 0.06,
            },
          ]}
        >
          <Feather name="search" size={18} color={isFocused ? colors.primary : colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: lang.fontR }]}
            value={query}
            onChangeText={onChangeText}
            placeholder={lang.t("searchPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {(isLoading || isFetching) && <ActivityIndicator size="small" color={colors.primary} />}
          {query.length > 0 && !isLoading && !isFetching && (
            <Pressable
              onPress={() => { setQuery(""); setDebouncedQ(""); }}
              style={[styles.clearBtn, { backgroundColor: colors.muted }]}
              hitSlop={8}
            >
              <Feather name="x" size={13} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {debouncedQ.length < 2 ? (
        <View style={styles.hintContainer}>
          <View style={[styles.hintCircle, { backgroundColor: colors.cardPurple }]}>
            <Feather name="search" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.hintTitle, { color: colors.foreground, fontFamily: lang.fontB }]}>
            {lang.t("whatLookingFor")}
          </Text>
          <Text style={[styles.hintSub, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
            {lang.t("searchAcross")}
          </Text>
          <View style={styles.tagRow}>
            {HINT_TAGS.map((tag) => (
              <View key={tag.label} style={[styles.tag, { backgroundColor: tag.bg }]}>
                <Feather name={tag.icon} size={14} color={tag.color} />
                <Text style={[styles.tagText, { color: tag.color, fontFamily: lang.fontSB }]}>{tag.label}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
            {lang.t("typeAtLeast")}
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
          {!hasResults && !isLoading && (
            <View style={styles.noResults}>
              <View style={[styles.hintCircle, { backgroundColor: colors.muted }]}>
                <Feather name="search" size={32} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.noResultsText, { color: colors.foreground, fontFamily: lang.fontB }]}>
                {lang.t("noResultsFor")} "{debouncedQ}"
              </Text>
              <Text style={[styles.noResultsSub, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
                {lang.t("tryDifferent")}
              </Text>
            </View>
          )}

          {hasResults && (
            <View style={[styles.resultsBadge, { backgroundColor: colors.cardPurple }]}>
              <Feather name="zap" size={13} color={colors.primary} />
              <Text style={[styles.resultsBadgeText, { color: colors.primary, fontFamily: lang.fontSB }]}>
                {totalResults} {lang.t("resultsFor")} "{debouncedQ}"
              </Text>
            </View>
          )}

          {(results?.notes?.length ?? 0) > 0 && (
            <ResultSection
              sectionKey={lang.t("notesSection")}
              icon="file-text"
              items={results!.notes.map((n) => ({ id: n.id, title: n.title, subtitle: n.content ?? undefined }))}
              cfg={TYPE_CONFIG.note}
              colors={colors}
              fontSB={lang.fontSB}
              fontR={lang.fontR}
            />
          )}

          {(results?.subjects?.length ?? 0) > 0 && (
            <ResultSection
              sectionKey={lang.t("subjectsSection")}
              icon="book-open"
              items={results!.subjects.map((s) => ({ id: s.id, title: s.title }))}
              cfg={TYPE_CONFIG.subject}
              colors={colors}
              fontSB={lang.fontSB}
              fontR={lang.fontR}
            />
          )}

          {(results?.tasks?.length ?? 0) > 0 && (
            <ResultSection
              sectionKey={lang.t("tasksSection")}
              icon="check-square"
              items={results!.tasks.map((t) => ({ id: t.id, title: t.title }))}
              cfg={TYPE_CONFIG.task}
              colors={colors}
              fontSB={lang.fontSB}
              fontR={lang.fontR}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ResultSection({
  sectionKey, icon, items, cfg, colors, fontSB, fontR,
}: {
  sectionKey: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  items: { id: number; title: string; subtitle?: string }[];
  cfg: { icon: React.ComponentProps<typeof Feather>["name"]; bg: string; color: string };
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  fontSB: string;
  fontR: string;
}) {
  return (
    <>
      <View style={rs.header}>
        <Feather name={icon} size={12} color={cfg.color} />
        <Text style={[rs.headerText, { color: cfg.color, fontFamily: fontSB }]}>{sectionKey}</Text>
      </View>
      {items.map((item) => (
        <Pressable key={item.id} style={[rs.card, { backgroundColor: colors.card }]}>
          <View style={[rs.iconBox, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={18} color={cfg.color} />
          </View>
          <View style={rs.body}>
            <Text style={[rs.title, { color: colors.foreground, fontFamily: fontSB }]} numberOfLines={1}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[rs.sub, { color: colors.mutedForeground, fontFamily: fontR }]} numberOfLines={1}>
                {item.subtitle}
              </Text>
            )}
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
      ))}
    </>
  );
}
const rs = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 20, marginBottom: 10 },
  headerText: { fontSize: 11, letterSpacing: 1 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, marginBottom: 8, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 14 },
  sub: { fontSize: 12 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 32, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  searchBox: {
    flexDirection: "row", alignItems: "center", borderRadius: 18,
    paddingHorizontal: 16, gap: 10,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4,
  },
  searchInput: { flex: 1, paddingVertical: 15, fontSize: 15 },
  clearBtn: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  hintContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  hintCircle: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  hintTitle: { fontSize: 20, marginBottom: 8, textAlign: "center" },
  hintSub: { fontSize: 14, textAlign: "center", marginBottom: 24 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 16 },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  tagText: { fontSize: 13 },
  hint: { fontSize: 12, textAlign: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  resultsBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 14, padding: 12, marginBottom: 4, justifyContent: "center" },
  resultsBadgeText: { fontSize: 13 },
  noResults: { alignItems: "center", paddingTop: 40 },
  noResultsText: { fontSize: 17, marginBottom: 8, textAlign: "center" },
  noResultsSub: { fontSize: 14, textAlign: "center" },
});
