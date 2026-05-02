import { useGetSubjects } from "@workspace/api-client-react";

export default function Subjects() {
  const { data, isLoading } = useGetSubjects({});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
        <p className="text-muted-foreground mt-2">Your courses and workspaces.</p>
      </div>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {data?.map(subject => (
            <div key={subject.id} className="p-6 border rounded-lg bg-card">
              <h3 className="font-semibold text-lg">{subject.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{subject.code}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}