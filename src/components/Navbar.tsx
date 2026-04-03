import { Scale, FileText, LayoutDashboard, GitCompare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/src/lib/utils";

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: FileText },
    { name: "Analysis", path: "/analysis", icon: LayoutDashboard },
    { name: "Comparison", path: "/comparison", icon: GitCompare },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Scale className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            ClauseBreaker<span className="text-indigo-600">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-indigo-600",
                location.pathname === item.path
                  ? "text-indigo-600"
                  : "text-gray-600"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-95">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
