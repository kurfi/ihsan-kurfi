import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { ConnectivityStatus } from "./components/ConnectivityStatus";

// Lazy-load all pages so only the visited page is downloaded on first load
import Index from "./pages/Index";
const Fleet = lazy(() => import("./pages/Fleet"));
const Orders = lazy(() => import("./pages/Orders"));
const Customers = lazy(() => import("./pages/Customers"));
const Finance = lazy(() => import("./pages/Finance"));
const Products = lazy(() => import("./pages/Products"));
const Reports = lazy(() => import("./pages/Reports"));
const TruckDetails = lazy(() => import("./pages/TruckDetails"));
const DriverDetails = lazy(() => import("./pages/DriverDetails"));
const CementPayments = lazy(() => import("./pages/CementPayments"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure caching: data stays fresh for 30s, cached for 5 minutes
// This prevents re-fetching all data every time you navigate between pages
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,   // 30 seconds — data won't re-fetch on revisit
      gcTime: 300_000,     // 5 minutes — keep unused data in cache
      retry: 1,            // Only retry failed queries once
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="ihsan-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ConnectivityStatus />
        <BrowserRouter>
          <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>}>
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
