
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Package, Calculator, FileText, MessageSquare, TruckIcon, LogOut, Plane, DollarSign } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { CurrencyProvider, useCurrency } from "@/components/CurrencyProvider";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "New Order",
    url: createPageUrl("NewOrder"),
    icon: Package,
  },
  {
    title: "Cost Calculator",
    url: createPageUrl("CostCalculator"),
    icon: Calculator,
  },
  {
    title: "Generate Quote",
    url: createPageUrl("QuotationGenerator"),
    icon: FileText,
  },
  {
    title: "Flight Schedule",
    url: createPageUrl("FlightSchedule"),
    icon: Plane,
  },
  {
    title: "AI Assistant",
    url: createPageUrl("AIAssistant"),
    icon: MessageSquare,
  },
  {
    title: "Vendors",
    url: createPageUrl("Vendors"),
    icon: TruckIcon,
  },
];

function LayoutContent({ children }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const { currency, toggleCurrency } = useCurrency();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --cathay-green: #006564;
          --cathay-teal: #00877C;
          --cathay-light: #E8F5F4;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="border-b border-gray-200 p-4 bg-gradient-to-br from-[#006564] to-[#00877C]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-[#006564]" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">Cathay Cargo</h2>
                <p className="text-xs text-white/90">Quotation System</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-[#E8F5F4] hover:text-[#006564] transition-colors duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-[#E8F5F4] text-[#006564] font-medium' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4 space-y-3">
            <Button
              onClick={toggleCurrency}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              <span className="text-xs">Currency: {currency}</span>
            </Button>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#006564] to-[#00877C] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
              <button
                onClick={() => base44.auth.logout()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-semibold">Cathay Cargo</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function Layout({ children }) {
  return (
    <CurrencyProvider>
      <LayoutContent>{children}</LayoutContent>
    </CurrencyProvider>
  );
}
