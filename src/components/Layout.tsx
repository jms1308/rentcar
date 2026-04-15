import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Key, 
  BarChart3, 
  UserCog, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase SignOut Error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Mashinalar', path: '/cars', icon: Car },
    { name: 'Mijozlar', path: '/clients', icon: Users },
    { name: 'Ijaralar', path: '/rentals', icon: Key },
    { name: 'Hisobotlar', path: '/reports', icon: BarChart3 },
  ];

  if (user.role === 'admin') {
    navItems.push({ name: 'Foydalanuvchilar', path: '/users', icon: UserCog });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1e3a5f] text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider text-blue-400">AUTORENT</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path) 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center space-x-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
              {user.full_name?.[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-[#1e3a5f] text-white rounded-lg shadow-lg"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 bg-[#1e3a5f] text-white flex flex-col">
            <div className="p-6 pt-16">
              <h1 className="text-2xl font-bold tracking-wider text-blue-400">AUTORENT</h1>
            </div>
            <nav className="flex-1 px-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path) 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-blue-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Chiqish</span>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
