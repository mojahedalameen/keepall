import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { Shield, Users, Activity, ArrowLeft, LogOut } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Activity },
    { name: "Users", href: "/admin/users", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-slate-50 dark:bg-slate-900 p-4">
        <div className="flex items-center gap-2 mb-8 px-3">
          <Shield className="h-6 w-6 text-amber-600" />
          <span className="font-semibold text-lg tracking-tight">Admin</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
          
          <div className="h-px bg-border my-2" />
          
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                location === item.href || (location.startsWith(item.href) && item.href !== '/admin')
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
          
          <div className="flex-1" />
          
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}