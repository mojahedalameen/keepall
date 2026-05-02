import { useGetTasks } from "@workspace/api-client-react";

export default function Tasks() {
  const { data, isLoading } = useGetTasks({});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-2">Manage your assignments and to-dos.</p>
      </div>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {data?.map(task => (
            <div key={task.id} className="p-4 border rounded-lg flex items-center justify-between">
              <h3 className="font-semibold">{task.title}</h3>
              <span className="text-xs uppercase">{task.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}