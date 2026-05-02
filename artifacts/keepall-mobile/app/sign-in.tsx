import { useSignIn } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/contexts/LanguageContext";

type ScreenView = "signin" | "forgot_email" | "forgot_verify";

const FEATURES = [
  { icon: "📚", key: "feature1" as const },
  { icon: "✅", key: "feature2" as const },
  { icon: "🔍", key: "feature3" as const },
];

export default function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const lang = useLanguage();

  const [view, setView] = useState<ScreenView>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const isReady = fetchStatus !== "fetching";

  const onSignIn = async () => {
    if (!isReady || loading) return;
    setError("");
    setLoading(true);
    try {
      const { error: createErr } = await signIn.create({ identifier: email.trim() });
      if (createErr) { setError(createErr.message ?? "Sign in failed."); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      const { error: passwordErr } = await signIn.password({ password });
      if (passwordErr) { setError(passwordErr.message ?? "Incorrect password."); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      if (signIn.status === "complete") {
        const { error: finalizeErr } = await signIn.finalize();
        if (finalizeErr) { setError(finalizeErr.message ?? "Failed to complete sign-in."); return; }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const onSendResetCode = async () => {
    if (!forgotEmail.trim() || loading) return;
    setError("");
    setLoading(true);
    try {
      await (signIn as any).create({ strategy: "reset_password_email_code", identifier: forgotEmail.trim() });
      setView("forgot_verify");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    if (newPassword !== confirmPassword) { setError(lang.t("passwordsNoMatch")); return; }
    if (!resetCode || !newPassword || loading) return;
    setError("");
    setLoading(true);
    try {
      await (signIn as any).attemptFirstFactor({ strategy: "reset_password_email_code", code: resetCode });
      await (signIn as any).resetPassword({ password: newPassword });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const heroTitle =
    view === "forgot_email" || view === "forgot_verify"
      ? lang.t("resetPassword")
      : lang.t("welcomeBack");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#7C3AED" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#7C3AED", "#9333EA"]}
          style={[styles.hero, { paddingTop: insets.top + 44 }]}
        >
          <View style={styles.logoCircle}>
            <Text style={[styles.logoText, { fontFamily: lang.fontB }]}>k</Text>
          </View>
          <Text style={[styles.heroTitle, { fontFamily: lang.fontB }]}>keepall</Text>
          <Text style={[styles.heroSub, { fontFamily: lang.fontR }]}>{lang.t("appTagline")}</Text>
        </LinearGradient>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardTop}>
            <Text style={[styles.heading, { color: colors.foreground, fontFamily: lang.fontB }]}>
              {heroTitle}
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
              {view === "signin" && lang.t("signInContinue")}
              {view === "forgot_email" && lang.t("forgotPassword")}
              {view === "forgot_verify" && `${lang.t("resetCodeSentTo")} ${forgotEmail}`}
            </Text>

            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: colors.destructive + "15" }]}>
                <Feather name="alert-circle" size={14} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive, fontFamily: lang.fontM }]}>{error}</Text>
              </View>
            )}

            {view === "signin" && (
              <>
                <FieldInput
                  icon="mail" value={email} onChangeText={setEmail}
                  placeholder={lang.t("emailAddress")} placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  returnKeyType="next" focused={emailFocused}
                  onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                  colors={colors} fontFamily={lang.fontR}
                />
                <FieldInput
                  icon="lock" value={password} onChangeText={setPassword}
                  placeholder={lang.t("password")} placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword} returnKeyType="done" onSubmitEditing={onSignIn}
                  focused={passFocused} onFocus={() => setPassFocused(true)} onBlur={() => setPassFocused(false)}
                  colors={colors} fontFamily={lang.fontR}
                  rightAction={
                    <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                      <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                    </Pressable>
                  }
                />
                <Pressable
                  onPress={() => { setForgotEmail(email); setError(""); setView("forgot_email"); }}
                  style={{ alignSelf: "flex-end", marginTop: -6, marginBottom: 20 }}
                >
                  <Text style={[styles.forgotLink, { color: colors.primary, fontFamily: lang.fontM }]}>
                    {lang.t("forgotPassword")}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.button, { opacity: (!isReady || loading || pressed) ? 0.8 : 1 }]}
                  onPress={onSignIn} disabled={!isReady || loading}
                >
                  <LinearGradient colors={["#7C3AED", "#9333EA"]} style={styles.buttonGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <Text style={[styles.buttonText, { fontFamily: lang.fontSB }]}>{lang.t("signInBtn")}</Text>
                    )}
                  </LinearGradient>
                </Pressable>
                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
                    {lang.t("noAccount")}{" "}
                  </Text>
                  <Link href="/sign-up" asChild>
                    <Pressable>
                      <Text style={[styles.footerLink, { color: colors.primary, fontFamily: lang.fontB }]}>
                        {lang.t("signUpLink")}
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              </>
            )}

            {view === "forgot_email" && (
              <>
                <FieldInput
                  icon="mail" value={forgotEmail} onChangeText={setForgotEmail}
                  placeholder={lang.t("emailAddress")} placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address" autoCapitalize="none" focused={false}
                  colors={colors} fontFamily={lang.fontR} autoFocus
                />
                <Pressable
                  style={({ pressed }) => [styles.button, { opacity: (loading || pressed) ? 0.8 : 1 }]}
                  onPress={onSendResetCode} disabled={loading}
                >
                  <LinearGradient colors={["#7C3AED", "#9333EA"]} style={styles.buttonGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <Text style={[styles.buttonText, { fontFamily: lang.fontSB }]}>{lang.t("sendResetCode")}</Text>
                    )}
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={() => { setView("signin"); setError(""); }} style={styles.backBtn}>
                  <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.backText, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
                    {lang.t("backToSignIn")}
                  </Text>
                </Pressable>
              </>
            )}

            {view === "forgot_verify" && (
              <>
                <FieldInput
                  icon="hash" value={resetCode} onChangeText={setResetCode}
                  placeholder={lang.t("enterResetCode")} placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad" focused={false} colors={colors} fontFamily={lang.fontB} autoFocus
                />
                <FieldInput
                  icon="lock" value={newPassword} onChangeText={setNewPassword}
                  placeholder={lang.t("newPassword")} placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showNewPassword} focused={false} colors={colors} fontFamily={lang.fontR}
                  rightAction={
                    <Pressable onPress={() => setShowNewPassword(!showNewPassword)} hitSlop={12}>
                      <Feather name={showNewPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                    </Pressable>
                  }
                />
                <FieldInput
                  icon="check" value={confirmPassword} onChangeText={setConfirmPassword}
                  placeholder={lang.t("confirmPassword")} placeholderTextColor={colors.mutedForeground}
                  secureTextEntry focused={false} colors={colors} fontFamily={lang.fontR}
                />
                <Pressable
                  style={({ pressed }) => [styles.button, { opacity: (loading || pressed) ? 0.8 : 1 }]}
                  onPress={onResetPassword} disabled={loading}
                >
                  <LinearGradient colors={["#7C3AED", "#9333EA"]} style={styles.buttonGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <Text style={[styles.buttonText, { fontFamily: lang.fontSB }]}>{lang.t("setNewPassword")}</Text>
                    )}
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={() => { setView("forgot_email"); setError(""); }} style={styles.backBtn}>
                  <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.backText, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
                    {lang.t("backToSignIn")}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          {view === "signin" && (
            <View style={[styles.featuresSection, { borderTopColor: colors.border }]}>
              <View style={styles.featureRow}>
                {FEATURES.map((f) => (
                  <View key={f.key} style={[styles.featurePill, { backgroundColor: colors.muted }]}>
                    <Text style={styles.featureIcon}>{f.icon}</Text>
                    <Text style={[styles.featureText, { color: colors.mutedForeground, fontFamily: lang.fontM }]}>
                      {lang.t(f.key)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldInputProps = {
  icon: React.ComponentProps<typeof Feather>["name"];
  value: string;
  onChangeText?: (t: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: React.ComponentProps<typeof TextInput>["autoCapitalize"];
  autoCorrect?: boolean;
  returnKeyType?: React.ComponentProps<typeof TextInput>["returnKeyType"];
  onSubmitEditing?: () => void;
  focused: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  fontFamily: string;
  rightAction?: React.ReactNode;
  autoFocus?: boolean;
};

function FieldInput({ icon, value, onChangeText, placeholder, placeholderTextColor, secureTextEntry, keyboardType, autoCapitalize, autoCorrect, returnKeyType, onSubmitEditing, focused, onFocus, onBlur, colors, fontFamily, rightAction, autoFocus }: FieldInputProps) {
  return (
    <View style={[fi.wrapper, { backgroundColor: colors.input, borderColor: focused ? colors.primary : colors.border }]}>
      <Feather name={icon} size={17} color={focused ? colors.primary : colors.mutedForeground} />
      <TextInput
        style={[fi.field, { color: colors.foreground, fontFamily }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={placeholderTextColor} secureTextEntry={secureTextEntry}
        keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoCorrect={autoCorrect}
        returnKeyType={returnKeyType} onSubmitEditing={onSubmitEditing}
        onFocus={onFocus} onBlur={onBlur} autoFocus={autoFocus}
      />
      {rightAction}
    </View>
  );
}
const fi = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, marginBottom: 14, gap: 12 },
  field: { flex: 1, paddingVertical: 16, fontSize: 15 },
});

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingBottom: 52, paddingHorizontal: 24 },
  logoCircle: { width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoText: { color: "#fff", fontSize: 36 },
  heroTitle: { color: "#fff", fontSize: 30, marginBottom: 8 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 15, textAlign: "center" },
  card: { borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -28, flexGrow: 1, justifyContent: "space-between" },
  cardTop: { paddingHorizontal: 28, paddingTop: 36 },
  heading: { fontSize: 26, marginBottom: 6 },
  sub: { fontSize: 15, marginBottom: 28 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 14, marginBottom: 16 },
  errorText: { fontSize: 14, flex: 1 },
  forgotLink: { fontSize: 13 },
  button: { borderRadius: 16, overflow: "hidden", marginTop: 4 },
  buttonGradient: { paddingVertical: 18, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 20 },
  backText: { fontSize: 14 },
  featuresSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 28, paddingVertical: 28 },
  featureRow: { flexDirection: "row", gap: 8 },
  featurePill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14 },
  featureIcon: { fontSize: 16 },
  featureText: { fontSize: 11, flexShrink: 1 },
});
