import { useGetSemesters } from "@workspace/api-client-react";

export default function Semesters() {
  const { data, isLoading } = useGetSemesters();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Semesters</h1>
        <p className="text-muted-foreground mt-2">Manage your academic terms.</p>
      </div>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {data?.map(semester => (
            <div key={semester.id} className="p-4 border rounded-lg">
              <h3 className="font-semibold">{semester.title}</h3>
              {semester.isActive && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Active</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}