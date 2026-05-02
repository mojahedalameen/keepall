import { useGetTrashItems } from "@workspace/api-client-react";

export default function Trash() {
  const { data, isLoading } = useGetTrashItems();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trash</h1>
        <p className="text-muted-foreground mt-2">Recover or permanently delete items.</p>
      </div>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
           <p>Trash contents here.</p>
        </div>
      )}
    </div>
  );
}