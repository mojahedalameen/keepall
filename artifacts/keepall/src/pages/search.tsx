import { useState, useEffect } from "react";
import { useGlobalSearch } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Folder, BookOpen, FileText, FileBadge, CheckSquare, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [activeTab, setActiveTab] = useState("all");
  
  const { data, isLoading } = useGlobalSearch(
    { q: debouncedQuery, ...(activeTab !== "all" && { type: activeTab }) },
    { query: { enabled: debouncedQuery.length >= 2, queryKey: ["search", debouncedQuery, activeTab] } }
  );

  const hasResults = data && (
    data.subjects.length > 0 || 
    data.notes.length > 0 || 
    data.files.length > 0 || 
    data.exams.length > 0 || 
    data.tasks.length > 0
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground mt-2">Find anything across all your academic materials.</p>
      </div>
      
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects, notes, files, tasks..."
          className="h-14 pl-12 text-lg rounded-xl shadow-sm bg-card border-border focus-visible:ring-primary"
          data-testid="input-global-search"
        />
      </div>

      {query.length < 2 ? (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <SearchIcon className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <p>Type at least 2 characters to search.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      ) : !hasResults ? (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center border border-dashed rounded-xl bg-card">
          <p className="text-lg font-medium text-foreground mb-1">No results found</p>
          <p>We couldn't find anything matching "{debouncedQuery}"</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto rounded-lg h-auto p-1 bg-muted/50 mb-6">
            <TabsTrigger value="all" className="rounded-md py-2 px-4">All Results</TabsTrigger>
            <TabsTrigger value="subjects" className="rounded-md py-2 px-4" disabled={!data?.subjects.length && activeTab !== 'subjects'}>
              Subjects {data?.subjects.length ? `(${data.subjects.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-md py-2 px-4" disabled={!data?.notes.length && activeTab !== 'notes'}>
              Notes {data?.notes.length ? `(${data.notes.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="files" className="rounded-md py-2 px-4" disabled={!data?.files.length && activeTab !== 'files'}>
              Files {data?.files.length ? `(${data.files.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="exams" className="rounded-md py-2 px-4" disabled={!data?.exams.length && activeTab !== 'exams'}>
              Exams {data?.exams.length ? `(${data.exams.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-md py-2 px-4" disabled={!data?.tasks.length && activeTab !== 'tasks'}>
              Tasks {data?.tasks.length ? `(${data.tasks.length})` : ''}
            </TabsTrigger>
          </TabsList>

          <div className="space-y-8">
            {(activeTab === "all" || activeTab === "subjects") && data?.subjects.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                  <Folder className="h-5 w-5 text-primary" /> Subjects
                </h3>
                <div className="grid gap-3">
                  {data.subjects.map(subject => (
                    <Link key={`sub-${subject.id}`} href={`/subjects/${subject.id}`}>
                      <Card className="hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer border-l-4" style={{ borderLeftColor: subject.color || 'var(--primary)' }}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-base">{subject.title}</h4>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
                              {subject.code && <span className="font-medium">{subject.code}</span>}
                              {subject.instructor && <span>{subject.instructor}</span>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === "all" || activeTab === "notes") && data?.notes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Notes
                </h3>
                <div className="grid gap-3">
                  {data.notes.map(note => (
                    <Link key={`note-${note.id}`} href={`/notes?id=${note.id}`}>
                      <Card className="hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-base line-clamp-1">{note.title}</h4>
                            {note.subject && (
                              <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                                {note.subject.code || note.subject.title}
                              </Badge>
                            )}
                          </div>
                          {note.content && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {note.content}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === "all" || activeTab === "files") && data?.files.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                  <FileText className="h-5 w-5 text-primary" /> Files
                </h3>
                <div className="grid gap-3">
                  {data.files.map(file => (
                    <Card key={`file-${file.id}`} className="hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-base truncate">{file.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-[10px] h-4">{file.fileType}</Badge>
                            {file.subject && <span className="truncate">{file.subject.title}</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === "all" || activeTab === "exams") && data?.exams.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                  <FileBadge className="h-5 w-5 text-primary" /> Exams
                </h3>
                <div className="grid gap-3">
                  {data.exams.map(exam => (
                    <Card key={`exam-${exam.id}`} className="hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-base">{exam.year} {exam.term} Exam</h4>
                            <Badge variant="secondary">{exam.type}</Badge>
                          </div>
                          {exam.subject && <p className="text-sm text-muted-foreground">{exam.subject.title}</p>}
                        </div>
                        {exam.difficulty && (
                          <Badge variant="outline" className="capitalize">{exam.difficulty}</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === "all" || activeTab === "tasks") && data?.tasks.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                  <CheckSquare className="h-5 w-5 text-primary" /> Tasks
                </h3>
                <div className="grid gap-3">
                  {data.tasks.map(task => (
                    <Link key={`task-${task.id}`} href="/tasks">
                      <Card className={`hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer ${task.status === 'done' ? 'opacity-60' : ''}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-base truncate ${task.status === 'done' ? 'line-through' : ''}`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <Badge variant="outline" className={`text-[10px] h-4 capitalize ${
                                task.status === 'done' ? 'bg-green-100 text-green-800 border-0 dark:bg-green-900/30' : ''
                              }`}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                              <span className="capitalize text-[10px] font-medium border px-1.5 rounded bg-muted">
                                {task.priority}
                              </span>
                              {task.subject && <span className="truncate">{task.subject.title}</span>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Tabs>
      )}
    </div>
  );
}
