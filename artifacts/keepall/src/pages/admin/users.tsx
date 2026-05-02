import { useState } from "react";
import { 
  useGetAdminUsers, 
  useAdminToggleUserActive,
  getGetAdminUsersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Shield, ArrowLeft, ArrowRight, MoreHorizontal, Ban, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const { data, isLoading } = useGetAdminUsers({ page, limit }, {
    query: { queryKey: getGetAdminUsersQueryKey({ page, limit }) }
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const toggleActive = useAdminToggleUserActive();

  const handleToggleActive = (userId: number, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    toggleActive.mutate(
      { id: userId, data: { isActive: !currentStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey({ page, limit }) });
          toast({ title: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully` });
        },
        onError: () => {
          toast({ title: "Failed to update user status", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage platform users and their access. {data?.total ? `Total: ${data.total}` : ''}
          </p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.users.map((user) => (
                    <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 w-full block">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            {user.clerkId ? (
                              <span className="text-xs font-bold text-primary">{user.displayName?.substring(0, 2).toUpperCase() || 'U'}</span>
                            ) : (
                              <UserCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium truncate">{user.displayName || 'Unknown User'}</span>
                            <span className="text-xs text-muted-foreground">ID: {user.id}</span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/users/${user.id}`} className="w-full block">
                          {user.email || 'No email'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/users/${user.id}`} className="w-full block">
                          <Badge variant={user.isActive ? "default" : "destructive"} className={user.isActive ? "bg-green-500/10 text-green-700 hover:bg-green-500/20 border-0 dark:text-green-400" : ""}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        <Link href={`/admin/users/${user.id}`} className="w-full block">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" data-testid={`menu-user-${user.id}`}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}`} className="cursor-pointer w-full">
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => handleToggleActive(user.id, user.isActive, e)}
                              className={user.isActive ? "text-destructive focus:text-destructive" : "text-green-600 focus:text-green-600"}
                            >
                              {user.isActive ? (
                                <><Ban className="mr-2 h-4 w-4" /> Deactivate User</>
                              ) : (
                                <><CheckCircle className="mr-2 h-4 w-4" /> Activate User</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {!isLoading && data && data.pages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground px-4">
            Page {page} of {data.pages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Need to import Users icon since it wasn't in the original imports
import { Users } from "lucide-react";