import { useState } from "react";
import { 
  useGetTasks, 
  useCreateTask, 
  useUpdateTask, 
  useDeleteTask, 
  useUpdateTaskStatus,
  getGetTasksQueryKey,
  useGetSubjects
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical, Pencil, Trash2, CheckSquare, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isToday } from "date-fns";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subjectId: z.coerce.number().optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["pending", "in_progress", "done"]).default("pending"),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
};

const statusLabels = {
  pending: "To Do",
  in_progress: "In Progress",
  done: "Done"
};

export default function Tasks() {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  
  const { data: subjects } = useGetSubjects();
  
  const queryParams = {
    ...(selectedSubject !== "all" && { subjectId: parseInt(selectedSubject, 10) })
  };
  
  const { data: tasks, isLoading } = useGetTasks(queryParams, {
    query: { queryKey: getGetTasksQueryKey(queryParams) }
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateStatus = useUpdateTaskStatus();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      subjectId: null,
      priority: "medium",
      dueDate: null,
      status: "pending",
    },
  });

  const onSubmit = (values: TaskFormValues) => {
    if (editingId) {
      updateTask.mutate(
        { id: editingId, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
            toast({ title: "Task updated successfully" });
            setIsCreateOpen(false);
            setEditingId(null);
          },
          onError: () => {
            toast({ title: "Failed to update task", variant: "destructive" });
          }
        }
      );
    } else {
      createTask.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
            toast({ title: "Task created successfully" });
            setIsCreateOpen(false);
            form.reset();
          },
          onError: () => {
            toast({ title: "Failed to create task", variant: "destructive" });
          }
        }
      );
    }
  };

  const handleEdit = (task: any) => {
    form.reset({
      title: task.title,
      description: task.description || "",
      subjectId: task.subjectId,
      priority: task.priority as any,
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : null,
      status: task.status as any,
    });
    setEditingId(task.id);
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteTask.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          toast({ title: "Task deleted successfully" });
        },
        onError: () => {
          toast({ title: "Failed to delete task", variant: "destructive" });
        }
      }
    );
  };

  const handleStatusChange = (id: number, status: "pending" | "in_progress" | "done") => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        }
      }
    );
  };

  const filteredTasks = tasks?.filter(task => {
    if (selectedPriority !== "all" && task.priority !== selectedPriority) return false;
    return true;
  }) || [];

  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === "pending"),
    in_progress: filteredTasks.filter(t => t.status === "in_progress"),
    done: filteredTasks.filter(t => t.status === "done"),
  };

  const TaskCard = ({ task }: { task: any }) => {
    const isOverdue = task.dueDate && task.status !== "done" && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
    
    return (
      <Card className={`mb-3 hover:shadow-md transition-shadow group ${task.status === 'done' ? 'opacity-70' : ''}`} data-testid={`card-task-${task.id}`}>
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-2">
            <h4 className={`font-semibold text-sm leading-tight ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-task-menu-${task.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(task)} data-testid={`menu-edit-task-${task.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive" data-testid={`menu-delete-task-${task.id}`}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this task? It will be moved to the Trash.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(task.id)}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        data-testid={`button-confirm-delete-${task.id}`}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`text-[10px] border-0 px-1.5 py-0 rounded ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                {task.priority}
              </Badge>
              {task.subject && (
                <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[80px]">
                  {task.subject.code || task.subject.title}
                </span>
              )}
            </div>
            
            {task.dueDate && (
              <div className={`flex items-center text-[10px] font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Clock className="h-3 w-3 mr-1" />
                {format(new Date(task.dueDate), "MMM d, h:mm a")}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-0 border-t flex">
          <Select 
            value={task.status} 
            onValueChange={(val: any) => handleStatusChange(task.id, val)}
          >
            <SelectTrigger className="w-full h-8 text-xs bg-transparent border-0 rounded-none shadow-none focus:ring-0 focus:ring-offset-0 px-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </CardFooter>
      </Card>
    );
  };

  const Column = ({ title, status, count, children }: { title: string, status: string, count: number, children: React.ReactNode }) => (
    <div className="flex flex-col bg-muted/40 rounded-xl border p-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          {status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-400" />}
          {status === 'in_progress' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
          {status === 'done' && <div className="w-2 h-2 rounded-full bg-green-500" />}
          {title}
        </h3>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">{count}</Badge>
      </div>
      <div className="flex-1 space-y-3 min-h-[150px]">
        {children}
        {count === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg opacity-50">
            <p className="text-xs text-muted-foreground">No tasks here</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-2">Manage your assignments and to-dos.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[140px]" data-testid="select-filter-subject">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects?.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[120px]" data-testid="select-filter-priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingId(null);
              form.reset({ 
                title: "", description: "", subjectId: null, priority: "medium", dueDate: null, status: "pending" 
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-task">
                <Plus className="mr-2 h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">New Task</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Task" : "Create Task"}</DialogTitle>
                <DialogDescription>
                  Add a new assignment or to-do item.
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
                          <Input placeholder="Finish chapter 4 reading..." {...field} data-testid="input-task-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Details about the task..." {...field} className="resize-none h-20" data-testid="input-task-desc" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="subjectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select 
                            value={field.value?.toString() || ""} 
                            onValueChange={(val) => field.onChange(val ? parseInt(val, 10) : null)}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-task-subject">
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">None</SelectItem>
                              {subjects?.map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-task-priority">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} value={field.value || ""} data-testid="input-task-due" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-task-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">To Do</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={createTask.isPending || updateTask.isPending} data-testid="button-save-task">
                      {(createTask.isPending || updateTask.isPending) ? "Saving..." : "Save Task"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6 flex-1 min-h-0">
          <Skeleton className="h-full w-full rounded-xl" />
          <Skeleton className="h-full w-full rounded-xl" />
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      ) : filteredTasks.length === 0 && selectedSubject === "all" && selectedPriority === "all" ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-card border-dashed min-h-[400px]">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckSquare className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No tasks yet</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Keep track of assignments, reading, and deadlines.
          </p>
          <Button 
            className="mt-6" 
            variant="outline"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Task
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 flex-1 min-h-0 overflow-y-auto pb-6">
          <Column title="To Do" status="pending" count={tasksByStatus.pending.length}>
            {tasksByStatus.pending.map(task => <TaskCard key={task.id} task={task} />)}
          </Column>
          
          <Column title="In Progress" status="in_progress" count={tasksByStatus.in_progress.length}>
            {tasksByStatus.in_progress.map(task => <TaskCard key={task.id} task={task} />)}
          </Column>
          
          <Column title="Done" status="done" count={tasksByStatus.done.length}>
            {tasksByStatus.done.map(task => <TaskCard key={task.id} task={task} />)}
          </Column>
        </div>
      )}
    </div>
  );
}
