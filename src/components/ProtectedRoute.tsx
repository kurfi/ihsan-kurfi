import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children, allowAdmin = false, allowSuperAdmin = false }: { children: React.ReactNode, allowAdmin?: boolean, allowSuperAdmin?: boolean }) {
    const { user, loading, profile } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Simple role check based on props
    if (allowSuperAdmin && profile?.role !== 'super_admin') {
        return <Navigate to="/" replace />; // Or a 'Not Authorized' page
    }

    if (allowAdmin && (profile?.role !== 'admin' && profile?.role !== 'super_admin')) {
        return <Navigate to="/" replace />; // Or a 'Not Authorized' page
    }

    return <>{children}</>;
}
