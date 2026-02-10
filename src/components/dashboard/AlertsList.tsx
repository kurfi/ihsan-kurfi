import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, FileWarning } from "lucide-react";
import { formatDistanceToNow, differenceInDays, isPast } from "date-fns";

interface Document {
  id: string;
  document_type: string;
  entity_type: string;
  entity_id: string;
  expiry_date: string;
  entity_name?: string;
}

interface AlertsListProps {
  documents: Document[];
}

export function AlertsList({ documents }: AlertsListProps) {
  const getAlertLevel = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (isPast(new Date(expiryDate))) return "expired";
    if (days <= 7) return "critical";
    if (days <= 30) return "warning";
    return "safe";
  };

  const formatDocType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const expiringDocs = documents
    .filter(doc => {
      const days = differenceInDays(new Date(doc.expiry_date), new Date());
      return days <= 30 || isPast(new Date(doc.expiry_date));
    })
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

  if (expiringDocs.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-success" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <FileWarning className="w-8 h-8 text-success" />
            </div>
            <p className="text-lg font-medium text-foreground">All Clear</p>
            <p className="text-sm text-muted-foreground">No documents expiring within 30 days</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-destructive/20">
      <CardHeader className="bg-destructive/5 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg text-destructive">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          Compliance Alerts ({expiringDocs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border max-h-80 overflow-auto">
          {expiringDocs.map((doc) => {
            const level = getAlertLevel(doc.expiry_date);
            return (
              <div
                key={doc.id}
                className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    level === "expired" ? "bg-destructive/20" : 
                    level === "critical" ? "bg-destructive/15" : "bg-warning/15"
                  }`}>
                    <Clock className={`w-4 h-4 ${
                      level === "expired" || level === "critical" ? "text-destructive" : "text-warning"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {formatDocType(doc.document_type)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {doc.entity_type === "truck" ? "Truck" : "Driver"}: {doc.entity_name || doc.entity_id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <Badge variant={level === "expired" ? "destructive" : level === "critical" ? "destructive" : "secondary"}>
                  {isPast(new Date(doc.expiry_date))
                    ? "Expired"
                    : `Expires ${formatDistanceToNow(new Date(doc.expiry_date), { addSuffix: true })}`}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
