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

    // Redirect pending users to the pending approval page
    if (profile?.role === 'pending' && location.pathname !== '/pending-approval') {
        return <Navigate to="/pending-approval" replace />;
    }

    // Redirect blocked users to the blocked page
    if (profile?.is_blocked && location.pathname !== '/blocked') {
        return <Navigate to="/blocked" replace />;
    }

    // Redirect authorized users away from status pages
    const isStatusPage = ['/pending-approval', '/blocked'].includes(location.pathname);
    if (user && profile && !profile.is_blocked && profile.role !== 'pending' && isStatusPage) {
        return <Navigate to="/" replace />;
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
