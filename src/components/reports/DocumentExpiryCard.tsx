import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface DocumentExpiryCardProps {
    doc: {
        id: string;
        entity_name: string;
        entity_type: string;
        document_type: string;
        document_number: string | null;
        expiry_date: string;
        days_until_expiry: number;
        status: string;
    };
}

export function DocumentExpiryCard({ doc }: DocumentExpiryCardProps) {
    return (
        <Card className="shadow-sm border border-border/50">
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-base">{doc.entity_name}</span>
                            <Badge variant="outline" className="capitalize text-xs font-normal">
                                {doc.entity_type}
                            </Badge>
                        </div>
                        <div className="text-sm font-medium text-foreground flex items-center gap-1.5 capitalize">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                            {doc.document_type.replace('_', ' ')}
                        </div>
                    </div>
                    <Badge
                        variant={
                            doc.status === 'expired'
                                ? 'destructive'
                                : doc.status === 'critical'
                                    ? 'destructive'
                                    : doc.status === 'warning'
                                        ? 'secondary'
                                        : 'default'
                        }
                    >
                        {doc.status.toUpperCase()}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/50 text-sm">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Document No.
                        </span>
                        <span className="font-medium block truncate">
                            {doc.document_number || 'N/A'}
                        </span>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" /> Days Remaining
                        </span>
                        <span className={`font-bold ${doc.days_until_expiry < 0 ? 'text-red-500' : ''}`}>
                            {doc.days_until_expiry} days
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Expires: <span className="text-foreground">{format(new Date(doc.expiry_date), 'MMM d, yyyy')}</span>
                </div>
            </CardContent>
        </Card>
    );
}
