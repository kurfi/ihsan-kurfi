import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type DocumentType = Database["public"]["Enums"]["document_type"];

export interface Document {
  id: string;
  document_type: DocumentType;
  entity_type: string;
  entity_id: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string;
  created_at: string;
  entity_name?: string;
}

export function useDocuments(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["documents"],
    staleTime: 600_000, // 10 minutes — document statuses change infrequently
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("expiry_date", { ascending: true });

      if (error) throw error;

      return data as Document[];
    },
  });
}

export function useAddDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (doc: {
      document_type: DocumentType;
      entity_type: string;
      entity_id: string;
      document_number?: string;
      issue_date?: string;
      expiry_date: string;
    }) => {
      const { data, error } = await supabase
        .from("documents")
        .insert(doc)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add document", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...doc }: Partial<Document> & { id: string }) => {
      const { data, error } = await supabase
        .from("documents")
        .update(doc)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update document", description: error.message, variant: "destructive" });
    },
  });
}

export function useExpiringDocuments(daysThreshold = 30) {
  const { data: documents, ...rest } = useDocuments();

  const expiringDocs = documents?.filter((doc) => {
    const daysUntilExpiry = Math.floor(
      (new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= daysThreshold;
  });

  return { data: expiringDocs, ...rest };
}
