import { useState } from "react";
import { 
  useGetSemesters, 
  useCreateSemester, 
  useUpdateSemester, 
  useDeleteSemester, 
  useActivateSemester,
  getGetSemestersQueryKey,
  getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, MoreVertical, Calendar, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const semesterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(false),
});

type SemesterFormValues = z.infer<typeof semesterSchema>;

export default function Semesters() {
  const { data: semesters, isLoading } = useGetSemesters();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createSemester = useCreateSemester();
  const updateSemester = useUpdateSemester();
  const deleteSemester = useDeleteSemester();
  const activateSemester = useActivateSemester();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<SemesterFormValues>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      title: "",
      startDate: "",
      endDate: "",
      isActive: false,
    },
  });

  const onSubmit = (values: SemesterFormValues) => {
    if (editingId) {
      updateSemester.mutate(
        { id: editingId, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetSemestersQueryKey() });
            toast({ title: "Semester updated successfully" });
            setIsCreateOpen(false);
            setEditingId(null);
          },
          onError: (error) => {
            toast({ title: "Failed to update semester", variant: "destructive" });
          }
        }
      );
    } else {
      createSemester.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetSemestersQueryKey() });
            toast({ title: "Semester created successfully" });
            setIsCreateOpen(false);
            form.reset();
          },
          onError: (error) => {
            toast({ title: "Failed to create semester", variant: "destructive" });
          }
        }
      );
    }
  };

  const handleEdit = (semester: any) => {
    form.reset({
      title: semester.title,
      startDate: semester.startDate ? format(new Date(semester.startDate), "yyyy-MM-dd") : "",
      endDate: semester.endDate ? format(new Date(semester.endDate), "yyyy-MM-dd") : "",
      isActive: semester.isActive,
    });
    setEditingId(semester.id);
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteSemester.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSemestersQueryKey() });
          toast({ title: "Semester deleted successfully" });
        },
        onError: () => {
          toast({ title: "Failed to delete semester", variant: "destructive" });
        }
      }
    );
  };

  const handleActivate = (id: number) => {
    activateSemester.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSemestersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          toast({ title: "Semester activated successfully" });
        },
        onError: () => {
          toast({ title: "Failed to activate semester", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Semesters</h1>
          <p className="text-muted-foreground mt-2">Manage your academic terms and set the active context.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingId(null);
            form.reset({ title: "", startDate: "", endDate: "", isActive: false });
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-semester">
              <Plus className="mr-2 h-4 w-4" />
              New Semester
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Semester" : "Create Semester"}</DialogTitle>
              <DialogDescription>
                Set up a new academic term to group your subjects.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Fall 2024" {...field} data-testid="input-semester-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-semester-start" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-semester-end" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {!editingId && (
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Set as Active
                          </FormLabel>
                          <FormDescription>
                            Make this your current working semester.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-semester-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                <DialogFooter>
                  <Button type="submit" disabled={createSemester.isPending || updateSemester.isPending} data-testid="button-save-semester">
                    {(createSemester.isPending || updateSemester.isPending) ? "Saving..." : "Save Semester"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      ) : semesters?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-card border-dashed">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No semesters yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">Create your first semester to start organizing your subjects, notes, and tasks.</p>
          <Button 
            className="mt-6" 
            variant="outline"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Semester
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {semesters?.map(semester => (
            <Card key={semester.id} className={`flex flex-col relative overflow-hidden transition-all duration-200 hover:shadow-md ${semester.isActive ? 'border-primary shadow-sm' : ''}`} data-testid={`card-semester-${semester.id}`}>
              {semester.isActive && (
                <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
              )}
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{semester.title}</CardTitle>
                    {semester.isActive && (
                      <div className="flex items-center text-xs font-medium text-primary mt-1">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active Semester
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mt-2 -mr-2" data-testid={`button-semester-menu-${semester.id}`}>
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(semester)} data-testid={`menu-edit-semester-${semester.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit details
                      </DropdownMenuItem>
                      {!semester.isActive && (
                        <DropdownMenuItem onClick={() => handleActivate(semester.id)} data-testid={`menu-activate-semester-${semester.id}`}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Set as active
                        </DropdownMenuItem>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive" data-testid={`menu-delete-semester-${semester.id}`}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Semester</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this semester? This will soft-delete all associated subjects, notes, files, and tasks. You can restore them from the Trash.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(semester.id)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              data-testid={`button-confirm-delete-${semester.id}`}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 opacity-70" />
                    <span>
                      {semester.startDate ? format(new Date(semester.startDate), "MMM d, yyyy") : "No start date"}
                      {" - "}
                      {semester.endDate ? format(new Date(semester.endDate), "MMM d, yyyy") : "No end date"}
                    </span>
                  </div>
                </div>
              </CardContent>
              {!semester.isActive && (
                <CardFooter className="pt-0">
                  <Button 
                    variant="secondary" 
                    className="w-full text-sm" 
                    onClick={() => handleActivate(semester.id)}
                    disabled={activateSemester.isPending}
                    data-testid={`button-set-active-${semester.id}`}
                  >
                    Set as Active
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}