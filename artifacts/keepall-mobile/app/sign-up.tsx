import { useSignUp } from "@clerk/expo";
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

function getPasswordStrength(pwd: string): 0 | 1 | 2 | 3 {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.max(1, Math.min(score, 3)) as 1 | 2 | 3;
}

const STRENGTH_CONFIG = [
  { color: "#EF4444", key: "passwordWeak" as const },
  { color: "#F59E0B", key: "passwordFair" as const },
  { color: "#10B981", key: "passwordStrong" as const },
];

const FEATURES = [
  { icon: "📚", key: "feature1" as const },
  { icon: "✅", key: "feature2" as const },
  { icon: "🔍", key: "feature3" as const },
];

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const lang = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const isReady = fetchStatus !== "fetching";
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const strength = getPasswordStrength(password);

  const onSignUp = async () => {
    if (!isReady || loading) return;
    if (password !== confirmPassword) { setError(lang.t("passwordsNoMatch")); return; }
    setError("");
    setLoading(true);
    try {
      const { error: createErr } = await signUp.create({ emailAddress: email.trim(), password });
      if (createErr) { setError(createErr.message ?? "Sign up failed."); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      const { error: sendErr } = await signUp.verifications.sendEmailCode();
      if (sendErr) { setError(sendErr.message ?? "Failed to send code."); return; }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPending(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!isReady || loading) return;
    setError("");
    setLoading(true);
    try {
      const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyErr) { setError(verifyErr.message ?? "Verification failed."); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      if (signUp.status === "complete") {
        const { error: finalizeErr } = await signUp.finalize();
        if (finalizeErr) { setError(finalizeErr.message ?? "Failed to complete sign-up."); return; }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#9333EA" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#9333EA", "#7C3AED"]}
          style={[styles.hero, { paddingTop: insets.top + 44 }]}
        >
          <View style={styles.logoCircle}>
            <Text style={[styles.logoText, { fontFamily: lang.fontB }]}>k</Text>
          </View>
          <Text style={[styles.heroTitle, { fontFamily: lang.fontB }]}>
            {pending ? lang.t("checkEmail") : lang.t("joinKeepal")}
          </Text>
          <Text style={[styles.heroSub, { fontFamily: lang.fontR }]}>
            {pending ? `${lang.t("codeSentTo")} ${email}` : lang.t("appTagline")}
          </Text>
        </LinearGradient>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {pending ? (
            <View style={styles.cardTop}>
              <Text style={[styles.heading, { color: colors.foreground, fontFamily: lang.fontB }]}>
                {lang.t("enterCode")}
              </Text>
              <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
                {lang.t("sixDigitCode")}
              </Text>
              {!!error && <ErrorBox error={error} colors={colors} fontFamily={lang.fontM} />}
              <View style={[styles.inputRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Feather name="hash" size={17} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.codeInput, { color: colors.foreground, fontFamily: lang.fontB }]}
                  value={code} onChangeText={setCode} placeholder="000000"
                  placeholderTextColor={colors.mutedForeground} keyboardType="number-pad"
                  returnKeyType="done" onSubmitEditing={onVerify} autoFocus
                />
              </View>
              <Pressable style={({ pressed }) => [styles.button, { opacity: (loading || pressed) ? 0.8 : 1 }]} onPress={onVerify} disabled={loading}>
                <LinearGradient colors={["#7C3AED", "#9333EA"]} style={styles.buttonGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <Text style={[styles.buttonText, { fontFamily: lang.fontSB }]}>{lang.t("verifyBtn")}</Text>
                  )}
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => { setPending(false); setCode(""); setError(""); }} style={styles.backBtn}>
                <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                <Text style={[styles.backText, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
                  {lang.t("changeEmail")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.cardTop}>
                <Text style={[styles.heading, { color: colors.foreground, fontFamily: lang.fontB }]}>
                  {lang.t("createAccount")}
                </Text>
                <Text style={[styles.sub, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
                  {lang.t("freeToStart")}
                </Text>
                {!!error && <ErrorBox error={error} colors={colors} fontFamily={lang.fontM} />}

                <View style={[styles.inputRow, { backgroundColor: colors.input, borderColor: emailFocused ? colors.primary : colors.border }]}>
                  <Feather name="mail" size={17} color={emailFocused ? colors.primary : colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground, fontFamily: lang.fontR }]}
                    value={email} onChangeText={setEmail} placeholder={lang.t("emailAddress")}
                    placeholderTextColor={colors.mutedForeground} keyboardType="email-address"
                    autoCapitalize="none" autoCorrect={false} returnKeyType="next"
                    onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)}
                  />
                </View>

                <View style={[styles.inputRow, { backgroundColor: colors.input, borderColor: passFocused ? colors.primary : colors.border }]}>
                  <Feather name="lock" size={17} color={passFocused ? colors.primary : colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground, fontFamily: lang.fontR }]}
                    value={password} onChangeText={setPassword} placeholder={lang.t("password")}
                    placeholderTextColor={colors.mutedForeground} secureTextEntry={!showPassword}
                    returnKeyType="next" onFocus={() => setPassFocused(true)} onBlur={() => setPassFocused(false)}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>

                {password.length > 0 && (
                  <View style={{ marginBottom: 14, marginTop: -6 }}>
                    <View style={{ flexDirection: "row", gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3].map((i) => (
                        <View key={i} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          backgroundColor: i <= strength ? STRENGTH_CONFIG[strength - 1]?.color ?? "#E5E7EB" : "#E5E7EB",
                        }} />
                      ))}
                    </View>
                    <Text style={{ color: STRENGTH_CONFIG[strength - 1]?.color ?? "#9CA3AF", fontSize: 11, fontFamily: lang.fontM }}>
                      {lang.t(STRENGTH_CONFIG[strength - 1]?.key ?? "passwordWeak")}
                    </Text>
                  </View>
                )}

                <View style={[styles.inputRow, {
                  backgroundColor: colors.input,
                  borderColor: passwordMismatch ? colors.destructive : confirmFocused ? colors.primary : colors.border,
                  marginBottom: passwordMismatch ? 6 : 14,
                }]}>
                  <Feather name={passwordMismatch ? "x-circle" : "check"} size={17}
                    color={passwordMismatch ? colors.destructive : confirmFocused ? colors.primary : colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground, fontFamily: lang.fontR }]}
                    value={confirmPassword} onChangeText={setConfirmPassword}
                    placeholder={lang.t("confirmPassword")} placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={!showConfirm} returnKeyType="done" onSubmitEditing={onSignUp}
                    onFocus={() => setConfirmFocused(true)} onBlur={() => setConfirmFocused(false)}
                  />
                  <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={12}>
                    <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                {passwordMismatch && (
                  <Text style={{ color: colors.destructive, fontSize: 12, fontFamily: lang.fontM, marginBottom: 14, marginTop: -4 }}>
                    {lang.t("passwordsNoMatch")}
                  </Text>
                )}

                <Pressable style={({ pressed }) => [styles.button, { opacity: (!isReady || loading || pressed) ? 0.8 : 1, marginTop: 4 }]} onPress={onSignUp} disabled={!isReady || loading}>
                  <LinearGradient colors={["#7C3AED", "#9333EA"]} style={styles.buttonGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : (
                      <Text style={[styles.buttonText, { fontFamily: lang.fontSB }]}>{lang.t("createAccountBtn")}</Text>
                    )}
                  </LinearGradient>
                </Pressable>
                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: lang.fontR }]}>
                    {lang.t("alreadyHaveAccount")}{" "}
                  </Text>
                  <Link href="/sign-in" asChild>
                    <Pressable>
                      <Text style={[styles.footerLink, { color: colors.primary, fontFamily: lang.fontB }]}>
                        {lang.t("signInLink")}
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              </View>

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
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ErrorBox({ error, colors, fontFamily }: { error: string; colors: ReturnType<typeof import("@/hooks/useColors").useColors>; fontFamily: string }) {
  return (
    <View style={[errS.box, { backgroundColor: colors.destructive + "15" }]}>
      <Feather name="alert-circle" size={14} color={colors.destructive} />
      <Text style={[errS.text, { color: colors.destructive, fontFamily }]}>{error}</Text>
    </View>
  );
}
const errS = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 14, marginBottom: 16 },
  text: { fontSize: 14, flex: 1 },
});

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingBottom: 52, paddingHorizontal: 24 },
  logoCircle: { width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  logoText: { color: "#fff", fontSize: 36 },
  heroTitle: { color: "#fff", fontSize: 26, marginBottom: 8, textAlign: "center" },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center" },
  card: { borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -28, flexGrow: 1, justifyContent: "space-between" },
  cardTop: { paddingHorizontal: 28, paddingTop: 36 },
  heading: { fontSize: 24, marginBottom: 6 },
  sub: { fontSize: 14, marginBottom: 28 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, marginBottom: 14, gap: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 15 },
  codeInput: { flex: 1, paddingVertical: 16, fontSize: 24, letterSpacing: 10 },
  button: { borderRadius: 16, overflow: "hidden" },
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
