import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { ConnectivityStatus } from "./components/ConnectivityStatus";
import { AuthProvider } from "./hooks/useAuth";

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
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Settings = lazy(() => import("./pages/Settings"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const Blocked = lazy(() => import("./pages/Blocked"));
import { ProtectedRoute } from "./components/ProtectedRoute";

// Configure caching: data stays fresh for 5 minutes, cached for 15 minutes
// This prevents re-fetching all data every time you navigate between pages
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300_000,  // 5 minutes — data won't re-fetch on revisit
      gcTime: 900_000,     // 15 minutes — keep unused data in cache
      retry: 1,            // Only retry failed queries once
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="ihsan-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ConnectivityStatus />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/pending-approval" element={<PendingApproval />} />
                <Route path="/blocked" element={<Blocked />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/fleet" element={<ProtectedRoute><Fleet /></ProtectedRoute>} />
                <Route path="/fleet/truck/:id" element={<ProtectedRoute><TruckDetails /></ProtectedRoute>} />
                <Route path="/fleet/driver/:id" element={<ProtectedRoute><DriverDetails /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute allowAdmin><Settings /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
