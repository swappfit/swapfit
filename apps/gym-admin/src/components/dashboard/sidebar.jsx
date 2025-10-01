import React from "react"
import { Link, useLocation } from "react-router-dom"
import { 
  Home, 
  Users, 
  BarChart3, 
  Award, 
  Target, 
  Building2, 
  Bell, 
  Settings,
  X,
  LogOut,
  Calendar, // Schedules
  TrendingUp, // Reports
  Shield, // Access Logs
  CreditCard // Payments & Plans
} from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

const menuItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/user-management", label: "User Management", icon: Users }, // Combined: members, trainers, gym approvals
  { href: "/schedules", label: "Schedules", icon: Calendar },
  { href: "/payments-plans", label: "Payments & Plans", icon: CreditCard }, // Combined: payments, plans
  { href: "/reports", label: "Reports", icon: TrendingUp },
  { href: "/challenges", label: "Challenges", icon: Target },
  { href: "/badges", label: "Badge Manager", icon: Award },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/access-logs", label: "Access Logs", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ open, onClose }) {
  const location = useLocation()
  
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-lg flex flex-col",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gradient-brand">FitAdmin</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105",
                  isActive
                    ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-600 dark:text-green-400 border border-green-500/30 shadow-lg transform scale-105" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-md"
                )}
                onClick={onClose}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* Footer - Fixed */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </>
  )
}
