import { useGetAdminStats, useGetAdminActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Folder, 
  FileText, 
  BookOpen, 
  Mic, 
  CheckSquare, 
  FileBadge,
  Activity,
  ArrowRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: activityData, isLoading: activityLoading } = useGetAdminActivity({ limit: 10 });

  const StatCard = ({ title, value, icon: Icon, colorClass, linkTo }: { title: string, value: number, icon: any, colorClass: string, linkTo?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {statsLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold">{value || 0}</div>
            {linkTo && (
              <Link href={linkTo} className="text-xs text-muted-foreground hover:text-primary flex items-center group">
                View <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground mt-2">System statistics and recent platform activity.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers || 0} 
          icon={Users} 
          colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
          linkTo="/admin/users"
        />
        <StatCard 
          title="Subjects" 
          value={stats?.totalSubjects || 0} 
          icon={Folder} 
          colorClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" 
        />
        <StatCard 
          title="Notes" 
          value={stats?.totalNotes || 0} 
          icon={BookOpen} 
          colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
        />
        <StatCard 
          title="Files" 
          value={stats?.totalFiles || 0} 
          icon={FileText} 
          colorClass="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
        />
        <StatCard 
          title="Tasks" 
          value={stats?.totalTasks || 0} 
          icon={CheckSquare} 
          colorClass="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" 
        />
        <StatCard 
          title="Exams" 
          value={stats?.totalExams || 0} 
          icon={FileBadge} 
          colorClass="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
        />
        <StatCard 
          title="Audio Records" 
          value={stats?.totalAudioRecords || 0} 
          icon={Mic} 
          colorClass="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" 
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>Latest actions performed across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full max-w-[250px]" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : activityData?.logs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity recorded.
            </div>
          ) : (
            <div className="space-y-1">
              {activityData?.logs?.map((log) => (
                <div key={log.id} className="flex items-start gap-4 py-3 border-b last:border-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{log.user?.displayName?.substring(0, 2).toUpperCase() || 'U'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <Link href={`/admin/users/${log.userId}`} className="font-semibold hover:underline">
                        {log.user?.displayName || 'Unknown User'}
                      </Link>
                      {" "}
                      <span className="text-muted-foreground">{log.action.toLowerCase()}</span>
                      {" "}
                      <span className="font-medium">{log.entityType}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "MMM d, h:mm a")}</span>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <>
                          <span className="text-muted-foreground text-xs">•</span>
                          <span className="text-xs text-muted-foreground truncate font-mono bg-muted px-1 rounded">
                            {JSON.stringify(log.details).substring(0, 50)}
                            {JSON.stringify(log.details).length > 50 ? '...' : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
