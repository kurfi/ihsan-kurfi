import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Truck,
    ClipboardList,
    MapPin,
    Package,
    Users,
    DollarSign,
    BarChart,
    Menu,
    X,
    Sun,
    Moon,
    ShoppingCart,
    FileText,
    Banknote
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { Settings as SettingsIcon, LogOut } from "lucide-react";

const navItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["super_admin", "admin", "manager"] },
    { title: "Fleet & Compliance", url: "/fleet", icon: Truck, roles: ["super_admin", "admin", "manager"] },
    { title: "Orders", url: "/orders", icon: ClipboardList, roles: ["super_admin", "admin", "manager"] },
    { title: "Products & Pricing", url: "/products", icon: Package, roles: ["super_admin", "admin", "manager"] },
    { title: "Customers", url: "/customers", icon: Users, roles: ["super_admin", "admin", "manager"] },
    { title: "Finance", url: "/finance", icon: Banknote, roles: ["super_admin", "admin", "manager"] },
    { title: "Reports", url: "/reports", icon: BarChart, roles: ["super_admin", "admin", "manager"] },
    { title: "Settings", url: "/settings", icon: SettingsIcon, roles: ["super_admin", "admin"] },
];

export function Navbar() {
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { profile, signOut } = useAuth();

    const visibleNavItems = navItems.filter(item =>
        !item.roles || (profile?.role && item.roles.includes(profile.role))
    );

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-border/10 ${isScrolled
                ? "bg-background/80 backdrop-blur-md shadow-lg"
                : "bg-transparent backdrop-blur-sm"
                }`}
        >
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden border border-border">
                        <img src="/ihsan-icon.png" alt="IHSAN Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="hidden md:block">
                        <h1 className="font-bold text-xs leading-tight uppercase max-w-[180px]">IHSAN CONCRETE BLOCKS INDUSTRY AND GENERAL ENTERPRISES</h1>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1">
                    {visibleNavItems.map((item) => {
                        const isActive = location.pathname === item.url;
                        return (
                            <NavLink
                                key={item.title}
                                to={item.url}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-primary hover:bg-accent/50"
                                    }`
                                }
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.title}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Theme Toggle Button - Desktop */}
                <div className="hidden lg:flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? (
                            <Sun className="w-5 h-5 transition-transform hover:rotate-12" />
                        ) : (
                            <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
                        )}
                    </Button>

                    {profile && (
                        <div className="flex items-center gap-4 border-l pl-4 ml-2 border-border/40">
                            <div className="text-sm text-right">
                                <p className="font-medium leading-none">{profile.full_name || 'User'}</p>
                                <p className="text-xs text-muted-foreground mt-1 capitalize">{profile.role.replace('_', ' ')}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={signOut}
                                className="text-muted-foreground hover:text-destructive shrink-0"
                                aria-label="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mobile Navigation */}
                <div className="lg:hidden flex items-center gap-2">
                    {/* Theme Toggle Button - Mobile */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? (
                            <Sun className="w-5 h-5" />
                        ) : (
                            <Moon className="w-5 h-5" />
                        )}
                    </Button>

                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="" aria-label="Open mobile menu">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <div className="flex flex-col gap-6 mt-6">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden border border-border">
                                        <img src="/ihsan-icon.png" alt="IHSAN Logo" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h1 className="font-bold text-sm uppercase">IHSAN CONCRETE BLOCKS INDUSTRY AND GENERAL ENTERPRISES</h1>
                                    </div>
                                </div>
                                <nav className="flex flex-col gap-2">
                                    {visibleNavItems.map((item) => {
                                        const isActive = location.pathname === item.url;
                                        return (
                                            <NavLink
                                                key={item.title}
                                                to={item.url}
                                                onClick={() => setMobileOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                                    ? "bg-primary/10 text-primary border border-primary/20"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                                    }`}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                <span>{item.title}</span>
                                            </NavLink>
                                        );
                                    })}
                                </nav>
                                {profile && (
                                    <div className="mt-4 pt-4 border-t border-border flex flex-col gap-4">
                                        <div className="px-4 text-sm font-medium text-muted-foreground">
                                            Logged in as: <span className="text-foreground capitalize">{profile.role.replace('_', ' ')}</span>
                                        </div>
                                        <Button variant="ghost" className="w-full justify-start text-destructive" onClick={signOut}>
                                            <LogOut className="w-5 h-5 mr-3" />
                                            Sign Out
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
