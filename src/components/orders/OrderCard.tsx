import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  MapPin,
  Package,
  Calendar,
  Truck,
  User,
  Printer,
  Upload,
  FileText,
  Banknote,
  Edit,
  Trash2,
  UserPlus,
  Copy
} from "lucide-react";
import { format } from "date-fns";
import { Order } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";

interface OrderCardProps {
  order: Order;
  onAction: (action: string, orderId: string) => void;
  statusColors: Record<string, string>;
  formatStatus: (status: string) => string;
}

export function OrderCard({
  order,
  onAction,
  statusColors,
  formatStatus,
}: OrderCardProps) {
  const { toast } = useToast();

  return (
    <Card className="shadow-card overflow-hidden hover:border-primary/50 transition-colors">
      <CardContent className="p-0">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{order.order_number}</span>
          </div>
          <div className="flex items-center gap-1">
            {order.status !== "delivered" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2"
                onClick={() => onAction('next', order.id)}
              >
                Next
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAction('view', order.id)}>
                  <Banknote className="w-4 h-4 mr-2" /> View Details
                </DropdownMenuItem>
                {order.status === 'requested' && order.payment_status === 'pending' && (
                  <DropdownMenuItem onClick={() => onAction('confirm_payment', order.id)} className="text-success font-medium">
                    <Banknote className="w-4 h-4 mr-2" /> Confirm Payment
                  </DropdownMenuItem>
                )}
                {order.truck && order.driver && (
                  <DropdownMenuItem onClick={() => onAction('manifest', order.id)}>
                    <Printer className="w-4 h-4 mr-2" /> Print Manifest
                  </DropdownMenuItem>
                )}
                {order.status === 'requested' && (
                  <>
                    <DropdownMenuItem onClick={() => onAction('edit', order.id)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Order
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('delete', order.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Order
                    </DropdownMenuItem>
                  </>
                )}
                {order.status === 'dispatched' && (
                  <DropdownMenuItem onClick={() => onAction('reassign', order.id)}>
                    <UserPlus className="w-4 h-4 mr-2" /> Re-assign Fleet
                  </DropdownMenuItem>
                )}
                {order.waybill_url && (
                  <DropdownMenuItem onClick={() => window.open(order.waybill_url!, '_blank')}>
                    <FileText className="w-4 h-4 mr-2" /> View Waybill
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {order.status === 'dispatched' && order.delivery_otp && (
          <div className="bg-primary/5 px-4 py-2 border-b border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-primary/70 uppercase">Delivery OTP:</span>
              <code className="text-sm font-mono font-bold tracking-wider text-primary">{order.delivery_otp}</code>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-primary hover:bg-primary/10"
              onClick={() => {
                navigator.clipboard.writeText(order.delivery_otp!);
                toast({ title: "OTP Copied", description: "Delivery OTP copied to clipboard" });
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold truncate max-w-[200px]">
                {order.customer?.name || "Unknown Customer"}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Package className="w-3 h-3" />
                <span>{order.cement_type} • {order.quantity} {order.unit === 'tons' ? 'T' : 'Bags'}</span>
              </div>
            </div>
            <Badge className={statusColors[order.status]}>
              {formatStatus(order.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(order.created_at), "MMM d, yyyy")}</span>
            </div>

            {(order.truck?.plate_number || order.driver?.name) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="w-3 h-3" />
                <span className="truncate">
                  {order.truck?.plate_number || "No Truck"} / {order.driver?.name || "No Driver"}
                </span>
              </div>
            )}

            {order.delivery_address && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{order.delivery_address}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
