// src/components/Header.jsx
import { useState } from 'react'; 
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const unreadNotifications = 3;

  const [clients] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", phone: "+1234567890", plan: "Premium" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "+0987654321", plan: "Basic" },
  ]);

  // ✅ FIXED: Support all roles and paths
  const getTitle = () => {
    const path = location.pathname;

    // Gym Owner
    if (path === '/gym/dashboard') return "Dashboard";
    if (path === '/gym/members') return "Members";
    if (path === '/gym/trainers') return "Trainers";
    if (path === '/gym/schedule') return "Schedule";
    if (path === '/gym/payments') return "Payments";
    if (path === '/gym/gym-profile') return "Gym Profile";

    // Trainer
    if (path === '/trainer/dashboard') return "Dashboard";
    if (path === '/trainer/clients') return "Clients";
    if (path === '/trainer/schedule') return "Schedule";
    if (path === '/trainer/payments') return "Payments";
    if (path === '/trainer/profile') return "My Profile";

    // Merchant
    if (path === '/merchant/dashboard') return "Dashboard";
    if (path === '/merchant/products') return "Products";
    if (path === '/merchant/orders') return "Orders";
    if (path === '/merchant/profile') return "My Profile";


    // Fallback
    return "Dashboard";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log("Search Results:", filtered);
    }
  };

  const handleNewClick = () => {
    setShowNewForm(true);
  };

  // ✅ FIXED: Support Merchant role
  const getCurrentFormType = () => {
    if (user?.role === 'GYM_OWNER') return 'trainer';
    if (user?.role === 'TRAINER') return 'client';
    if (user?.role === 'MERCHANT') return 'product';
    return 'client';
  };

  const handleSaveNewItem = (e) => {
    e.preventDefault();
    const formType = getCurrentFormType();
    const form = new FormData(e.target);

    let newItem = { id: Date.now() };

    if (formType === 'client') {
      newItem = {
        ...newItem,
        name: form.get('name'),
        email: form.get('email'),
        phone: form.get('phone'),
        plan: form.get('plan'),
      };
    } else if (formType === 'trainer') {
      newItem = {
        ...newItem,
        name: form.get('name'),
        specialization: form.get('specialization'),
        email: form.get('email'),
      };
    } else if (formType === 'product') {
      newItem = {
        ...newItem,
        name: form.get('name'),
        price: form.get('price'),
        category: form.get('category'),
      };
    }

    console.log(`New ${formType} added:`, newItem);
    setShowNewForm(false);
  };

  const handleCancel = () => setShowNewForm(false);

 const handleProfileClick = () => {
  if (user?.role === 'GYM_OWNER') navigate('/gym/gym-profile');
  else if (user?.role === 'TRAINER') navigate('/trainer/profile');
  else if (user?.role === 'MERCHANT') navigate('/merchant/profile'); 
  else navigate('/profile');
};

  const handleNotificationClick = () => navigate('/notifications');

  // ✅ FIXED: Show correct portal name
  const portalType = 
    user?.role === 'GYM_OWNER' ? 'Gym Portal' :
    user?.role === 'TRAINER' ? 'Trainer Portal' :
    user?.role === 'MERCHANT' ? 'Merchant Portal' :
    'User Portal';

  const formType = getCurrentFormType();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 px-6 py-4 h-[96px] flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-teal-400">Flexi-fit Pro</h1>
          <div className="flex items-baseline gap-4 mt-1">
            <p className="text-gray-400 text-sm">{portalType}</p>
            <p className="text-white font-medium">/ {getTitle()}</p>
          </div>
        </div>

        <div className="flex-1 max-w-lg mx-8">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 text-gray-200 px-4 py-2 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-700"
                aria-label="Search"
              />
              <svg
                className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleNotificationClick}
            className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
            title="Notifications"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold animate-pulse">
                {unreadNotifications}
              </span>
            )}
          </button>

          <button
            onClick={handleNewClick}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>

          <div className="relative">
            <button
              onClick={handleProfileClick}
              className="w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-400 flex items-center justify-center font-bold text-white transition-colors"
              title={user?.email || 'Profile'}
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : '?'}
            </button>
          </div>
        </div>
      </header>

      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              {formType === 'client' && "Add New Client"}
              {formType === 'trainer' && "Add New Trainer"}
              {formType === 'product' && "Add New Product"}
            </h2>

            <form onSubmit={handleSaveNewItem} className="space-y-4">
              {formType === 'client' && (
                <>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Full Name</label>
                    <input type="text" name="name" required className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600"/>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Email</label>
                    <input type="email" name="email" required className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600"/>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Phone</label>
                    <input type="tel" name="phone" required className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600"/>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Plan</label>
                    <select name="plan" required className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600">
                      <option value="">Select Plan</option>
                      <option value="Basic">Basic</option>
                      <option value="Pro">Pro</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                </>
              )}

              {formType === 'trainer' && (
                <>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Full Name</label>
                    <input type="text" name="name" required className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600"/>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Specialization</label>
                    <input type="text" name="specialization" required className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600"/>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Email</label>
                    <input type="email" name="email" required className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600"/>
                  </div>
                </>
              )}

              {formType === 'product' && (
                <>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Product Name</label>
                    <input type="text" name="name" required className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600"/>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Price ($)</label>
                    <input type="number" step="0.01" name="price" required className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600"/>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Category</label>
                    <input type="text" name="category" required className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600"/>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2 px-4 rounded-lg font-medium transition">Save</button>
                <button type="button" onClick={handleCancel} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg font-medium transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}