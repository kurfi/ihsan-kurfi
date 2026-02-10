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

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data: documents, error } = await supabase
        .from("documents")
        .select("*")
        .order("expiry_date", { ascending: true });

      if (error) throw error;

      // Fetch entity names
      const truckIds = documents
        .filter((d) => d.entity_type === "truck")
        .map((d) => d.entity_id);
      const driverIds = documents
        .filter((d) => d.entity_type === "driver")
        .map((d) => d.entity_id);

      const [trucksRes, driversRes] = await Promise.all([
        truckIds.length > 0
          ? supabase.from("trucks").select("id, plate_number").in("id", truckIds)
          : { data: [] },
        driverIds.length > 0
          ? supabase.from("drivers").select("id, name").in("id", driverIds)
          : { data: [] },
      ]);

      const truckMap = new Map<string, string>();
      trucksRes.data?.forEach((t) => truckMap.set(t.id, t.plate_number));
      const driverMap = new Map<string, string>();
      driversRes.data?.forEach((d) => driverMap.set(d.id, d.name));

      return documents.map((doc) => ({
        ...doc,
        entity_name:
          doc.entity_type === "truck"
            ? truckMap.get(doc.entity_id)
            : driverMap.get(doc.entity_id),
      })) as Document[];
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
