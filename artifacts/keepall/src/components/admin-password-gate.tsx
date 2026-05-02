import { useState } from "react";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAdminKey } from "@workspace/api-client-react";

const SESSION_KEY = "keepall_admin_auth";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "";

export function isAdminUnlocked(): boolean {
  const ok = sessionStorage.getItem(SESSION_KEY) === "1";
  if (ok) setAdminKey(ADMIN_PASSWORD);
  return ok;
}

export function lockAdmin(): void {
  sessionStorage.removeItem(SESSION_KEY);
  setAdminKey(null);
}

interface AdminPasswordGateProps {
  children: React.ReactNode;
}

export default function AdminPasswordGate({ children }: AdminPasswordGateProps) {
  const [unlocked, setUnlocked] = useState(isAdminUnlocked);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAdminKey(ADMIN_PASSWORD);
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
            <Shield className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Access</h1>
          <p className="text-sm text-muted-foreground">Enter the admin password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoFocus
                className="pl-9"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">Incorrect password. Please try again.</p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Unlock Dashboard
          </Button>
        </form>
      </div>
    </div>
  );
}
