import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc
} from 'firebase/firestore';
import { 
  Scan, 
  CheckCircle2, 
  XCircle, 
  User, 
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SupervisorDashboard: React.FC = () => {
  const [studentData, setStudentData] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [mealType, setMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const handleMealLog = React.useCallback(async (studentId: string) => {
    setStatus('loading');
    setMessage('جاري التحقق من البيانات...');

    try {
      // 1. Find student by studentId (from barcode)
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setStatus('error');
        setMessage('عذراً، الطالب غير مسجل في النظام');
        return;
      }

      const studentDoc = querySnapshot.docs[0];
      const student = studentDoc.data();
      setStudentData(student);

      // 2. Check if already had this meal today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const mealsRef = collection(db, 'meals');
      const mealQuery = query(
        mealsRef,
        where('studentId', '==', studentDoc.id),
        where('mealType', '==', mealType),
        where('timestamp', '>=', today.toISOString())
      );
      
      const mealSnapshot = await getDocs(mealQuery);

      if (!mealSnapshot.empty) {
        setStatus('error');
        setMessage(`تم تسجيل وجبة ال${mealType === 'lunch' ? 'غداء' : 'عشاء'} لهذا الطالب مسبقاً اليوم`);
        return;
      }

      // 3. Log the meal
      await addDoc(collection(db, 'meals'), {
        studentId: studentDoc.id,
        studentName: student.name,
        studentIdNum: student.studentId,
        supervisorId: auth.currentUser?.uid,
        mealType,
        timestamp: new Date().toISOString(),
        date: today.toISOString().split('T')[0]
      });

      setStatus('success');
      setMessage('تم تسجيل الوجبة بنجاح');
      
      // Add to recent scans
      setRecentScans(prev => [{
        id: Date.now(),
        name: student.name,
        time: new Date().toLocaleTimeString('ar-YE'),
        type: mealType
      }, ...prev].slice(0, 5));

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setMessage('حدث خطأ أثناء معالجة الطلب');
    }
  }, [mealType]);

  const onScanSuccess = React.useCallback(async (decodedText: string) => {
    if (status === 'loading') return;
    
    handleMealLog(decodedText);
  }, [status, handleMealLog]);

  function onScanFailure() {
    // console.warn(`Code scan error = ${error}`);
  }

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [onScanSuccess]);

  const resetScanner = () => {
    setStudentData(null);
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Scanner Section */}
        <div className="flex-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Scan className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold">ماسح الباركود</h2>
              </div>
              <select 
                value={mealType}
                onChange={(e) => setMealType(e.target.value as any)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="lunch">غداء</option>
                <option value="dinner">عشاء</option>
              </select>
            </div>
            
            <div className="p-6">
              <div id="reader" className="overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800"></div>
            </div>
          </div>

          {/* Recent Scans */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold">آخر عمليات المسح</h3>
            </div>
            <div className="space-y-3">
              {recentScans.map(scan => (
                <div key={scan.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{scan.name}</p>
                      <p className="text-[10px] text-slate-500">{scan.time}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full">ناجح</span>
                </div>
              ))}
              {recentScans.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-4">لا توجد عمليات مسح مؤخراً</p>
              )}
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="w-full md:w-80">
          <AnimatePresence mode="wait">
            {status !== 'idle' ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`h-full rounded-2xl p-8 flex flex-col items-center text-center justify-center space-y-6 shadow-xl border ${
                  status === 'loading' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
                  status === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                  'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}
              >
                {status === 'loading' && <Scan className="w-20 h-20 text-blue-600 animate-pulse" />}
                {status === 'success' && <CheckCircle2 className="w-20 h-20 text-green-600" />}
                {status === 'error' && <XCircle className="w-20 h-20 text-red-600" />}

                <div className="space-y-2">
                  <h3 className={`text-xl font-bold ${
                    status === 'loading' ? 'text-blue-800 dark:text-blue-200' :
                    status === 'success' ? 'text-green-800 dark:text-green-200' :
                    'text-red-800 dark:text-red-200'
                  }`}>
                    {status === 'loading' ? 'جاري المعالجة' : status === 'success' ? 'تم بنجاح' : 'خطأ في العملية'}
                  </h3>
                  <p className="text-sm opacity-80">{message}</p>
                </div>

                {studentData && (
                  <div className="w-full bg-white/50 dark:bg-black/20 p-4 rounded-xl space-y-2">
                    <p className="text-sm font-bold">{studentData.name}</p>
                    <p className="text-xs opacity-70">{studentData.studentId}</p>
                  </div>
                )}

                <button
                  onClick={resetScanner}
                  className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                  مسح جديد
                </button>
              </motion.div>
            ) : (
              <div className="h-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Scan className="w-8 h-8" />
                </div>
                <p className="text-slate-500 text-sm">بانتظار مسح باركود الطالب...</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
