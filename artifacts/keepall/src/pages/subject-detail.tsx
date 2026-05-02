import { useGetSubject } from "@workspace/api-client-react";
import { useParams } from "wouter";

export default function SubjectDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { data, isLoading } = useGetSubject(id, { query: { enabled: !!id, queryKey: ["subject", id] } });

  return (
    <div className="space-y-8">
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{data?.title}</h1>
            <p className="text-muted-foreground mt-2">{data?.description || "No description"}</p>
          </div>
          
          <div className="space-y-4">
            <p>Subject content goes here...</p>
          </div>
        </>
      )}
    </div>
  );
}