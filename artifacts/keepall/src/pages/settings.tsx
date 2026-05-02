import { useGetProfile } from "@workspace/api-client-react";

export default function Settings() {
  const { data, isLoading } = useGetProfile();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences.</p>
      </div>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
           <p>Profile info: {data?.displayName}</p>
        </div>
      )}
    </div>
  );
}