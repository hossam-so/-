import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  limit,
  deleteDoc
} from 'firebase/firestore';
import { 
  Users, 
  Utensils, 
  Settings, 
  Search, 
  Download, 
  Trash2, 
  Shield,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'meals' | 'settings'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If it's iOS or other browsers, we still want to show the button in settings
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS && !isStandalone) {
      setShowInstallBtn(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBtn(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show manual instructions
      setShowInstallHelp(true);
    }
  };

  const fetchData = async () => {
    try {
      if (activeTab === 'users') {
        const snapshot = await getDocs(collection(db, 'users'));
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else if (activeTab === 'meals') {
        const q = query(collection(db, 'meals'), orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        setMeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      alert('خطأ في تحديث الرتبة');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        alert('خطأ في الحذف');
      }
    }
  };

  const clearDailyMeals = () => {
    if (window.confirm('هل أنت متأكد من إخفاء سجلات اليوم من الواجهة؟ ستبقى البيانات محفوظة في قاعدة البيانات ويمكنك تصديرها للإكسل.')) {
      setMeals([]);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.studentId?.includes(searchTerm) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي المستخدمين</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">وجبات اليوم</p>
            <p className="text-2xl font-bold">{meals.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">المشرفين</p>
            <p className="text-2xl font-bold">{users.filter(u => u.role === 'supervisor').length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'users' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            إدارة المستخدمين
          </button>
          <button
            onClick={() => setActiveTab('meals')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'meals' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            تقارير الوجبات
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'settings' ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            الإعدادات
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="بحث بالاسم، الرقم الجامعي، أو البريد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <Download className="w-4 h-4" />
                  تصدير البيانات
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-4 font-medium">المستخدم</th>
                      <th className="pb-4 font-medium">الرقم الجامعي</th>
                      <th className="pb-4 font-medium">الرتبة</th>
                      <th className="pb-4 font-medium">التاريخ</th>
                      <th className="pb-4 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="text-sm">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold">
                              {user.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold">{user.name}</p>
                              <p className="text-[10px] text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">{user.studentId || '-'}</td>
                        <td className="py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border-none rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="student">طالب</option>
                            <option value="supervisor">مشرف</option>
                            <option value="admin">مدير</option>
                          </select>
                        </td>
                        <td className="py-4 text-xs text-slate-500">
                          {user.createdAt ? format(new Date(user.createdAt), 'yyyy/MM/dd') : '-'}
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'meals' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">سجلات الوجبات الأخيرة</h3>
                <button 
                  onClick={clearDailyMeals}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg text-sm font-bold hover:bg-amber-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  إخفاء سجلات اليوم
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-4 font-medium">الطالب</th>
                      <th className="pb-4 font-medium">الوجبة</th>
                      <th className="pb-4 font-medium">المشرف</th>
                      <th className="pb-4 font-medium">الوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {meals.map((meal) => (
                      <tr key={meal.id} className="text-sm">
                        <td className="py-4">
                          <p className="font-bold">{meal.studentName}</p>
                          <p className="text-[10px] text-slate-500">{meal.studentIdNum}</p>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            meal.mealType === 'lunch' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {meal.mealType === 'lunch' ? 'غداء' : 'عشاء'}
                          </span>
                        </td>
                        <td className="py-4 text-xs">{meal.supervisorId?.substring(0, 8)}...</td>
                        <td className="py-4 text-xs text-slate-500">
                          {format(new Date(meal.timestamp), 'yyyy/MM/dd HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-md space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  إعدادات النظام العامة
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">تفعيل نظام المسح</span>
                    <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">السماح بتسجيل الطلاب ذاتياً</span>
                    <div className="w-10 h-5 bg-slate-300 dark:bg-slate-600 rounded-full relative">
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  {showInstallBtn && !isStandalone && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={handleInstallClick}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        <Download className="w-4 h-4" />
                        تثبيت التطبيق على الجهاز
                      </button>
                      
                      {showInstallHelp && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-top-2">
                          <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-2">طريقة التثبيت اليدوي:</p>
                          <ul className="text-[10px] text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                            <li>للآيفون: اضغط زر "مشاركة" ثم "إضافة إلى الشاشة الرئيسية".</li>
                            <li>للأندرويد: اضغط على الثلاث نقاط في المتصفح ثم "تثبيت التطبيق".</li>
                            <li>للكمبيوتر: اضغط على أيقونة التثبيت في شريط العنوان العلوي.</li>
                          </ul>
                        </div>
                      )}
                      
                      <p className="text-[10px] text-slate-500 mt-2 text-center">
                        سيتم إضافة أيقونة للتطبيق على شاشة جهازك ليعمل كبرنامج مستقل
                      </p>
                    </div>
                  )}
                  {isStandalone && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        التطبيق مثبت بالفعل على جهازك
                      </div>
                    </div>
                  )}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button 
                      onClick={() => {
                        if (confirm('هل أنت متأكد من مسح الذاكرة المؤقتة؟ سيتم إعادة تحميل التطبيق.')) {
                          if ('serviceWorker' in navigator) {
                            navigator.serviceWorker.getRegistrations().then(registrations => {
                              for (const registration of registrations) {
                                registration.unregister();
                              }
                              window.location.reload();
                            });
                          } else {
                            window.location.reload();
                          }
                        }
                      }}
                      className="w-full py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                    >
                      مسح الذاكرة المؤقتة وإعادة التشغيل
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
