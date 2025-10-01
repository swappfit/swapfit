import { Outlet } from 'react-router-dom';
import Header from '../Header'; // 👈 Import Header
import Sidebar from '../Sidebar';

export default function MainLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      {/* 👇 Fixed Header — renders on EVERY page */}
      <Header title="Dashboard" subtitle="Welcome back!" />

      {/* Sidebar + Scrollable Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 pt-[96px] ml-64 p-6 overflow-y-auto scrollbar-hide">
          <Outlet /> {/* This renders Dashboard, Clients, etc. */}
        </main>
      </div>
    </div>
  );
}