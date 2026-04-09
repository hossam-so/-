import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import BarcodeCard from './BarcodeCard';
import { motion } from 'motion/react';
import { History, Calendar, Utensils, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const StudentDashboard: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [mealHistory, setMealHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    };

    const q = query(
      collection(db, 'meals'),
      where('studentId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribeMeals = onSnapshot(q, (snapshot) => {
      const meals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMealHistory(meals);
      setLoading(false);
    });

    fetchUserData();
    return () => unsubscribeMeals();
  }, []);

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ID Card Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">بطاقة التغذية الإلكترونية</h2>
          </div>
          <div className="flex justify-center">
            <BarcodeCard userData={userData} />
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              * يرجى إبراز هذه البطاقة للمشرف عند استلام الوجبة.
              <br />
              * البطاقة تحتوي على رقمك الجامعي مشفر في الباركود.
            </p>
          </div>
        </section>

        {/* Stats & History Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">سجل الوجبات الأخير</h2>
          </div>

          <div className="space-y-3">
            {mealHistory.length > 0 ? (
              mealHistory.map((meal) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={meal.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {meal.mealType === 'lunch' ? 'غداء' : 'عشاء'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {format(new Date(meal.timestamp), 'eeee, d MMMM yyyy - HH:mm', { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
                      تم الاستلام
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">لا يوجد سجل وجبات حتى الآن</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
