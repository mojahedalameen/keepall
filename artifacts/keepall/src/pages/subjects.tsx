import { useState } from "react";
import { 
  useGetSubjects, 
  useGetSemesters,
  useCreateSubject, 
  useUpdateSubject, 
  useDeleteSubject, 
  getGetSubjectsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical, Folder, Pencil, Trash2, Filter } from "lucide-react";
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

const subjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string().optional(),
  instructor: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  semesterId: z.coerce.number().optional().nullable(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

const PRESET_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#6366f1", "#ec4899", "#f43f5e", "#14b8a6", "#f97316"
];

export default function Subjects() {
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  
  const { data: semesters } = useGetSemesters();
  
  const queryParams = selectedSemester !== "all" ? { semesterId: parseInt(selectedSemester, 10) } : {};
  const { data: subjects, isLoading } = useGetSubjects(queryParams, {
    query: { queryKey: getGetSubjectsQueryKey(queryParams) }
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      title: "",
      code: "",
      instructor: "",
      description: "",
      color: PRESET_COLORS[0],
      semesterId: null,
    },
  });

  const onSubmit = (values: SubjectFormValues) => {
    if (editingId) {
      updateSubject.mutate(
        { id: editingId, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetSubjectsQueryKey() });
            toast({ title: "Subject updated successfully" });
            setIsCreateOpen(false);
            setEditingId(null);
          },
          onError: () => {
            toast({ title: "Failed to update subject", variant: "destructive" });
          }
        }
      );
    } else {
      createSubject.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetSubjectsQueryKey() });
            toast({ title: "Subject created successfully" });
            setIsCreateOpen(false);
            form.reset();
          },
          onError: () => {
            toast({ title: "Failed to create subject", variant: "destructive" });
          }
        }
      );
    }
  };

  const handleEdit = (subject: any) => {
    form.reset({
      title: subject.title,
      code: subject.code || "",
      instructor: subject.instructor || "",
      description: subject.description || "",
      color: subject.color || PRESET_COLORS[0],
      semesterId: subject.semesterId,
    });
    setEditingId(subject.id);
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteSubject.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSubjectsQueryKey() });
          toast({ title: "Subject deleted successfully" });
        },
        onError: () => {
          toast({ title: "Failed to delete subject", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-2">Manage your courses and workspaces.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 max-w-[200px] w-full">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-full" data-testid="select-semester-filter">
                <SelectValue placeholder="Filter by semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters?.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingId(null);
              form.reset({ 
                title: "", code: "", instructor: "", description: "", color: PRESET_COLORS[0], 
                semesterId: semesters?.find(s => s.isActive)?.id || null
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-subject">
                <Plus className="mr-2 h-4 w-4" />
                New Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Subject" : "Create Subject"}</DialogTitle>
                <DialogDescription>
                  Define a new workspace for your course materials.
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
                          <Input placeholder="Introduction to Computer Science" {...field} data-testid="input-subject-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Code</FormLabel>
                          <FormControl>
                            <Input placeholder="CS101" {...field} data-testid="input-subject-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="semesterId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester</FormLabel>
                          <Select 
                            value={field.value?.toString() || ""} 
                            onValueChange={(val) => field.onChange(val ? parseInt(val, 10) : null)}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-subject-semester">
                                <SelectValue placeholder="Select semester" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {semesters?.map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="instructor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructor</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Smith" {...field} data-testid="input-subject-instructor" />
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
                          <Textarea placeholder="Brief description of the course..." {...field} className="resize-none" data-testid="input-subject-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Label</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {PRESET_COLORS.map(color => (
                              <button
                                key={color}
                                type="button"
                                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${field.value === color ? 'ring-2 ring-ring ring-offset-2 scale-110' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => field.onChange(color)}
                                data-testid={`color-picker-${color}`}
                                aria-label={`Select color ${color}`}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={createSubject.isPending || updateSubject.isPending} data-testid="button-save-subject">
                      {(createSubject.isPending || updateSubject.isPending) ? "Saving..." : "Save Subject"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      ) : subjects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-card border-dashed">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Folder className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No subjects found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            {selectedSemester !== "all" 
              ? "There are no subjects in this semester. Try changing the filter."
              : "Create your first subject to start organizing materials."}
          </p>
          {selectedSemester === "all" && (
            <Button 
              className="mt-6" 
              variant="outline"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Subject
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subjects?.map(subject => (
            <div key={subject.id} className="group relative flex flex-col border bg-card rounded-xl overflow-hidden hover:shadow-md transition-all" data-testid={`card-subject-${subject.id}`}>
              <div className="h-2 w-full" style={{ backgroundColor: subject.color || PRESET_COLORS[0] }} />
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
                    <span className="font-bold text-foreground text-sm">
                      {subject.code ? subject.code.substring(0, 4) : subject.title.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 -mt-2 -mr-2" data-testid={`button-subject-menu-${subject.id}`}>
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(subject)} data-testid={`menu-edit-subject-${subject.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive" data-testid={`menu-delete-subject-${subject.id}`}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this subject? All notes, files, and tasks will be moved to Trash.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(subject.id)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              data-testid={`button-confirm-delete-${subject.id}`}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <Link href={`/subjects/${subject.id}`} className="flex-1 group/link">
                  <h3 className="font-semibold text-lg leading-tight mb-1 group-hover/link:text-primary transition-colors line-clamp-2">
                    {subject.title}
                  </h3>
                  {subject.code && (
                    <p className="text-sm font-medium text-muted-foreground mb-3">{subject.code}</p>
                  )}
                  {subject.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 opacity-80">
                      {subject.description}
                    </p>
                  )}
                </Link>
                
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{subject.instructor || "No instructor"}</span>
                  {semesters?.find(s => s.id === subject.semesterId)?.title && (
                    <span className="px-2 py-1 bg-muted rounded-md font-medium">
                      {semesters?.find(s => s.id === subject.semesterId)?.title}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}