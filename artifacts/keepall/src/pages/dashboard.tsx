import { useGetDashboardStats, useGetDashboardUpcoming, useGetDashboardRecentFiles, useGetDashboardRecentNotes } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, FileText, CheckSquare, BookOpen, Clock } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: upcoming, isLoading: upcomingLoading } = useGetDashboardUpcoming();
  const { data: recentFiles, isLoading: filesLoading } = useGetDashboardRecentFiles();
  const { data: recentNotes, isLoading: notesLoading } = useGetDashboardRecentNotes();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {stats?.activeSemester ? (
          <p className="text-muted-foreground mt-2">Active Semester: {stats.activeSemester.title}</p>
        ) : (
          <p className="text-muted-foreground mt-2">Welcome back. Get started by creating a semester.</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats?.totalSubjects || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats?.totalNotes || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats?.totalFiles || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats?.pendingTasks || 0}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : upcoming?.tasks.length === 0 && upcoming?.reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming tasks or reminders.</p>
              ) : (
                <>
                  {upcoming?.tasks.map((task) => (
                    <div key={`task-${task.id}`} className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
                      <CheckSquare className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">{task.title}</p>
                        {task.dueDate && <p className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  ))}
                  {upcoming?.reminders.map((reminder) => (
                    <div key={`reminder-${reminder.id}`} className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
                      <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">{reminder.title}</p>
                        <p className="text-xs text-muted-foreground">Remind: {new Date(reminder.remindAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Notes</CardTitle>
            <Link href="/notes" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {notesLoading ? (
                 <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : recentNotes?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent notes.</p>
              ) : (
                recentNotes?.map((note) => (
                  <Link key={note.id} href={`/notes?id=${note.id}`} className="block p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
                    <p className="text-sm font-medium leading-none truncate mb-1">{note.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{note.content?.substring(0, 50) || "No content"}</p>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Files</CardTitle>
            <Link href="/search?type=files" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filesLoading ? (
                 <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : recentFiles?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent files.</p>
              ) : (
                recentFiles?.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.fileType}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}