import { useState } from "react";
import { 
  useGetTrashItems, 
  useRestoreTrashItem, 
  usePurgeTrashItem,
  getGetTrashItemsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  RotateCcw, 
  Folder, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  FileBadge,
  AlertTriangle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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

const entityIcons = {
  subject: Folder,
  note: BookOpen,
  file: FileText,
  task: CheckSquare,
  exam: FileBadge,
  lecture: BookOpen,
  audio_record: FileText,
  reminder: CheckSquare
};

export default function Trash() {
  const { data, isLoading } = useGetTrashItems();
  const [activeTab, setActiveTab] = useState("all");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const restoreItem = useRestoreTrashItem();
  const purgeItem = usePurgeTrashItem();

  const handleRestore = (id: number) => {
    restoreItem.mutate(
      { data: { id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTrashItemsQueryKey() });
          toast({ title: "Item restored successfully" });
        },
        onError: () => {
          toast({ title: "Failed to restore item", variant: "destructive" });
        }
      }
    );
  };

  const handlePurge = (id: number) => {
    purgeItem.mutate(
      { data: { id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTrashItemsQueryKey() });
          toast({ title: "Item permanently deleted" });
        },
        onError: () => {
          toast({ title: "Failed to delete item", variant: "destructive" });
        }
      }
    );
  };

  const getItemsForTab = () => {
    if (!data?.items) return [];
    if (activeTab === "all") return data.items;
    return data.items.filter(item => item.entityType === activeTab);
  };

  const filteredItems = getItemsForTab();
  
  // Count items by type for tabs
  const counts = {
    all: data?.items?.length || 0,
    note: data?.items?.filter(i => i.entityType === 'note').length || 0,
    file: data?.items?.filter(i => i.entityType === 'file').length || 0,
    task: data?.items?.filter(i => i.entityType === 'task').length || 0,
    subject: data?.items?.filter(i => i.entityType === 'subject').length || 0,
    exam: data?.items?.filter(i => i.entityType === 'exam').length || 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
        <p className="text-muted-foreground mt-2">Items deleted in the last 30 days can be restored.</p>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : counts.all === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-card border-dashed">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Trash is empty</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Deleted items will appear here for 30 days before being permanently removed.
          </p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto rounded-lg h-auto p-1 bg-muted/50 mb-6">
            <TabsTrigger value="all" className="rounded-md py-2 px-4">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="subject" className="rounded-md py-2 px-4" disabled={!counts.subject}>Subjects ({counts.subject})</TabsTrigger>
            <TabsTrigger value="note" className="rounded-md py-2 px-4" disabled={!counts.note}>Notes ({counts.note})</TabsTrigger>
            <TabsTrigger value="file" className="rounded-md py-2 px-4" disabled={!counts.file}>Files ({counts.file})</TabsTrigger>
            <TabsTrigger value="task" className="rounded-md py-2 px-4" disabled={!counts.task}>Tasks ({counts.task})</TabsTrigger>
            <TabsTrigger value="exam" className="rounded-md py-2 px-4" disabled={!counts.exam}>Exams ({counts.exam})</TabsTrigger>
          </TabsList>

          <div className="space-y-3">
            {filteredItems.map((item) => {
              const Icon = entityIcons[item.entityType as keyof typeof entityIcons] || FileText;
              
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-base truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span className="capitalize">{item.entityType.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>Deleted on {format(new Date(item.deletedAt), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-auto mt-2 sm:mt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 sm:flex-auto hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                        onClick={() => handleRestore(item.id)}
                        disabled={restoreItem.isPending || purgeItem.isPending}
                        data-testid={`button-restore-${item.id}`}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 sm:flex-auto text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            disabled={restoreItem.isPending || purgeItem.isPending}
                            data-testid={`button-purge-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Delete Forever</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              Permanently Delete Item
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete "{item.title}"? This action cannot be undone and all data will be lost forever.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handlePurge(item.id)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              data-testid={`button-confirm-purge-${item.id}`}
                            >
                              Delete Forever
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Tabs>
      )}
    </div>
  );
}
