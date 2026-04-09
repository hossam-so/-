import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  QrCode, 
  Users, 
  UtensilsCrossed
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  user: User;
  role: string | null;
}

const Layout: React.FC<LayoutProps> = ({ user, role }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { label: 'الرئيسية', icon: LayoutDashboard, path: '/', roles: ['admin', 'supervisor', 'student'] },
    { label: 'بطاقتي', icon: QrCode, path: '/student', roles: ['student'] },
    { label: 'المسح الضوئي', icon: UtensilsCrossed, path: '/supervisor', roles: ['supervisor', 'admin'] },
    { label: 'إدارة الطلاب', icon: Users, path: '/admin', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => !role || item.roles.includes(role));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">مطبخ سكن النبلاء</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex items-center gap-3 pl-6 border-r border-slate-200 dark:border-slate-800">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user.displayName || user.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {role === 'admin' ? 'مدير النظام' : role === 'supervisor' ? 'مشرف' : 'طالب'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-300"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            حقوق ملكية وتطوير © مطبخ سكن النبلاء
          </p>
          <p className="text-xs text-slate-400 mt-1">
            للتواصل: <a href="https://wa.me/967739542075" className="text-blue-500 hover:underline">+967739542075</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
