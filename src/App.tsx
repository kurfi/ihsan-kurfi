import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Fleet from "./pages/Fleet";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Finance from "./pages/Finance";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import TruckDetails from "./pages/TruckDetails";
import DriverDetails from "./pages/DriverDetails";

import CementPayments from "./pages/CementPayments";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./components/theme-provider";
import { ConnectivityStatus } from "./components/ConnectivityStatus";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="ihsan-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ConnectivityStatus />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/fleet/truck/:id" element={<TruckDetails />} />
            <Route path="/fleet/driver/:id" element={<DriverDetails />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/reports" element={<Reports />} />

            <Route path="/cement-payments" element={<CementPayments />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
