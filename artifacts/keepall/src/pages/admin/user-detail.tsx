import { 
  useGetAdminUser, 
  useAdminToggleUserActive,
  getGetAdminUserQueryKey,
  getGetAdminUsersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UserCircle, 
  ArrowLeft, 
  Ban, 
  CheckCircle,
  Folder,
  BookOpen,
  FileText,
  CheckSquare,
  Calendar,
  Mail
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AdminUserDetail() {
  const params = useParams();
  const userId = parseInt(params.userId || "0", 10);
  
  const { data, isLoading } = useGetAdminUser(userId, { 
    query: { enabled: !!userId, queryKey: getGetAdminUserQueryKey(userId) } 
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const toggleActive = useAdminToggleUserActive();

  const handleToggleActive = () => {
    if (!data?.user) return;
    
    toggleActive.mutate(
      { id: userId, data: { isActive: !data.user.isActive } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminUserQueryKey(userId) });
          queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() }); // Invalidate list too
          toast({ title: `User ${!data.user.isActive ? 'activated' : 'deactivated'} successfully` });
        },
        onError: () => {
          toast({ title: "Failed to update user status", variant: "destructive" });
        }
      }
    );
  };

  const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: any, colorClass: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value || 0}</div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-bold mb-2">User not found</h2>
        <p className="text-muted-foreground mb-6">The user you're looking for doesn't exist or has been permanently deleted.</p>
        <Link href="/admin/users">
          <Button><ArrowLeft className="mr-2 h-4 w-4" /> Back to Users</Button>
        </Link>
      </div>
    );
  }

  const { user, stats } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
      </div>
      
      <Card className="overflow-hidden border-t-4" style={{ borderTopColor: user.isActive ? 'var(--primary)' : 'var(--destructive)' }}>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border-4 border-background shadow-sm">
                <span className="text-2xl sm:text-3xl font-bold text-primary">{user.displayName?.substring(0, 2).toUpperCase() || 'U'}</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{user.displayName || 'Unknown User'}</h2>
                <div className="flex items-center text-muted-foreground gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  {user.email || 'No email provided'}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Badge variant={user.isActive ? "default" : "destructive"} className={user.isActive ? "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-0 dark:text-green-400" : ""}>
                    {user.isActive ? "Active Account" : "Deactivated Account"}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    ID: {user.id}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
              <Button 
                variant={user.isActive ? "destructive" : "default"}
                className={!user.isActive ? "bg-green-600 hover:bg-green-700 text-white w-full" : "w-full"}
                onClick={handleToggleActive}
                disabled={toggleActive.isPending}
                data-testid="button-toggle-status"
              >
                {toggleActive.isPending ? (
                  "Updating..."
                ) : user.isActive ? (
                  <><Ban className="mr-2 h-4 w-4" /> Deactivate User</>
                ) : (
                  <><CheckCircle className="mr-2 h-4 w-4" /> Activate User</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center sm:text-right max-w-[200px]">
                {user.isActive 
                  ? "Deactivated users cannot access the platform."
                  : "Activating restores full platform access."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-semibold mb-4">Content Statistics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Subjects" 
            value={stats.subjects} 
            icon={Folder} 
            colorClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" 
          />
          <StatCard 
            title="Notes" 
            value={stats.notes} 
            icon={BookOpen} 
            colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
          />
          <StatCard 
            title="Files" 
            value={stats.files} 
            icon={FileText} 
            colorClass="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
          />
          <StatCard 
            title="Tasks" 
            value={stats.tasks} 
            icon={CheckSquare} 
            colorClass="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" 
          />
        </div>
      </div>
      
      {/* We could add a list of recent user activity here if the API supported it for a specific user */}
    </div>
  );
}