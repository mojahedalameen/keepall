import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { BookOpen, Folder, Calendar, Search, Settings, Trash2, LogOut, Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BookOpen },
    { name: "Semesters", href: "/semesters", icon: Calendar },
    { name: "Subjects", href: "/subjects", icon: Folder },
    { name: "Notes", href: "/notes", icon: BookOpen },
    { name: "Tasks", href: "/tasks", icon: Calendar },
    { name: "Search", href: "/search", icon: Search },
    { name: "Trash", href: "/trash", icon: Trash2 },
  ];

  const NavLinks = () => (
    <>
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            location.startsWith(item.href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.name}
        </Link>
      ))}
      <div className="flex-1" />
      {user?.publicMetadata?.role === 'admin' && (
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors mt-auto"
        >
          <Shield className="h-4 w-4" />
          Admin
        </Link>
      )}
      <Link
        href="/settings"
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors mt-2 ${
          location === "/settings"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Settings className="h-4 w-4" />
        Settings
      </Link>
      <button
        onClick={() => signOut()}
        className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mt-2 text-left"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">keepall</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-8 px-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold tracking-tight">keepall</span>
            </div>
            <nav className="flex-1 flex flex-col gap-1">
              <NavLinks />
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-8 px-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg tracking-tight">keepall</span>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          <NavLinks />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}