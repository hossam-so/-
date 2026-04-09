import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Mail, Lock, User, Loader2, UtensilsCrossed, Chrome, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          role: 'student',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name,
          email,
          role: 'student', // Default role
          studentId,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-arabic">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-slate-200 dark:border-slate-800 relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600"></div>
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 mb-6 shadow-inner border border-blue-100 dark:border-blue-800">
            <UtensilsCrossed className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3 font-bold">
            أكاديمية النبلاء - نظام الإدارة الذكي
          </p>
        </div>

        <div className="space-y-6">
          {!showCredentials ? (
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:shadow-lg transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Chrome className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />}
                <span>المتابعة باستخدام جوجل</span>
              </button>
              
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-black uppercase tracking-widest">أو</span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              </div>

              <button
                onClick={() => setShowCredentials(true)}
                className="w-full py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl font-black text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                استخدام البريد الإلكتروني
              </button>
            </div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              <button 
                type="button"
                onClick={() => setShowCredentials(false)}
                className="text-blue-600 dark:text-blue-400 text-sm font-black flex items-center gap-1 mb-4 hover:underline"
              >
                <ArrowRight size={16} />
                العودة لخيارات الدخول
              </button>

              {!isLogin && (
                <>
                  <div className="relative">
                    <User className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="الاسم الكامل"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl outline-none transition-all font-bold"
                      required
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="الرقم الجامعي"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl outline-none transition-all font-bold"
                      required
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl outline-none transition-all font-bold"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl outline-none transition-all font-bold"
                  required
                />
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl font-bold border border-red-100 dark:border-red-900/30"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? 'دخول النظام' : 'إنشاء الحساب')}
              </button>
            </motion.form>
          )}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-black"
          >
            {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
