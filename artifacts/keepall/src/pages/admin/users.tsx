import { useGetAdminUsers } from "@workspace/api-client-react";

export default function AdminUsers() {
  const { data, isLoading } = useGetAdminUsers({});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-2">Manage platform users.</p>
      </div>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
           {data?.users.map(u => (
             <div key={u.clerkId} className="p-4 border rounded-lg flex justify-between">
               <span>{u.email}</span>
               <span>{u.isActive ? "Active" : "Inactive"}</span>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}