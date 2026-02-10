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

const navItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Fleet & Compliance", url: "/fleet", icon: Truck },
    { title: "Orders", url: "/orders", icon: ClipboardList },
    { title: "Products & Pricing", url: "/products", icon: Package },
    { title: "Customers", url: "/customers", icon: Users },
    { title: "Finance", url: "/finance", icon: Banknote },
    { title: "Cement Payments", url: "/cement-payments", icon: Banknote },
    { title: "Reports", url: "/reports", icon: BarChart },
];

export function Navbar() {
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

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
                    {navItems.map((item) => {
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
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="hidden lg:flex ml-2"
                    aria-label="Toggle theme"
                >
                    {theme === "dark" ? (
                        <Sun className="w-5 h-5 transition-transform hover:rotate-12" />
                    ) : (
                        <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
                    )}
                </Button>

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
                            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open mobile menu">
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
                                    {navItems.map((item) => {
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
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
