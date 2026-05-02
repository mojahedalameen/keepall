import { useState } from "react";
import { 
  useGetNotes, 
  useCreateNote, 
  useUpdateNote, 
  useDeleteNote, 
  useToggleNotePin,
  getGetNotesQueryKey,
  useGetSubjects
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical, Pencil, Trash2, Pin, BookOpen } from "lucide-react";
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
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

const noteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  subjectId: z.coerce.number().optional().nullable(),
  tags: z.string().optional(),
});

type NoteFormValues = z.infer<typeof noteSchema>;

export default function Notes() {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  
  const { data: subjects } = useGetSubjects();
  
  const queryParams = {
    ...(selectedSubject !== "all" && { subjectId: parseInt(selectedSubject, 10) }),
    ...(showPinnedOnly && { pinned: true })
  };
  
  const { data: notes, isLoading } = useGetNotes(queryParams, {
    query: { queryKey: getGetNotesQueryKey(queryParams) }
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const togglePin = useToggleNotePin();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
      subjectId: null,
      tags: "",
    },
  });

  const onSubmit = (values: NoteFormValues) => {
    // Transform tags string to array
    const tagsArray = values.tags 
      ? values.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];
      
    if (editingId) {
      updateNote.mutate(
        { id: editingId, data: { ...values, tags: tagsArray as any } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
            toast({ title: "Note updated successfully" });
            setIsCreateOpen(false);
            setEditingId(null);
          },
          onError: () => {
            toast({ title: "Failed to update note", variant: "destructive" });
          }
        }
      );
    } else {
      createNote.mutate(
        { data: { ...values, tags: tagsArray as any } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
            toast({ title: "Note created successfully" });
            setIsCreateOpen(false);
            form.reset();
          },
          onError: () => {
            toast({ title: "Failed to create note", variant: "destructive" });
          }
        }
      );
    }
  };

  const handleEdit = (note: any) => {
    form.reset({
      title: note.title,
      content: note.content || "",
      subjectId: note.subjectId,
      tags: note.tags ? note.tags.map((t: any) => t.name).join(", ") : "",
    });
    setEditingId(note.id);
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteNote.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
          toast({ title: "Note deleted successfully" });
        },
        onError: () => {
          toast({ title: "Failed to delete note", variant: "destructive" });
        }
      }
    );
  };

  const handleTogglePin = (id: number) => {
    togglePin.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNotesQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to toggle pin", variant: "destructive" });
        }
      }
    );
  };

  const filteredNotes = notes?.filter(note => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return note.title.toLowerCase().includes(lowerQuery) || 
             (note.content && note.content.toLowerCase().includes(lowerQuery));
    }
    return true;
  });

  const pinnedNotes = filteredNotes?.filter(n => n.isPinned) || [];
  const unpinnedNotes = filteredNotes?.filter(n => !n.isPinned) || [];

  const NoteCard = ({ note }: { note: any }) => (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden" data-testid={`card-note-${note.id}`}>
      {note.subject?.color && (
        <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: note.subject.color }} />
      )}
      <CardHeader className="pb-2 pt-4 pl-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-base line-clamp-1" title={note.title}>{note.title}</CardTitle>
            <div className="flex items-center text-xs text-muted-foreground gap-2">
              <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
            </div>
          </div>
          <div className="flex items-center">
            {note.isPinned && <Pin className="h-3 w-3 text-primary mr-1 fill-primary" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" data-testid={`button-note-menu-${note.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(note)} data-testid={`menu-edit-note-${note.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTogglePin(note.id)} data-testid={`menu-pin-note-${note.id}`}>
                  <Pin className="mr-2 h-4 w-4" />
                  {note.isPinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive" data-testid={`menu-delete-note-${note.id}`}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Note</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this note? It will be moved to the Trash.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(note.id)}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        data-testid={`button-confirm-delete-${note.id}`}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pl-5">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
          {note.content || <span className="italic opacity-50">No content</span>}
        </p>
        
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-4">
          {note.subject && (
            <Badge variant="secondary" className="text-xs">
              {note.subject.code || note.subject.title.substring(0, 15)}
            </Badge>
          )}
          {note.tags?.map((tag: any) => (
            <Badge key={tag.id} variant="outline" className="text-xs text-muted-foreground bg-muted/50 border-0">
              #{tag.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground mt-2">Capture and organize your thoughts.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingId(null);
            form.reset({ title: "", content: "", subjectId: null, tags: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-note">
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Note" : "Create Note"}</DialogTitle>
              <DialogDescription>
                Jot down your thoughts, ideas, and key takeaways.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 flex flex-col">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Note title..." {...field} data-testid="input-note-title" />
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
                            <SelectTrigger data-testid="select-note-subject">
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
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (comma separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="study, exam, important" {...field} data-testid="input-note-tags" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1 flex flex-col">
                      <FormLabel>Content</FormLabel>
                      <FormControl className="flex-1">
                        <Textarea 
                          placeholder="Write your note here..." 
                          {...field} 
                          className="resize-none flex-1" 
                          data-testid="input-note-content" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createNote.isPending || updateNote.isPending} data-testid="button-save-note">
                    {(createNote.isPending || updateNote.isPending) ? "Saving..." : "Save Note"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-3 rounded-lg border">
        <div className="relative flex-1 w-full">
          <Input 
            placeholder="Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            data-testid="input-search-notes"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter-subject">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects?.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch 
              id="pinned-only" 
              checked={showPinnedOnly}
              onCheckedChange={setShowPinnedOnly}
            />
            <label htmlFor="pinned-only" className="text-sm font-medium cursor-pointer">
              Pinned
            </label>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      ) : filteredNotes?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-card border-dashed">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No notes found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            {searchQuery || selectedSubject !== "all" || showPinnedOnly
              ? "No notes match your filters."
              : "Create your first note to start capturing ideas."}
          </p>
          {!searchQuery && selectedSubject === "all" && !showPinnedOnly && (
            <Button 
              className="mt-6" 
              variant="outline"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Note
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {pinnedNotes.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Pin className="h-4 w-4" /> PINNED
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
              </div>
            </div>
          )}

          {unpinnedNotes.length > 0 && (
            <div className="space-y-4">
              {pinnedNotes.length > 0 && (
                <h2 className="text-sm font-semibold text-muted-foreground">OTHERS</h2>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {unpinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
