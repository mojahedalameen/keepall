import { useGetNotes } from "@workspace/api-client-react";

export default function Notes() {
  const { data, isLoading } = useGetNotes({});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
        <p className="text-muted-foreground mt-2">All your notes across subjects.</p>
      </div>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {data?.map(note => (
            <div key={note.id} className="p-4 border rounded-lg">
              <h3 className="font-semibold">{note.title}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}