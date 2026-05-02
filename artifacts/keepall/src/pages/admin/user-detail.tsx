import { useParams } from "wouter";

export default function AdminUserDetail() {
  const params = useParams();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Detail</h1>
        <p className="text-muted-foreground mt-2">Viewing user: {params.userId}</p>
      </div>
    </div>
  );
}