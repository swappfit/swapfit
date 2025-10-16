// src/components/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ====== SVG ICONS ======
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 
      01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 
      012-2h2a2 2 0 012 2v2a2 2 0 
      01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 
      012-2h2a2 2 0 012 2v2a2 2 0 
      01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 
      012-2h2a2 2 0 012 2v2a2 2 0 
      01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const MembersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 
      0 0112 0v1zm0 0h6v-1a6 6 
      0 00-9-5.197M13 7a4 4 0 
      11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const MessagesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const TrainersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 
      0 018 0zM12 14a7 7 0 00-7 
      7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const ScheduleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 
      21h14a2 2 0 002-2V7a2 2 0 
      00-2-2H5a2 2 0 00-2 2v12a2 
      2 0 002 2z"
    />
  </svg>
);

const PaymentsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 
      2 3 2 3 .895 3 2-1.343 
      2-3 2m0-8c1.11 0 2.08.402 
      2.599 1M12 8V7m0 1v8m0 
      0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 
      2.924-1.756 3.35 0a1.724 1.724 
      0 002.573 1.066c1.543-.94 
      3.31.826 2.37 2.37a1.724 1.724 
      0 001.065 2.572c1.756.426 
      1.756 2.924 0 3.35a1.724 1.724 
      0 00-1.066 2.573c.94 1.543-.826 
      3.31-2.37 2.37a1.724 1.724 
      0 00-2.572 1.065c-.426 1.756-2.924 
      1.756-3.35 0a1.724 1.724 
      0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 
      1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 
      0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 
      2.37-2.37.996.638 2.296.07 
      2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 
      0 3 3 0 016 0z"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 
      4H7m6 4v1a3 3 0 
      01-3 3H6a3 3 0 
      01-3-3V7a3 3 0 
      013-3h4a3 3 0 
      013 3v1"
    />
  </svg>
);

// Merchant icons
const ProductsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2h-4l-2-2-2 2H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17h16M10 21h4" />
  </svg>
);

const OrdersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
  </svg>
);

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
 console.log("USER IN SIDEBAR:", user);
  const getMenuItems = () => {
    const role =
      user?.role?.toUpperCase() ||
      user?.role?.name?.toUpperCase() ||
      user?.user?.role?.toUpperCase() ||
      "GUEST";

    switch (role) {
      case "GYM_OWNER":
  return [
    { name: "Dashboard", icon: <DashboardIcon />, path: "/gym/dashboard" },
    { name: "Members", icon: <MembersIcon />, path: "/gym/members" },
    { name: "Payments", icon: <PaymentsIcon />, path: "/gym/payments" },
    { name: "Gym Profile", icon: <ProfileIcon />, path: "/gym/gym-profile" },
  ];
      case "TRAINER":
  return [
    { name: "Dashboard", icon: <DashboardIcon />, path: "/trainer/dashboard" },
    { name: "Clients", icon: <MembersIcon />, path: "/trainer/clients" },
    { name: "Messages", icon: <MessagesIcon />, path: "/trainer/messages" },
    { name: "Payments", icon: <PaymentsIcon />, path: "/trainer/payments" },
    { name: "My Profile", icon: <ProfileIcon />, path: "/trainer/profile" },
  ];
     case "MERCHANT":
  return [
    { name: "Dashboard", icon: <DashboardIcon />, path: "/merchant/dashboard" },
    { name: "Products", icon: <ProductsIcon />, path: "/merchant/products" },
    { name: "Orders", icon: <OrdersIcon />, path: "/merchant/orders" },
    
    { name: "My Profile", icon: <ProfileIcon />, path: "/merchant/profile" },
  ];
      default:
        return [{ name: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" }];
    }
  };

  const menuItems = getMenuItems();
  const portalName = user?.role ? `${(user.role.name || user.role).replace("_", " ")} Portal` : "User Portal";

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-teal-400">Flexifit Pro</h1>
        <p className="text-sm text-gray-400 capitalize">{portalName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${
                isActive
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-gray-400 hover:bg-gray-800 hover:text-teal-400"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User Info */}
      <div className="p-4 border-t border-gray-700 mt-auto flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
            {user?.email ? user.email.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email || "User"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="text-gray-400 hover:text-red-500 transition-all duration-200 p-2 rounded hover:bg-gray-800"
        >
          <LogoutIcon />
        </button>
      </div>
    </div>
  );
}