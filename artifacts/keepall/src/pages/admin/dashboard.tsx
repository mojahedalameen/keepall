import { useGetAdminStats } from "@workspace/api-client-react";

export default function AdminDashboard() {
  const { data, isLoading } = useGetAdminStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">System overview.</p>
      </div>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
           <div className="p-4 border rounded-lg"><h3 className="font-semibold">Users</h3><p>{data?.totalUsers}</p></div>
           <div className="p-4 border rounded-lg"><h3 className="font-semibold">Subjects</h3><p>{data?.totalSubjects}</p></div>
           <div className="p-4 border rounded-lg"><h3 className="font-semibold">Files</h3><p>{data?.totalFiles}</p></div>
           <div className="p-4 border rounded-lg"><h3 className="font-semibold">Notes</h3><p>{data?.totalNotes}</p></div>
        </div>
      )}
    </div>
  );
}