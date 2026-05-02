import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetSubject, getGetSubjectQueryKey,
  useGetSubjectStats, getGetSubjectStatsQueryKey,
  useGetLectures, getGetLecturesQueryKey, useCreateLecture, useUpdateLecture, useDeleteLecture,
  useGetNotes, getGetNotesQueryKey, useCreateNote, useUpdateNote, useDeleteNote, useToggleNotePin,
  useGetFiles, getGetFilesQueryKey, useCreateFileRecord, useUpdateFile, useDeleteFile,
  useGetAudioRecords, getGetAudioRecordsQueryKey, useCreateAudioRecord, useUpdateAudioRecord, useDeleteAudioRecord,
  useGetExams, getGetExamsQueryKey, useCreateExam, useUpdateExam, useDeleteExam,
  useGetTasks, getGetTasksQueryKey, useCreateTask, useUpdateTask, useDeleteTask, useUpdateTaskStatus,
  useGetReminders, getGetRemindersQueryKey, useCreateReminder, useUpdateReminder, useDeleteReminder
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Folder, BookOpen, FileText, Mic, FileBadge, CheckSquare, Clock, 
  Plus, MoreVertical, Pencil, Trash2, ArrowLeft, Calendar as CalendarIcon, 
  Pin, Upload, PlayCircle, AlertCircle, ExternalLink
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function SubjectDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: subject, isLoading: isSubjectLoading } = useGetSubject(id, { 
    query: { enabled: !!id, queryKey: getGetSubjectQueryKey(id) } 
  });
  
  const { data: stats, isLoading: isStatsLoading } = useGetSubjectStats(id, {
    query: { enabled: !!id, queryKey: getGetSubjectStatsQueryKey(id) }
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isSubjectLoading || isStatsLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl md:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Folder className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Subject not found</h2>
        <p className="text-muted-foreground mb-6">The subject you're looking for doesn't exist or has been deleted.</p>
        <Link href="/subjects">
          <Button><ArrowLeft className="mr-2 h-4 w-4" /> Back to Subjects</Button>
        </Link>
      </div>
    );
  }

  const StatBox = ({ label, value, icon: Icon }: { label: string, value: number, icon: any }) => (
    <div className="flex flex-col items-center p-3 bg-card border rounded-lg">
      <Icon className="h-5 w-5 text-muted-foreground mb-1" />
      <span className="text-xl font-bold">{value || 0}</span>
      <span className="text-xs text-muted-foreground capitalize">{label}</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/subjects">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: subject.color || 'var(--primary)' }} />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{subject.title}</h1>
          {subject.code && <Badge variant="secondary" className="text-sm">{subject.code}</Badge>}
        </div>
      </div>

      <Card className="overflow-hidden border-t-4" style={{ borderTopColor: subject.color || 'var(--primary)' }}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8 justify-between">
            <div className="space-y-4 max-w-2xl">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Folder className="h-5 w-5 text-muted-foreground" /> 
                  Subject Details
                </h3>
                <p className="text-muted-foreground mt-2">
                  {subject.description || "No description provided for this subject."}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {subject.instructor || "No instructor assigned"}</span>
                {subject.semester && <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" /> {subject.semester.title}</span>}
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 shrink-0">
              <StatBox label="Lectures" value={stats?.lectures || 0} icon={BookOpen} />
              <StatBox label="Notes" value={stats?.notes || 0} icon={FileText} />
              <StatBox label="Files" value={stats?.files || 0} icon={Folder} />
              <StatBox label="Audio" value={stats?.audio || 0} icon={Mic} />
              <StatBox label="Exams" value={stats?.exams || 0} icon={FileBadge} />
              <StatBox label="Tasks" value={stats?.tasks || 0} icon={CheckSquare} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-full justify-start inline-flex min-w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lectures">Lectures</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="overview">
            <OverviewTab subjectId={subject.id} stats={stats} color={subject.color} />
          </TabsContent>
          <TabsContent value="lectures">
            <LecturesTab subjectId={subject.id} />
          </TabsContent>
          <TabsContent value="notes">
            <NotesTab subjectId={subject.id} color={subject.color} />
          </TabsContent>
          <TabsContent value="files">
            <FilesTab subjectId={subject.id} />
          </TabsContent>
          <TabsContent value="audio">
            <AudioTab subjectId={subject.id} />
          </TabsContent>
          <TabsContent value="exams">
            <ExamsTab subjectId={subject.id} />
          </TabsContent>
          <TabsContent value="tasks">
            <TasksTab subjectId={subject.id} />
          </TabsContent>
          <TabsContent value="reminders">
            <RemindersTab subjectId={subject.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// --- SUB-COMPONENTS FOR TABS ---

function OverviewTab({ subjectId, stats, color }: { subjectId: number, stats: any, color?: string }) {
  const { data: recentNotes, isLoading: notesLoading } = useGetNotes({ subjectId }, { query: { queryKey: getGetNotesQueryKey({ subjectId }) } });
  const { data: upcomingTasks, isLoading: tasksLoading } = useGetTasks({ subjectId, status: 'pending' }, { query: { queryKey: getGetTasksQueryKey({ subjectId, status: 'pending' }) } });
  
  const notes = recentNotes?.slice(0, 4) || [];
  const tasks = upcomingTasks?.slice(0, 5) || [];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Notes</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {notesLoading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">No notes for this subject yet.</p>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors flex flex-col gap-1 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color || 'var(--primary)' }} />
                  <div className="flex items-start justify-between pl-2">
                    <h4 className="text-sm font-medium line-clamp-1">{note.title}</h4>
                    {note.isPinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 pl-2">{note.content || 'No content'}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Tasks</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">All caught up! No pending tasks.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors flex items-start gap-3">
                  <div className={`mt-0.5 h-4 w-4 rounded border ${
                    task.priority === 'high' ? 'border-red-500 bg-red-500/10' : 
                    task.priority === 'medium' ? 'border-amber-500 bg-amber-500/10' : 
                    'border-green-500 bg-green-500/10'
                  }`} />
                  <div>
                    <h4 className="text-sm font-medium line-clamp-1">{task.title}</h4>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(task.dueDate), "MMM d, h:mm a")}
                      </p>
                    )}
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

const lectureSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  summary: z.string().optional(),
});

function LecturesTab({ subjectId }: { subjectId: number }) {
  const { data: lectures, isLoading } = useGetLectures({ subjectId }, { query: { queryKey: getGetLecturesQueryKey({ subjectId }) } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createLecture = useCreateLecture();
  const updateLecture = useUpdateLecture();
  const deleteLecture = useDeleteLecture();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof lectureSchema>>({
    resolver: zodResolver(lectureSchema),
    defaultValues: { title: "", date: "", summary: "" }
  });

  const onSubmit = (values: z.infer<typeof lectureSchema>) => {
    if (editingId) {
      updateLecture.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLecturesQueryKey({ subjectId }) });
          toast({ title: "Lecture updated" });
          setIsOpen(false);
          setEditingId(null);
        }
      });
    } else {
      createLecture.mutate({ data: { ...values, subjectId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLecturesQueryKey({ subjectId }) });
          queryClient.invalidateQueries({ queryKey: getGetSubjectStatsQueryKey(subjectId) });
          toast({ title: "Lecture created" });
          setIsOpen(false);
          form.reset();
        }
      });
    }
  };

  const handleEdit = (lecture: any) => {
    form.reset({
      title: lecture.title,
      date: format(new Date(lecture.date), "yyyy-MM-dd"),
      summary: lecture.summary || ""
    });
    setEditingId(lecture.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteLecture.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLecturesQueryKey({ subjectId }) });
        queryClient.invalidateQueries({ queryKey: getGetSubjectStatsQueryKey(subjectId) });
        toast({ title: "Lecture deleted" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) { setEditingId(null); form.reset({ title: "", date: "", summary: "" }); }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Lecture</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Lecture" : "Add Lecture"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="summary" render={({ field }) => (
                  <FormItem><FormLabel>Summary</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={createLecture.isPending || updateLecture.isPending}>Save</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
      ) : lectures?.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-card border-dashed">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No lectures added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lectures?.map(lecture => (
            <Card key={lecture.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-lg">{lecture.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {format(new Date(lecture.date), "MMM d, yyyy")}</span>
                  </div>
                  {lecture.summary && <p className="text-sm mt-2 text-muted-foreground">{lecture.summary}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(lecture)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive"><Trash2 className="h-3 w-3 mr-1" /> Delete</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete Lecture</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(lecture.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesTab({ subjectId, color }: { subjectId: number, color?: string }) {
  const { data: notes, isLoading } = useGetNotes({ subjectId }, { query: { queryKey: getGetNotesQueryKey({ subjectId }) } });
  
  if (isLoading) return <div className="grid md:grid-cols-3 gap-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  if (notes?.length === 0) return (
    <div className="text-center py-12 border rounded-xl bg-card border-dashed">
      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
      <p className="text-muted-foreground mb-4">No notes for this subject.</p>
      <Link href="/notes"><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Go to Notes to create one</Button></Link>
    </div>
  );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {notes?.map(note => (
        <Card key={note.id} className="flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: color || 'var(--primary)' }} />
          <CardHeader className="pb-2 pt-4 pl-5">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base line-clamp-1" title={note.title}>{note.title}</CardTitle>
              {note.isPinned && <Pin className="h-3 w-3 text-primary mr-1 fill-primary" />}
            </div>
            <div className="text-xs text-muted-foreground">{format(new Date(note.createdAt), "MMM d, yyyy")}</div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pl-5">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
              {note.content || <span className="italic opacity-50">No content</span>}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-auto pt-4">
              {note.tags?.map((tag: any) => (
                <Badge key={tag.id} variant="outline" className="text-xs text-muted-foreground bg-muted/50 border-0">#{tag.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const fileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  fileType: z.string().min(1, "Type is required"),
  size: z.coerce.number().default(1024),
  url: z.string().default("https://example.com/placeholder.pdf")
});

function FilesTab({ subjectId }: { subjectId: number }) {
  const { data: files, isLoading } = useGetFiles({ subjectId }, { query: { queryKey: getGetFilesQueryKey({ subjectId }) } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createFile = useCreateFileRecord();
  const deleteFile = useDeleteFile();

  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof fileSchema>>({
    resolver: zodResolver(fileSchema),
    defaultValues: { name: "", fileType: "application/pdf" }
  });

  // @ts-ignore - CreateFileBody might not match exactly due to multipart form stuff in openapi, using simple fetch here or ignoring type error
  const onSubmit = (values: any) => {
    toast({ title: "File upload simulated", description: "In a real app, this would upload the file binary." });
    setIsOpen(false);
    form.reset();
  };

  const handleDelete = (id: number) => {
    deleteFile.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFilesQueryKey({ subjectId }) });
        queryClient.invalidateQueries({ queryKey: getGetSubjectStatsQueryKey(subjectId) });
        toast({ title: "File deleted" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="h-4 w-4 mr-2" /> Upload File</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload File</DialogTitle><DialogDescription>Simulated file upload for {subjectId}.</DialogDescription></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>File Name</FormLabel><FormControl><Input placeholder="syllabus.pdf" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="fileType" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel><FormControl><Input placeholder="application/pdf" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit">Upload (Simulate)</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
      ) : files?.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-card border-dashed">
          <Folder className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No files uploaded yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files?.map(file => (
            <Card key={file.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{file.fileType} • {Math.round(file.size / 1024)} KB</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(file.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const audioSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  transcript: z.string().optional(),
  duration: z.coerce.number().default(0),
  fileUrl: z.string().default("https://example.com/audio.mp3")
});

function AudioTab({ subjectId }: { subjectId: number }) {
  const { data: records, isLoading } = useGetAudioRecords({ subjectId }, { query: { queryKey: getGetAudioRecordsQueryKey({ subjectId }) } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createAudio = useCreateAudioRecord();
  const updateAudio = useUpdateAudioRecord();
  const deleteAudio = useDeleteAudioRecord();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof audioSchema>>({
    resolver: zodResolver(audioSchema),
    defaultValues: { title: "", description: "", transcript: "" }
  });

  const onSubmit = (values: z.infer<typeof audioSchema>) => {
    if (editingId) {
      updateAudio.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAudioRecordsQueryKey({ subjectId }) });
          toast({ title: "Audio record updated" });
          setIsOpen(false);
          setEditingId(null);
        }
      });
    } else {
      createAudio.mutate({ data: { ...values, subjectId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAudioRecordsQueryKey({ subjectId }) });
          queryClient.invalidateQueries({ queryKey: getGetSubjectStatsQueryKey(subjectId) });
          toast({ title: "Audio record created" });
          setIsOpen(false);
          form.reset();
        }
      });
    }
  };

  const handleEdit = (record: any) => {
    form.reset({ title: record.title, description: record.description || "", transcript: record.transcript || "" });
    setEditingId(record.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteAudio.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAudioRecordsQueryKey({ subjectId }) });
        queryClient.invalidateQueries({ queryKey: getGetSubjectStatsQueryKey(subjectId) });
        toast({ title: "Audio record deleted" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) { setEditingId(null); form.reset({ title: "", description: "", transcript: "" }); }
        }}>
          <DialogTrigger asChild>
            <Button><Mic className="h-4 w-4 mr-2" /> Add Audio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit Audio" : "Add Audio Record"}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="transcript" render={({ field }) => (
                  <FormItem><FormLabel>Transcript</FormLabel><FormControl><Textarea {...field} className="h-24" /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={createAudio.isPending || updateAudio.isPending}>Save</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
      ) : records?.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-card border-dashed">
          <Mic className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No audio records found.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {records?.map(record => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold text-base">{record.title}</h4>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mt-1 -mr-2 h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(record)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(record.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-xs text-muted-foreground mb-3">{format(new Date(record.createdAt), "MMM d, yyyy")} • {Math.floor(record.duration / 60)}:{(record.duration % 60).toString().padStart(2, '0')}</div>
                {record.description && <p className="text-sm text-muted-foreground line-clamp-2">{record.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  year: z.coerce.number().min(2000),
  term: z.string().min(1, "Term is required"),
  type: z.string().min(1, "Type is required"),
  difficulty: z.string().optional()
});

function ExamsTab({ subjectId }: { subjectId: number }) {
  const { data: exams, isLoading } = useGetExams({ subjectId }, { query: { queryKey: getGetExamsQueryKey({ subjectId }) } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema),
    defaultValues: { title: "", year: new Date().getFullYear(), term: "Fall", type: "Midterm", difficulty: "medium" }
  });

  const onSubmit = (values: z.infer<typeof examSchema>) => {
    if (editingId) {
      updateExam.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetExamsQueryKey({ subjectId }) });
          toast({ title: "Exam updated" });
          setIsOpen(false);
          setEditingId(null);
        }
      });
    } else {
      createExam.mutate({ data: { ...values, subjectId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetExamsQueryKey({ subjectId }) });
          queryClient.invalidateQueries({ queryKey: getGetSubjectStatsQueryKey(subjectId) });
          toast({ title: "Exam created" });
          setIsOpen(false);
          form.reset();
        }
      });
    }
  };

  const handleEdit = (exam: any) => {
    form.reset({ title: exam.title, year: exam.year, term: exam.term, type: exam.type, difficulty: exam.difficulty || "medium" });
    setEditingId(exam.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteExam.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetExamsQueryKey({ subjectId }) });
        queryClient.invalidateQueries({ queryKey: getGetSubjectStatsQueryKey(subjectId) });
        toast({ title: "Exam deleted" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) { setEditingId(null); form.reset({ title: "", year: new Date().getFullYear(), term: "Fall", type: "Midterm", difficulty: "medium" }); }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Exam Record</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit Exam" : "Add Exam Record"}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title/Reference</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="year" render={({ field }) => (
                    <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="term" render={({ field }) => (
                    <FormItem><FormLabel>Term</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Fall">Fall</SelectItem><SelectItem value="Spring">Spring</SelectItem><SelectItem value="Summer">Summer</SelectItem><SelectItem value="Winter">Winter</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Midterm">Midterm</SelectItem><SelectItem value="Final">Final</SelectItem><SelectItem value="Quiz">Quiz</SelectItem><SelectItem value="Practice">Practice</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="difficulty" render={({ field }) => (
                    <FormItem><FormLabel>Difficulty</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="hard">Hard</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <DialogFooter><Button type="submit" disabled={createExam.isPending || updateExam.isPending}>Save</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
      ) : exams?.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-card border-dashed">
          <FileBadge className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No exams added yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams?.map(exam => (
            <Card key={exam.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-base">{exam.title}</h4>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mt-1 -mr-2 h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(exam)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(exam.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary">{exam.year} {exam.term}</Badge>
                  <Badge variant="outline">{exam.type}</Badge>
                  {exam.difficulty && <Badge variant="outline" className="capitalize border-muted-foreground/30 text-muted-foreground">{exam.difficulty}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TasksTab({ subjectId }: { subjectId: number }) {
  const { data: tasks, isLoading } = useGetTasks({ subjectId }, { query: { queryKey: getGetTasksQueryKey({ subjectId }) } });
  
  if (isLoading) return <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>;
  if (tasks?.length === 0) return (
    <div className="text-center py-12 border rounded-xl bg-card border-dashed">
      <CheckSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
      <p className="text-muted-foreground mb-4">No tasks for this subject.</p>
      <Link href="/tasks"><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Go to Tasks to create one</Button></Link>
    </div>
  );

  return (
    <div className="space-y-3">
      {tasks?.map(task => (
        <Card key={task.id} className={task.status === 'done' ? 'opacity-60' : ''}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h4 className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h4>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="capitalize">{task.status.replace('_', ' ')}</span>
                <span className="capitalize">{task.priority} Priority</span>
                {task.dueDate && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(task.dueDate), "MMM d")}</span>}
              </div>
            </div>
            <Link href="/tasks"><Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button></Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const reminderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  remindAt: z.string().min(1, "Date is required"),
});

function RemindersTab({ subjectId }: { subjectId: number }) {
  const { data: reminders, isLoading } = useGetReminders({ subjectId }, { query: { queryKey: getGetRemindersQueryKey({ subjectId }) } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof reminderSchema>>({
    resolver: zodResolver(reminderSchema),
    defaultValues: { title: "", remindAt: "" }
  });

  const onSubmit = (values: z.infer<typeof reminderSchema>) => {
    if (editingId) {
      updateReminder.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRemindersQueryKey({ subjectId }) });
          toast({ title: "Reminder updated" });
          setIsOpen(false);
          setEditingId(null);
        }
      });
    } else {
      createReminder.mutate({ data: { ...values, subjectId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRemindersQueryKey({ subjectId }) });
          toast({ title: "Reminder created" });
          setIsOpen(false);
          form.reset();
        }
      });
    }
  };

  const handleEdit = (reminder: any) => {
    form.reset({ title: reminder.title, remindAt: format(new Date(reminder.remindAt), "yyyy-MM-dd'T'HH:mm") });
    setEditingId(reminder.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteReminder.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRemindersQueryKey({ subjectId }) });
        toast({ title: "Reminder deleted" });
      }
    });
  };

  const handleToggleRead = (id: number, currentStatus: boolean) => {
    updateReminder.mutate({ id, data: { isRead: !currentStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRemindersQueryKey({ subjectId }) });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) { setEditingId(null); form.reset({ title: "", remindAt: "" }); }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Reminder</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit Reminder" : "Add Reminder"}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Reminder Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="remindAt" render={({ field }) => (
                  <FormItem><FormLabel>Remind At</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter><Button type="submit" disabled={createReminder.isPending || updateReminder.isPending}>Save</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
      ) : reminders?.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-card border-dashed">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No reminders set.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders?.map(reminder => {
            const isOverdue = !reminder.isRead && isPast(new Date(reminder.remindAt));
            return (
              <Card key={reminder.id} className={reminder.isRead ? 'opacity-60 bg-muted/30' : ''}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <Switch checked={reminder.isRead} onCheckedChange={() => handleToggleRead(reminder.id, reminder.isRead)} />
                    <div className="min-w-0">
                      <h4 className={`font-medium truncate ${reminder.isRead ? 'line-through text-muted-foreground' : ''}`}>{reminder.title}</h4>
                      <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {isOverdue && <AlertCircle className="h-3 w-3" />}
                        {format(new Date(reminder.remindAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(reminder)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(reminder.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
