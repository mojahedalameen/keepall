import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Folder, Calendar, Search } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="border-b border-border py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-semibold text-xl tracking-tight">keepall</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in" className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-10 px-4 py-2">
            Sign In
          </Link>
          <Link href="/sign-up" className="inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto w-full text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground mb-6">
            The academic command center.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Keepall organizes your notes, files, lectures, and tasks into a beautifully structured workspace. Built for serious students who need focus and clarity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up" className="inline-flex items-center justify-center text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 py-2 rounded-md w-full sm:w-auto">
              Start Organizing
            </Link>
          </div>
        </section>

        <section className="py-24 bg-muted px-6 md:px-12 flex-1">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                  <Folder className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Subject Workspaces</h3>
                <p className="text-muted-foreground">Keep every file, note, and task organized by subject and semester. No more lost syllabus PDFs.</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Task Tracking</h3>
                <p className="text-muted-foreground">Never miss an assignment. Track tasks with priorities, statuses, and due dates across all your subjects.</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Global Search</h3>
                <p className="text-muted-foreground">Find exactly what you need, exactly when you need it. Search instantly across all your notes and files.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-6 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} keepall. All rights reserved.</p>
      </footer>
    </div>
  );
}