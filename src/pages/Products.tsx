import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useDepots, useAddDepot, useDeleteDepot, useAddInventory, useUpdateInventoryItem, useDeleteInventory } from "@/hooks/useProductCatalog";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { LoadingButton } from "@/components/ui/loading-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Package, MapPin, TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const { data: depots = [] } = useDepots();
  const addDepot = useAddDepot();
  const deleteDepot = useDeleteDepot();
  const addProduct = useAddInventory();
  const updateProduct = useUpdateInventoryItem();
  const deleteProduct = useDeleteInventory();

  // State
  const [depotForm, setDepotForm] = useState({ name: "", location: "" });
  const [itemForm, setItemForm] = useState({
    depot_id: "",
    cement_type: "",
    unit: "tons" as "tons" | "bags",
    sale_price: "",
    price_wholesale: "",
    price_retail: "",
    price_end_user: "",
  });

  const [addDepotOpen, setAddDepotOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Handlers
  const handleAddDepot = () => {
    addDepot.mutate(depotForm, {
      onSuccess: () => {
        setAddDepotOpen(false);
        setDepotForm({ name: "", location: "" });
      }
    });
  };

  const handleAddProduct = () => {
    addProduct.mutate({
      depot_id: itemForm.depot_id,
      cement_type: itemForm.cement_type,
      unit: itemForm.unit,
      sale_price: parseFloat(itemForm.sale_price) || 0,
    }, {
      onSuccess: () => {
        setAddItemOpen(false);
        setItemForm({
          depot_id: "",
          cement_type: "",
          unit: "tons",
          sale_price: "",
          price_wholesale: "",
          price_retail: "",
          price_end_user: "",
        });
      }
    });
  };

  const handleEditProduct = () => {
    if (!editingItemId) return;
    updateProduct.mutate({
      id: editingItemId,
      cement_type: itemForm.cement_type,
      unit: itemForm.unit as "tons" | "bags",
      sale_price: parseFloat(itemForm.sale_price) || 0,
      price_wholesale: parseFloat(itemForm.price_wholesale) || 0,
      price_retail: parseFloat(itemForm.price_retail) || 0,
      price_end_user: parseFloat(itemForm.price_end_user) || 0,
    }, {
      onSuccess: () => {
        setEditItemOpen(false);
        setEditingItemId(null);
        setItemForm({
          depot_id: "",
          cement_type: "",
          unit: "tons",
          sale_price: "",
          price_wholesale: "",
          price_retail: "",
          price_end_user: "",
        });
      }
    });
  };

  const handleOpenAddItem = (depotId: string) => {
    setItemForm({ ...itemForm, depot_id: depotId, sale_price: "" });
    setAddItemOpen(true);
  };

  const handleOpenEditItem = (item: typeof products[0]) => {
    setEditingItemId(item.id);
    setItemForm({
      depot_id: item.depot_id,
      cement_type: item.cement_type,
      unit: item.unit,
      sale_price: item.sale_price?.toString() || "",
      price_wholesale: item.price_wholesale?.toString() || "",
      price_retail: item.price_retail?.toString() || "",
      price_end_user: item.price_end_user?.toString() || "",
    });
    setEditItemOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate(id);
    }
  };

  const handleDeleteDepot = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete depot ${name}? All items in it will be lost.`)) {
      deleteDepot.mutate(id);
    }
  };

  // Group products by depot
  const productsByDepot = depots.map((depot) => ({
    ...depot,
    items: products.filter((i) => i.depot_id === depot.id),
  }));

  return (
    <MainLayout title="Products & Pricing">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-end">
          <Button onClick={() => setAddDepotOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Source (Plant/Depot)
          </Button>
        </div>

        {/* Overview Cards - Pricing Focus */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="body-small">Active Sources</p>
                  <p className="text-responsive-2xl font-bold">{depots.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="body-small">Product Types</p>
                  <p className="text-responsive-2xl font-bold">{new Set(products.map(i => i.cement_type)).size}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-100">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Source/Depot Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <LoadingSkeleton key={i} variant="card" className="h-[300px]" />
            ))
          ) : productsByDepot.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={Package}
                title="No Products Configured"
                description="Add a source (Plant/Depot) and set product prices to start."
              />
            </div>
          ) : (
            productsByDepot.map((depot) => (
              <Card key={depot.id} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="heading-section">{depot.name}</CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <MapPin className="w-3 h-3" />
                        {depot.location || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleOpenAddItem(depot.id)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteDepot(depot.id, depot.name)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Products List */}
                  <div className="space-y-3">
                    {depot.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No products listed
                      </p>
                    ) : (
                      depot.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="font-medium">{item.cement_type}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">{item.unit}</Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                              <span className="text-muted-foreground">Base Price:</span>
                              <span className="font-mono font-medium">₦{item.sale_price?.toLocaleString() ?? 0}</span>

                              <span className="text-muted-foreground">Wholesale:</span>
                              <span className="font-mono font-medium text-blue-600">₦{item.price_wholesale?.toLocaleString() ?? 0}</span>

                              <span className="text-muted-foreground">Retail:</span>
                              <span className="font-mono font-medium text-green-600">₦{item.price_retail?.toLocaleString() ?? 0}</span>
                            </div>
                          </div>

                          <div className="flex flex-col justify-between gap-2">
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenEditItem(item)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteItem(item.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>


      {/* Add Source Dialog */}
      <Dialog open={addDepotOpen} onOpenChange={setAddDepotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Source Location</DialogTitle>
            <DialogDescription>Add a manufacturing plant or depot.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Source Name</Label>
              <Input
                value={depotForm.name}
                onChange={(e) => setDepotForm({ ...depotForm, name: e.target.value })}
                placeholder="e.g. Dangote Plant Obajana"
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={depotForm.location}
                onChange={(e) => setDepotForm({ ...depotForm, location: e.target.value })}
                placeholder="Address or City"
              />
            </div>
            <LoadingButton onClick={handleAddDepot} isLoading={addDepot.isPending}>
              Add Source
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product to Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product / Cement Type</Label>
              <Input
                value={itemForm.cement_type}
                onChange={(e) => setItemForm({ ...itemForm, cement_type: e.target.value })}
                placeholder="e.g. Dangote 42.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={itemForm.unit} onValueChange={(v: "tons" | "bags") => setItemForm({ ...itemForm, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tons">Tons</SelectItem>
                  <SelectItem value="bags">Bags</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Cost Price (from Supplier) (₦)</Label>
              <Input
                type="number"
                value={itemForm.sale_price}
                onChange={(e) => setItemForm({ ...itemForm, sale_price: e.target.value })}
                placeholder="0"
              />
            </div>
            <LoadingButton onClick={handleAddProduct} isLoading={addProduct.isPending}>
              Add Product
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product Pricing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product / Cement Type</Label>
              <Input
                value={itemForm.cement_type}
                onChange={(e) => setItemForm({ ...itemForm, cement_type: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Base Cost Price (₦)</Label>
              <Input
                type="number"
                value={itemForm.sale_price}
                onChange={(e) => setItemForm({ ...itemForm, sale_price: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Wholesale (₦)</Label>
                <Input
                  type="number"
                  value={itemForm.price_wholesale}
                  onChange={(e) => setItemForm({ ...itemForm, price_wholesale: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Retail (₦)</Label>
                <Input
                  type="number"
                  value={itemForm.price_retail}
                  onChange={(e) => setItemForm({ ...itemForm, price_retail: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>End-User (₦)</Label>
                <Input
                  type="number"
                  value={itemForm.price_end_user}
                  onChange={(e) => setItemForm({ ...itemForm, price_end_user: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <LoadingButton onClick={handleEditProduct} isLoading={updateProduct.isPending}>
              Update Pricing
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout >
  );
}
