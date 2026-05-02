import { useGlobalSearch } from "@workspace/api-client-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Search() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useGlobalSearch({ q: query }, { query: { enabled: query.length > 2, queryKey: ["search", query] } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground mt-2">Find anything across all subjects.</p>
      </div>
      
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search notes, files, tasks..."
        className="max-w-md"
      />
      
      {isLoading && query.length > 2 && <p>Searching...</p>}
      
      {data && (
        <div className="space-y-4">
          {/* Display search results here */}
          <p>Found results.</p>
        </div>
      )}
    </div>
  );
}