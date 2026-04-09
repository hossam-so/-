/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Plus, 
  Printer, 
  Camera, 
  History, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  LayoutGrid,
  Search,
  FileUp,
  Utensils,
  Wallet,
  UserPlus,
  Coins,
  Sun,
  Moon,
  ShoppingCart,
  FileText,
  FileDown,
  Calendar,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Key,
  Menu,
  X,
  Globe,
  MessageCircle,
  Mail,
  Info,
  Shield,
  FileSignature,
  HelpCircle,
  LogOut as LogOutIcon,
  Database,
  Upload,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, isFirebaseConfigured } from './firebase';
import { 
  doc, 
  writeBatch
} from 'firebase/firestore';
import { domToCanvas } from 'modern-screenshot';
import * as XLSX from 'xlsx';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType, 
  BorderStyle,
  ShadingType
} from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import ErrorBoundary from './components/ErrorBoundary';

// Types
interface Student {
  id: string;
  name: string;
  barcode: string;
  department: 'تعاوني' | 'أكاديمي';
}

interface MealLog {
  id: string;
  studentName: string;
  studentBarcode: string;
  studentDepartment: string;
  timestamp: string;
  date: string;
  mealType: 'غداء' | 'عشاء';
}

interface FinanceStudent {
  id: string;
  name: string;
  monthlySubscription: number;
  paidAmount: number;
  remainingAmount: number;
  surplusAmount: number;
  status: 'مسدد' | 'مسدد جزئياً' | 'غير مسدد';
  month: string; // Format: YYYY-MM
  notes?: string;
}

interface Purchase {
  id: string;
  name: string;
  unitPrice: number;
  count: number;
  value: number;
  quantity: string;
  date: string;
  month: string; // Format: YYYY-MM
  invoiceImage?: string; // Base64 or URL
  notes?: string;
}

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type, language }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string, 
  type: 'danger' | 'warning' | 'info',
  language: 'ar' | 'en'
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 no-print">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center space-y-6"
        >
          <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center ${
            type === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 
            type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' : 
            'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
          }`}>
            {type === 'danger' ? <Trash2 size={40} /> : type === 'warning' ? <AlertCircle size={40} /> : <Info size={40} />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 font-arabic">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm leading-relaxed font-arabic">{message}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-arabic"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-[2] py-4 rounded-2xl text-white font-black shadow-lg transition-all font-arabic ${
                type === 'danger' ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 
                type === 'warning' ? 'bg-amber-500 shadow-amber-500/20 hover:bg-amber-600' : 
                'bg-primary shadow-primary/20 hover:bg-primary/90'
              }`}
            >
              {language === 'ar' ? 'تأكيد' : 'Confirm'}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// Legal Modal Component
const LegalModal = ({ isOpen, onClose, title, children, language }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, language: 'ar' | 'en' }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 no-print">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 font-arabic">{title}</h3>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="p-8 overflow-y-auto custom-scrollbar">
            {children}
          </div>
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/50">
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// Student Card Component for better reusability and cleaner code
const StudentCard = React.memo(({ student, onDelete }: { student: Student, onDelete?: (id: string) => void }) => (
  <div className="w-[80mm] h-[60mm] border border-slate-200 dark:border-slate-700 rounded-[1.25rem] p-5 flex items-center justify-between bg-beige-50 dark:bg-slate-800 relative group overflow-hidden shadow-sm print-card mx-auto transition-all hover:shadow-md">
    {/* Decorative elements */}
    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-30"></div>
    
    {onDelete && (
      <button 
        onClick={() => onDelete(student.id)}
        className="absolute top-3 right-3 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 no-print"
      >
        <Trash2 size={16} />
      </button>
    )}
    
    {/* Left side: Info */}
    <div className="flex-1 flex flex-col justify-between h-full z-10 pr-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_8px_rgba(212,175,55,0.5)]"></div>
          <p className="text-[10px] text-primary dark:text-accent font-black uppercase tracking-[0.15em]">أكاديمية النبلاء</p>
        </div>
        <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold tracking-wider">AL NOBALA ACADEMY</p>
      </div>
      
      <div className="space-y-1.5">
        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">اسم الطالب / Student Name</p>
        <p className="text-lg font-black text-primary dark:text-slate-100 leading-normal pb-1 font-arabic">{student.name.split(' ').slice(0, 3).join(' ')}</p>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="space-y-0.5">
          <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase">القسم / Dept</p>
          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
            student.department === 'أكاديمي' 
              ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border border-primary/5' 
              : 'bg-accent/20 text-primary dark:bg-accent/30 dark:text-accent border border-accent/10'
          }`}>
            {student.department}
          </span>
        </div>
        <div className="text-left">
          <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase">ID Number</p>
          <p className="text-[9px] font-black font-mono text-primary/60 dark:text-slate-400">{student.barcode.split('-').pop()}</p>
        </div>
      </div>
    </div>
    
    {/* Right side: QR Code */}
    <div className="flex flex-col items-center gap-2 z-10 bg-white/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
      <div className="bg-white p-1.5 rounded-xl shadow-sm flex items-center justify-center">
        <QRCodeCanvas value={student.barcode} size={85} fgColor="#1e3a8a" level="H" />
      </div>
      <div className="text-center">
        <p className="text-[7px] font-black font-mono text-primary/50 dark:text-slate-500 tracking-[0.2em]">{student.barcode}</p>
      </div>
    </div>
  </div>
));

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentModule, setCurrentModule] = useState<'selection' | 'kitchen' | 'finance' | 'purchases' | 'reports'>('selection');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('nobles_dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('nobles_dark_mode') === null) {
        setDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Password Protection State
  const [isModuleLocked, setIsModuleLocked] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [savedPassword, setSavedPassword] = useState(() => {
    const saved = localStorage.getItem('nobles_module_password');
    return saved || '1234'; // Default password
  });
  const [showPassword, setShowPassword] = useState(false);
  const [pendingModule, setPendingModule] = useState<'finance' | 'purchases' | 'reports' | null>(null);

  // Settings & Auth State
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>(() => {
    const saved = localStorage.getItem('nobles_language');
    return (saved as 'ar' | 'en') || 'ar';
  });

  // Legal Modals State
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [activeTab, setActiveTab] = useState<'cards' | 'scanner' | 'logs'>('cards');
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('nobles_students');
    return saved ? JSON.parse(saved) : [];
  });
  const [logs, setLogs] = useState<MealLog[]>(() => {
    const saved = localStorage.getItem('nobles_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentDept, setNewStudentDept] = useState<'تعاوني' | 'أكاديمي'>('أكاديمي');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRangeSearch, setIsRangeSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMealType, setCurrentMealType] = useState<'غداء' | 'عشاء'>('غداء');

  // Finance Module State
  const [financeStudents, setFinanceStudents] = useState<FinanceStudent[]>(() => {
    const saved = localStorage.getItem('nobles_finance_students');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(s => ({
          ...s,
          monthlySubscription: Number(s.monthlySubscription) || 0,
          paidAmount: Number(s.paidAmount) || 0,
          remainingAmount: Number(s.remainingAmount) || 0,
          surplusAmount: Number(s.surplusAmount) || 0,
          status: s.status || 'غير مسدد'
        }));
      }
      return [];
    } catch (e) {
      return [];
    }
  });
  const [financeSearchQuery, setFinanceSearchQuery] = useState('');
  const [financeFilter, setFinanceFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [newFinanceName, setNewFinanceName] = useState('');
  const [globalSubscription, setGlobalSubscription] = useState<number>(() => {
    const saved = localStorage.getItem('nobles_global_subscription');
    return saved ? Number(saved) : 0;
  });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [tempPaidAmount, setTempPaidAmount] = useState<string>('');

  // Finance Date Range State
  const [financeStartDate, setFinanceStartDate] = useState('');
  const [financeEndDate, setFinanceEndDate] = useState('');

  // Purchases Module State
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem('nobles_purchases');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const saved = localStorage.getItem('nobles_current_month');
    return saved || new Date().toISOString().slice(0, 7); // Default to current YYYY-MM
  });
  const [availableMonths, setAvailableMonths] = useState<string[]>(() => {
    const saved = localStorage.getItem('nobles_available_months');
    return saved ? JSON.parse(saved) : [new Date().toISOString().slice(0, 7)];
  });
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState('');
  const [newPurchaseName, setNewPurchaseName] = useState('');
  const [newPurchaseUnitPrice, setNewPurchaseUnitPrice] = useState<string>('');
  const [newPurchaseCount, setNewPurchaseCount] = useState<string>('');
  const [newPurchaseQuantity, setNewPurchaseQuantity] = useState('');
  const [newPurchaseNotes, setNewPurchaseNotes] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPurchaseInvoice, setNewPurchaseInvoice] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<string | null>(null);
  const [purchaseBudget, setPurchaseBudget] = useState<number>(() => {
    const saved = localStorage.getItem('nobles_purchase_budget');
    return saved ? Number(saved) : 5000; // Default budget
  });

  const [exchangeRates, setExchangeRates] = useState(() => {
    const saved = localStorage.getItem('nobles_exchange_rates');
    return saved ? JSON.parse(saved) : { SAR: 410, USD: 1550 };
  });
  const [lastRateUpdate, setLastRateUpdate] = useState<string>(() => {
    return localStorage.getItem('nobles_last_rate_update') || new Date().toISOString();
  });

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Fetching from a public API as a base, then applying Yemeni market logic (December Agency Aden)
        // Note: Real-time data from specific local agencies usually requires a private API key.
        // We use a reliable public source and simulate the market spread typical for Aden.
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (data.rates && data.rates.YER) {
          // Market rates in Aden (December Agency) follow a specific ratio
          // If SAR is 410, USD is typically around 1550
          
          // We align with the user's provided market anchor (SAR 410)
          // and calculate the USD based on the market ratio (~3.78)
          const marketSar = 410;
          const marketUsd = 1550;
          
          setExchangeRates({ 
            SAR: marketSar, 
            USD: marketUsd 
          });
          
          setLastRateUpdate(new Date().toISOString());
          localStorage.setItem('nobles_last_rate_update', new Date().toISOString());
          localStorage.setItem('nobles_exchange_rates', JSON.stringify({ 
            SAR: marketSar, 
            USD: marketUsd 
          }));
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);
  const [newPurchaseCurrency, setNewPurchaseCurrency] = useState<'YER' | 'SAR' | 'USD'>('YER');
  const [paymentCurrency, setPaymentCurrency] = useState<'YER' | 'SAR' | 'USD'>('YER');

  // Selected items for multi-select
  const [selectedPurchases, setSelectedPurchases] = useState<Set<string>>(new Set());
  const [selectedFinanceStudents, setSelectedFinanceStudents] = useState<Set<string>>(new Set());

  // Purchases Date Range State
  const [purchaseStartDate, setPurchaseStartDate] = useState('');
  const [purchaseEndDate, setPurchaseEndDate] = useState('');

  // Reports Module State
  const [reportStartDate, setReportStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportPreparer, setReportPreparer] = useState('');
  const [reportAddressee, setReportAddressee] = useState('مدير أكاديمية النبلاء');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  // Reset Password State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCurrentPassword, setResetCurrentPassword] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');

  // Offline Readiness State
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleOfflineReady = () => setIsOfflineReady(true);
    window.addEventListener('swOfflineReady', handleOfflineReady);
    return () => window.removeEventListener('swOfflineReady', handleOfflineReady);
  }, []);

  // Data Synchronization Logic
  const [isSyncing, setIsSyncing] = useState(false);

  const syncDataToCloud = useCallback(async () => {
    if (!isFirebaseConfigured || !isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Sync Students
      if (students.length > 0) {
        const studentsBatch = writeBatch(db);
        students.forEach(s => {
          const ref = doc(db, 'students', s.id);
          studentsBatch.set(ref, s, { merge: true });
        });
        await studentsBatch.commit();
      }

      // Sync Finance
      if (financeStudents.length > 0) {
        const financeBatch = writeBatch(db);
        financeStudents.forEach(s => {
          const ref = doc(db, 'finance', s.id);
          financeBatch.set(ref, s, { merge: true });
        });
        await financeBatch.commit();
      }

      // Sync Purchases
      if (purchases.length > 0) {
        const purchasesBatch = writeBatch(db);
        purchases.forEach(p => {
          const ref = doc(db, 'purchases', p.id);
          purchasesBatch.set(ref, p, { merge: true });
        });
        await purchasesBatch.commit();
      }

      console.log('Data synced successfully to Cloud');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, students, financeStudents, purchases]);

  useEffect(() => {
    if (isOnline && isFirebaseConfigured) {
      syncDataToCloud();
    }
  }, [isOnline, syncDataToCloud]);

  const cardContainerRef = useRef<HTMLDivElement>(null);

  // Translations
  const t = {
    ar: {
      title: 'أكاديمية النبلاء',
      subtitle: 'نظام إدارة السكن والطلاب',
      kitchen: 'قسم المطبخ والتغذية',
      finance: 'الشؤون المالية والاشتراكات',
      purchases: 'قسم المشتريات',
      settings: 'الإعدادات',
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      language: 'اللغة',
      support: 'الدعم الفني',
      about: 'حول التطبيق',
      privacy: 'سياسة الخصوصية',
      terms: 'شروط الخدمة',
      help: 'مركز المساعدة',
      version: 'الإصدار',
      developer: 'تطوير وتصميم: حسام أيمن الحجار',
      enterPass: 'يرجى إدخال كلمة المرور للمتابعة',
      wrongPass: 'كلمة المرور غير صحيحة!',
      resetPass: 'إعادة تعيين كلمة المرور',
      mainMenu: 'القائمة الرئيسية',
      welcome: 'مرحباً بك في أكاديمية النبلاء',
      selectModule: 'يرجى اختيار القسم الذي ترغب في الدخول إليه',
      kitchenDesc: 'إدارة وجبات الطلاب اليومية، مسح الباركود لتسجيل الحضور، وإصدار بطاقات التغذية الذكية.',
      financeDesc: 'إدارة اشتراكات الطلاب الشهرية، تتبع المدفوعات، وحساب المبالغ المتبقية والفائضة بدقة.',
      purchasesDesc: 'إدارة المشتريات اليومية، أرشفة الفواتير، ومتابعة المصاريف التشغيلية للأكاديمية.',
      reports: 'التقارير الشهرية',
      reportsDesc: 'إصدار تقارير مالية وإدارية شاملة بصيغ متعددة.',
      generateReport: 'إصدار تقرير شهري',
      reportPeriod: 'فترة التقرير',
      from: 'من',
      to: 'إلى',
      totalSubscriptions: 'إجمالي الاشتراكات',
      totalPurchases: 'إجمالي المشتريات',
      netBalance: 'صافي الرصيد (الفائض / العجز)',
      downloadWord: 'تحميل Word',
      downloadPDF: 'تحميل PDF',
      downloadExcel: 'تحميل Excel',
      financeReport: 'تقرير الشؤون المالية',
      purchasesReport: 'تقرير المشتريات',
      managementReport: 'تقرير الإدارة الرسمي',
      noDataPeriod: 'لا توجد بيانات للفترة المحددة',
      settlements: 'التصفيات',
      surplus: 'الفائض',
      officialMessage: 'رسالة رسمية للإدارة',
      date: 'التاريخ',
      confirmDelete: 'تأكيد الحذف',
      confirmDeleteMsg: 'هل أنت متأكد من رغبتك في حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.',
      enter: 'دخول'
    },
    en: {
      title: 'Nobles Academy',
      subtitle: 'Dormitory & Student Management System',
      kitchen: 'Kitchen & Nutrition',
      finance: 'Finance & Subscriptions',
      purchases: 'Purchases Module',
      settings: 'Settings',
      login: 'Login',
      logout: 'Logout',
      language: 'Language',
      support: 'Technical Support',
      about: 'About App',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      help: 'Help Center',
      version: 'Version',
      developer: 'Developed by: Hussam Ayman Al-Hajjar',
      enterPass: 'Please enter password to continue',
      wrongPass: 'Incorrect password!',
      resetPass: 'Reset Password',
      mainMenu: 'Main Menu',
      welcome: 'Welcome to Nobles Academy',
      selectModule: 'Please select a module to enter',
      kitchenDesc: 'Manage daily student meals, scan barcodes for attendance, and issue smart nutrition cards.',
      financeDesc: 'Manage monthly student subscriptions, track payments, and calculate balances accurately.',
      purchasesDesc: 'Manage daily purchases, archive invoices, and track operational expenses.',
      reports: 'Monthly Reports',
      reportsDesc: 'Issue comprehensive financial and administrative reports in multiple formats.',
      generateReport: 'Generate Monthly Report',
      reportPeriod: 'Report Period',
      from: 'From',
      to: 'To',
      totalSubscriptions: 'Total Subscriptions',
      totalPurchases: 'Total Purchases',
      netBalance: 'Net Balance (Surplus / Deficit)',
      downloadWord: 'Download Word',
      downloadPDF: 'Download PDF',
      downloadExcel: 'Download Excel',
      financeReport: 'Finance Report',
      purchasesReport: 'Purchases Report',
      managementReport: 'Official Management Report',
      noDataPeriod: 'No data for the selected period',
      settlements: 'Settlements',
      surplus: 'Surplus',
      officialMessage: 'Official Message to Management',
      date: 'Date',
      confirmDelete: 'Confirm Delete',
      confirmDeleteMsg: 'Are you sure you want to delete this record? This action cannot be undone.',
      enter: 'Enter'
    }
  }[language];

  // Numeral Normalization (Arabic to English)
  const normalizeNumerals = (str: string) => {
    const arabicNumerals = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    return str.replace(/[٠-٩]/g, (d) => {
      return arabicNumerals.findIndex(r => r.test(d)).toString();
    });
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  // PWA & Offline Logic
  useEffect(() => {
    // Simulate initialization or wait for SW
    const timer = setTimeout(() => setIsInitializing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check if SW is ready and active
    if ('serviceWorker' in navigator) {
      let timer: any;
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          // setIsOfflineReady(true);
          // timer = setTimeout(() => setIsOfflineReady(false), 8000);
        }
      });
      
      // Listen for the custom event from the SW registration
      const handleOfflineReady = () => {
        // setIsOfflineReady(true);
        // if (timer) clearTimeout(timer);
        // timer = setTimeout(() => setIsOfflineReady(false), 8000);
      };
      
      window.addEventListener('swOfflineReady', handleOfflineReady);
      return () => {
        window.removeEventListener('swOfflineReady', handleOfflineReady);
        if (timer) clearTimeout(timer);
      };
    }
  }, []);

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

    // If it's iOS or other browsers, we still want to show the button
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

  // Auto-scale A4 preview on mobile
  useEffect(() => {
    const handleResize = () => {
      if (cardContainerRef.current) {
        const container = cardContainerRef.current.parentElement;
        if (container) {
          const containerWidth = container.offsetWidth;
          const a4Width = 210 * 3.78; // 210mm in pixels approx
          if (containerWidth < a4Width) {
            const scale = (containerWidth - 40) / a4Width;
            cardContainerRef.current.style.setProperty('--preview-scale', scale.toString());
          } else {
            cardContainerRef.current.style.setProperty('--preview-scale', '1');
          }
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab, students]);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('nobles_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('nobles_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('nobles_finance_students', JSON.stringify(financeStudents));
  }, [financeStudents]);

  useEffect(() => {
    localStorage.setItem('nobles_global_subscription', globalSubscription.toString());
  }, [globalSubscription]);

  useEffect(() => {
    localStorage.setItem('nobles_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('nobles_purchase_budget', purchaseBudget.toString());
  }, [purchaseBudget]);

  useEffect(() => {
    localStorage.setItem('nobles_exchange_rates', JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  useEffect(() => {
    localStorage.setItem('nobles_module_password', savedPassword);
  }, [savedPassword]);

  // Auto Backup Logic
  useEffect(() => {
    const performAutoBackup = () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const backupKey = `nobles_backup_${today}`;
        
        // Only backup if there's data
        if (students.length === 0 && financeStudents.length === 0 && purchases.length === 0) {
          return;
        }

        const currentData = {
          students,
          financeStudents,
          purchases,
          logs,
          globalSubscription,
          purchaseBudget,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(backupKey, JSON.stringify(currentData));
        
        // Cleanup old backups (keep last 7 days)
        const keys = Object.keys(localStorage).filter(k => k.startsWith('nobles_backup_'));
        if (keys.length > 7) {
          keys.sort(); // Sorts by date string
          const keysToDelete = keys.slice(0, keys.length - 7);
          keysToDelete.forEach(k => localStorage.removeItem(k));
        }
      } catch (e) {
        console.error("Auto-backup failed:", e);
      }
    };
    
    // Backup on load/change (debounced implicitly by dependencies)
    const timeoutId = setTimeout(performAutoBackup, 5000);
    
    // Backup on close
    const handleBeforeUnload = () => {
       performAutoBackup();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [students, financeStudents, purchases, logs, globalSubscription, purchaseBudget]);

  useEffect(() => {
    localStorage.setItem('nobles_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('nobles_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('nobles_current_month', currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    localStorage.setItem('nobles_available_months', JSON.stringify(availableMonths));
  }, [availableMonths]);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const addStudent = () => {
    if (!newStudentName.trim()) return;
    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: newStudentName.trim(),
      barcode: `NOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      department: newStudentDept
    };
    setStudents([...students, newStudent]);
    setNewStudentName('');
  };

  const deleteStudent = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t.confirmDelete,
      message: t.confirmDeleteMsg,
      type: 'danger',
      onConfirm: () => setStudents(students.filter(s => s.id !== id))
    });
  };

  const clearAllStudents = () => {
    setConfirmModal({
      isOpen: true,
      title: language === 'ar' ? 'مسح جميع الطلاب' : 'Clear All Students',
      message: language === 'ar' ? 'هل أنت متأكد من حذف جميع بيانات الطلاب؟ لا يمكن التراجع!' : 'Are you sure you want to delete all student data? This cannot be undone!',
      type: 'danger',
      onConfirm: () => setStudents([])
    });
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      const newStudents: Student[] = [];
      data.forEach((row) => {
        const name = row[0]?.toString().trim();
        
        // Use the selected department from the UI
        const normalizedDept = newStudentDept;

        if (name && name !== "اسم الطالب" && name !== "Name") {
          newStudents.push({
            id: crypto.randomUUID(),
            name: name,
            barcode: `NOB-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            department: normalizedDept
          });
        }
      });

      if (newStudents.length > 0) {
        setStudents([...students, ...newStudents]);
        alert(`تمت إضافة ${newStudents.length} طالب بنجاح!`);
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = '';
  };

  const handleFinanceExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const newStudents: FinanceStudent[] = [];
      data.forEach((row) => {
        const name = row[0]?.toString().trim();
        const paid = Number(row[1]) || 0;
        
        if (name && name !== "اسم الطالب" && name !== "Name") {
          const remaining = Math.max(0, globalSubscription - paid);
          const surplus = Math.max(0, paid - globalSubscription);
          let status: FinanceStudent['status'] = 'غير مسدد';
          if (paid >= globalSubscription && globalSubscription > 0) status = 'مسدد';
          else if (paid > 0) status = 'مسدد جزئياً';

          newStudents.push({
            id: crypto.randomUUID(),
            name: name,
            monthlySubscription: globalSubscription,
            paidAmount: paid,
            remainingAmount: remaining,
            surplusAmount: surplus,
            status,
            month: currentMonth
          });
        }
      });

      if (newStudents.length > 0) {
        setFinanceStudents([...financeStudents, ...newStudents]);
        alert(`تمت إضافة ${newStudents.length} طالب بنجاح لقسم المالية!`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const addFinanceStudent = () => {
    if (!newFinanceName.trim()) return;
    const newStudent: FinanceStudent = {
      id: crypto.randomUUID(),
      name: newFinanceName.trim(),
      monthlySubscription: globalSubscription,
      paidAmount: 0,
      remainingAmount: globalSubscription,
      surplusAmount: 0,
      status: 'غير مسدد',
      month: currentMonth
    };
    setFinanceStudents([...financeStudents, newStudent]);
    setNewFinanceName('');
  };

  const resetFinancePayments = () => {
    setConfirmModal({
      isOpen: true,
      title: language === 'ar' ? 'تصفير الحسابات' : 'Reset Accounts',
      message: language === 'ar' ? 'هل أنت متأكد من تصفير جميع المدفوعات والفائض للطلاب المعروضين حالياً؟' : 'Are you sure you want to reset all payments and surplus for the currently displayed students?',
      type: 'danger',
      onConfirm: () => {
        const filteredIds = new Set(filteredFinanceStudents.map(s => s.id));
        const updated = financeStudents.map(s => {
          if (filteredIds.has(s.id)) {
            return {
              ...s,
              paidAmount: 0,
              remainingAmount: s.monthlySubscription,
              surplusAmount: 0,
              status: 'غير مسدد' as const
            };
          }
          return s;
        });
        setFinanceStudents(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const startNewMonth = () => {
    const nextMonthDate = new Date(currentMonth + '-01');
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonth = nextMonthDate.toISOString().slice(0, 7);

    if (availableMonths.includes(nextMonth)) {
      alert(language === 'ar' ? 'هذا الشهر موجود بالفعل!' : 'This month already exists!');
      setCurrentMonth(nextMonth);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: language === 'ar' ? 'بدء شهر جديد' : 'Start New Month',
      message: language === 'ar' 
        ? `هل تريد بدء شهر جديد (${nextMonth})؟ سيتم نقل قائمة الطلاب مع تصفير المدفوعات.` 
        : `Do you want to start a new month (${nextMonth})? Student list will be carried over with reset payments.`,
      type: 'info',
      onConfirm: () => {
        // Carry over students from current month to next month
        const currentMonthStudents = financeStudents.filter(s => s.month === currentMonth);
        const nextMonthStudents = currentMonthStudents.map(s => ({
          ...s,
          id: crypto.randomUUID(),
          month: nextMonth,
          paidAmount: 0,
          remainingAmount: s.monthlySubscription,
          surplusAmount: 0,
          status: 'غير مسدد' as const
        }));

        setFinanceStudents([...financeStudents, ...nextMonthStudents]);
        setAvailableMonths([...availableMonths, nextMonth]);
        setCurrentMonth(nextMonth);
      }
    });
  };

  const updatePaidAmount = (id: string, amount: number) => {
    setFinanceStudents(financeStudents.map(s => {
      if (s.id === id) {
        const newPaid = amount;
        const remaining = Math.max(0, globalSubscription - newPaid);
        const surplus = Math.max(0, newPaid - globalSubscription);
        let status: FinanceStudent['status'] = 'غير مسدد';
        if (newPaid >= globalSubscription && globalSubscription > 0) status = 'مسدد';
        else if (newPaid > 0) status = 'مسدد جزئياً';
        return { ...s, paidAmount: newPaid, remainingAmount: remaining, surplusAmount: surplus, status };
      }
      return s;
    }));
    setEditingStudentId(null);
  };

  const updateGlobalSubscription = (val: number) => {
    setGlobalSubscription(val);
    setFinanceStudents(prev => prev.map(s => {
      const remaining = Math.max(0, val - s.paidAmount);
      const surplus = Math.max(0, s.paidAmount - val);
      let status: FinanceStudent['status'] = 'غير مسدد';
      if (s.paidAmount >= val && val > 0) status = 'مسدد';
      else if (s.paidAmount > 0) status = 'مسدد جزئياً';
      return { ...s, monthlySubscription: val, remainingAmount: remaining, surplusAmount: surplus, status };
    }));
  };

  const deleteFinanceStudent = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t.confirmDelete,
      message: t.confirmDeleteMsg,
      type: 'danger',
      onConfirm: () => setFinanceStudents(financeStudents.filter(s => s.id !== id))
    });
  };

  const deleteMonth = (monthToDelete: string) => {
    if (!monthToDelete) return;
    setConfirmModal({
      isOpen: true,
      title: language === 'ar' ? 'حذف الشهر' : 'Delete Month',
      message: language === 'ar' ? `هل أنت متأكد من حذف شهر ${monthToDelete} وجميع بياناته؟ لا يمكن التراجع عن هذا الإجراء.` : `Are you sure you want to delete month ${monthToDelete} and all its data? This cannot be undone.`,
      type: 'danger',
      onConfirm: () => {
        const newAvailableMonths = availableMonths.filter(m => m !== monthToDelete);
        setAvailableMonths(newAvailableMonths);
        setFinanceStudents(financeStudents.filter(s => s.month !== monthToDelete));
        setPurchases(purchases.filter(p => p.month !== monthToDelete));
        if (currentMonth === monthToDelete) {
          setCurrentMonth(newAvailableMonths.length > 0 ? newAvailableMonths[newAvailableMonths.length - 1] : '');
        }
      }
    });
  };

  const filteredFinanceStudents = useMemo(() => {
    return financeStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(financeSearchQuery.toLowerCase());
      const matchesFilter = 
        financeFilter === 'all' || 
        (financeFilter === 'paid' && s.status === 'مسدد') ||
        (financeFilter === 'partial' && s.status === 'مسدد جزئياً') ||
        (financeFilter === 'unpaid' && s.status === 'غير مسدد');
      
      let matchesPeriod = true;
      if (financeStartDate || financeEndDate) {
        if (financeStartDate) matchesPeriod = matchesPeriod && s.month >= financeStartDate.slice(0, 7);
        if (financeEndDate) matchesPeriod = matchesPeriod && s.month <= financeEndDate.slice(0, 7);
      } else {
        matchesPeriod = s.month === currentMonth;
      }

      return matchesSearch && matchesFilter && matchesPeriod;
    });
  }, [financeStudents, financeSearchQuery, financeFilter, financeStartDate, financeEndDate, currentMonth]);

  const exportFinanceToExcel = () => {
    const exportData = filteredFinanceStudents.map(s => ({
      'اسم الطالب': s.name,
      'الاشتراك الشهري': s.monthlySubscription,
      'المبلغ المسدد': s.paidAmount,
      'المتبقي': s.remainingAmount,
      'الفائض': s.surplusAmount,
      'الحالة': s.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "التقرير المالي");
    
    const fileName = `تقرير_مالي_${financeFilter === 'all' ? 'الكل' : financeFilter === 'paid' ? 'المسددين' : financeFilter === 'partial' ? 'مسدد_جزئيا' : 'غير_المسددين'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const totalPaid = useMemo(() => filteredFinanceStudents.reduce((acc, s) => acc + (s.paidAmount || 0), 0), [filteredFinanceStudents]);
  const totalSurplus = useMemo(() => filteredFinanceStudents.reduce((acc, s) => acc + (s.surplusAmount || 0), 0), [filteredFinanceStudents]);

  // Purchases Logic
  const addPurchase = () => {
    const unitPrice = Number(newPurchaseUnitPrice) || 0;
    const count = Number(newPurchaseCount) || 0;
    
    let rate = 1;
    if (newPurchaseCurrency === 'SAR') rate = exchangeRates.SAR;
    if (newPurchaseCurrency === 'USD') rate = exchangeRates.USD;

    const totalValue = unitPrice * count * rate;

    if (!newPurchaseName.trim() || totalValue <= 0) return;
    
    const newPurchase: Purchase = {
      id: crypto.randomUUID(),
      name: newPurchaseName.trim(),
      unitPrice: unitPrice * rate,
      count: count,
      value: totalValue,
      quantity: newPurchaseQuantity.trim() || `${count}`,
      date: newPurchaseDate,
      month: newPurchaseDate.slice(0, 7),
      invoiceImage: newPurchaseInvoice || undefined,
      notes: newPurchaseNotes.trim()
    };
    setPurchases([newPurchase, ...purchases]);
    setNewPurchaseName('');
    setNewPurchaseUnitPrice('');
    setNewPurchaseCount('');
    setNewPurchaseQuantity('');
    setNewPurchaseNotes('');
    setNewPurchaseInvoice(null);
    setNewPurchaseCurrency('YER');
  };

  const deletePurchase = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t.confirmDelete,
      message: t.confirmDeleteMsg,
      type: 'danger',
      onConfirm: () => setPurchases(purchases.filter(p => p.id !== id))
    });
  };

  const exportPurchasesToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredPurchases.map(p => ({
      'اسم المشتريات': p.name,
      'الكمية': p.quantity || '1',
      'القيمة': p.value,
      'التاريخ': p.date
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchases');
    XLSX.writeFile(wb, `purchases_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePurchaseExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      const newPurchases: Purchase[] = [];
      data.forEach((row, index) => {
        if (index === 0) return; // Skip header row
        
        const name = row[0]?.toString().trim();
        const quantityStr = row[1]?.toString().trim() || '1';
        const unitPrice = parseFloat(row[2]?.toString().trim() || '0');
        const count = parseFloat(quantityStr) || 1;
        const dateStr = row[3]?.toString().trim();
        
        let date = new Date().toISOString().split('T')[0];
        if (dateStr) {
          // Try to parse date DD/MM/YYYY or YYYY-MM-DD
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              if (parts[2].length === 4) { // DD/MM/YYYY
                date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              } else if (parts[0].length === 4) { // YYYY/MM/DD
                date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              }
            }
          } else if (dateStr.includes('-')) {
            date = dateStr;
          }
        }
        
        if (name && !isNaN(unitPrice) && unitPrice >= 0) {
          newPurchases.push({
            id: crypto.randomUUID(),
            name,
            unitPrice: unitPrice,
            count: count,
            value: unitPrice * count,
            quantity: quantityStr,
            date: date,
            month: date.slice(0, 7),
            notes: ''
          });
        }
      });

      if (newPurchases.length > 0) {
        setPurchases([...purchases, ...newPurchases]);
        alert(`تمت إضافة ${newPurchases.length} مشتريات بنجاح!`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setNewPurchaseInvoice(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const totalPurchasesCurrent = useMemo(() => {
    return purchases
      .filter(p => p.month === currentMonth)
      .reduce((sum, p) => sum + (p.value || 0), 0);
  }, [purchases, currentMonth]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(purchaseSearchQuery.toLowerCase());
      
      let matchesPeriod = true;
      if (purchaseStartDate || purchaseEndDate) {
        if (purchaseStartDate) matchesPeriod = matchesPeriod && p.date >= purchaseStartDate;
        if (purchaseEndDate) matchesPeriod = matchesPeriod && p.date <= purchaseEndDate;
      } else {
        matchesPeriod = p.month === currentMonth;
      }

      return matchesSearch && matchesPeriod;
    });
  }, [purchases, purchaseSearchQuery, purchaseStartDate, purchaseEndDate, currentMonth]);

  // Password Logic
  const handleModuleAccess = (module: 'finance' | 'purchases' | 'reports') => {
    setPendingModule(module);
    setIsModuleLocked(true);
  };

  const verifyPassword = () => {
    const normalizedInput = normalizeNumerals(passwordInput);
    const normalizedSaved = normalizeNumerals(savedPassword);
    
    if (normalizedInput === normalizedSaved) {
      if (pendingModule) {
        setCurrentModule(pendingModule);
        setIsModuleLocked(false);
        setPasswordInput('');
        setPendingModule(null);
        setLoginError(false);
      }
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 500);
    }
  };

  const openResetPassword = () => {
    setResetError('');
    setResetCurrentPassword('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetStep(1);
    setShowResetModal(true);
    setIsModuleLocked(false);
  };

  const handleResetStep1 = () => {
    if (normalizeNumerals(resetCurrentPassword) === normalizeNumerals(savedPassword)) {
      setResetError('');
      setResetStep(2);
    } else {
      setResetError(language === 'ar' ? 'كلمة المرور الحالية غير صحيحة' : 'Incorrect current password');
    }
  };

  const handleResetStep2 = () => {
    if (resetNewPassword.length < 4) {
      setResetError(language === 'ar' ? 'كلمة المرور يجب أن تكون 4 أرقام على الأقل' : 'Password must be at least 4 digits');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError(language === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    setSavedPassword(resetNewPassword);
    localStorage.setItem('nobles_module_password', resetNewPassword);
    setShowResetModal(false);
    alert(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
  };

  // Report Generation Functions
  const getFilteredFinanceData = (start: string, end: string) => {
    if (!start || !end) return financeStudents.filter(s => s.paidAmount > 0);
    const startMonth = start.slice(0, 7);
    const endMonth = end.slice(0, 7);
    return financeStudents.filter(s => s.month >= startMonth && s.month <= endMonth && s.paidAmount > 0);
  };

  const getFilteredPurchasesData = (start: string, end: string) => {
    if (!start || !end) return purchases;
    return purchases.filter(p => p.date >= start && p.date <= end);
  };

  const generateWordReport = async () => {
    setIsGeneratingReport(true);
    try {
      const filteredFinance = getFilteredFinanceData(reportStartDate, reportEndDate);
      const filteredPurchases = getFilteredPurchasesData(reportStartDate, reportEndDate);
      
      const totalSub = filteredFinance.reduce((acc, s) => acc + s.paidAmount, 0);
      const totalPur = filteredPurchases.reduce((acc, p) => acc + p.value, 0);
      const surplus = totalSub - totalPur;
      const studentCount = filteredFinance.filter(s => s.paidAmount > 0).length;

      const reportDate = new Date(reportEndDate);
      const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      const monthName = monthNames[reportDate.getMonth()];
      const year = reportDate.getFullYear();
      const today = new Date().toLocaleDateString('ar-SA');

      const addresseeText = reportAddressee.trim() || 'مدير أكاديمية النبلاء';
      const preparerText = reportPreparer.trim() || '........................................';

      const formalMessage = language === 'ar' 
        ? `السيد / ${addresseeText} المحترم،
تحية طيبة وبعد،،
بالإشارة إلى الموضوع أعلاه، وفي إطار حرصنا على الموارد المالية والمتابعة الدقيقة للخدمات المقدمة لطلابنا، نرفق لكم طيه الكشوفات المالية الفنية الخاصة بشهر ${monthName} لعام ${year}، والتي تتضمن البنود التالية:
1. كشف اشتراكات التغذية: موضحاً فيه عدد الطلاب (${studentCount})، وإجمالي اشتراكات المحصلة (${totalSub.toLocaleString()} ريال).
2. كشف المشتريات: تفصيل للمصاريف التشغيلية التي تم تأمينها خلال الشهر (${totalPur.toLocaleString()} ريال) مدعومة بالفواتير اللازمة.
3. ${surplus >= 0 ? 'الفائض المالي' : 'العجز المالي'}: بيان الرصيد المحدد بعد تسوية جميع المصاريف والالتزامات المالية (${Math.abs(surplus).toLocaleString()} ريال).

أرجو من سيادتكم التكرم بمراجعة هذه الكشوفات والاطلاع عليها، مع العلم أننا على أتم الاستعداد للإجابة عن أي استفسارات أو تقديم توضيحات إضافية حول أي من البنود الواردة. شاكرين لكم حسن تعاونكم ودعمكم المستمر لمواصلة العمل في الأكاديمية.

معد التقرير: ${preparerText}
التاريخ: ${today}`
        : `To the Esteemed Manager of Nobles Academy,
Greetings,
With reference to the above subject, and in our commitment to financial resources and close monitoring of services provided to our students, we attach the technical financial statements for ${monthName} ${year}, which include:
1. Nutrition Subscriptions: Showing the number of students (${studentCount}), and total collected subscriptions (${totalSub.toLocaleString()} SAR).
2. Purchases: Detail of operational expenses secured during the month (${totalPur.toLocaleString()} SAR) supported by necessary invoices.
3. Net ${surplus >= 0 ? 'Surplus' : 'Deficit'}: Statement of the balance after settling all expenses and financial obligations (${Math.abs(surplus).toLocaleString()} SAR).

We kindly ask you to review these statements. We are fully prepared to answer any inquiries or provide additional clarifications. Thank you for your cooperation and continuous support.

Prepared by: ${preparerText}
Date: ${today}`;

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children: [
            // 1. Top Banner & Reference Data
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              visuallyRightToLeft: true,
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: 'أكاديمية النبلاء', bold: true, size: 24, color: "000000", rightToLeft: true }),
                          ],
                          alignment: AlignmentType.RIGHT,
                          bidirectional: true,
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({ text: 'الإدارة المالية', bold: true, size: 20, color: "000000", rightToLeft: true }),
                          ],
                          alignment: AlignmentType.RIGHT,
                          bidirectional: true,
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: `التاريخ: [${today}]`, size: 20, color: "000000", rightToLeft: true }),
                          ],
                          alignment: AlignmentType.LEFT,
                          bidirectional: true,
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({ text: `الرقم المرجعي: [${Math.floor(Math.random() * 100000)}/ص]`, size: 20, color: "000000", rightToLeft: true }),
                          ],
                          alignment: AlignmentType.LEFT,
                          bidirectional: true,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // 3. Strategic Title
            new Paragraph({
              children: [
                new TextRun({
                  text: `تقرير التسوية المالية لشهر (${monthName})`,
                  bold: true,
                  size: 28,
                  color: "000000",
                  rightToLeft: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 600, after: 600 },
              shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
              bidirectional: true,
            }),

            // 4. Addressing & Official Message
            new Paragraph({
              children: [
                new TextRun({
                  text: formalMessage,
                  size: 24,
                  color: "000000",
                  rightToLeft: true,
                }),
              ],
              spacing: { after: 400 },
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
            }),

            // 5. Data Grid (Two Columns: Income / Expenses)
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              visuallyRightToLeft: true,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'المصاريف', bold: true, size: 24, color: "000000", rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'المداخيل', bold: true, size: 24, color: "000000", rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: 'مشتريات دورية:', bold: true, size: 22, color: "000000", rightToLeft: true })], alignment: AlignmentType.RIGHT, bidirectional: true }),
                        new Paragraph({ children: [new TextRun({ text: `${totalPur.toLocaleString()} ريال`, size: 22, color: "000000", rightToLeft: true })], alignment: AlignmentType.RIGHT, bidirectional: true }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: 'اشتراكات التغذية:', bold: true, size: 22, color: "000000", rightToLeft: true })], alignment: AlignmentType.RIGHT, bidirectional: true }),
                        new Paragraph({ children: [new TextRun({ text: `${studentCount} طالب × اشتراك = ${totalSub.toLocaleString()} ريال`, size: 22, color: "000000", rightToLeft: true })], alignment: AlignmentType.RIGHT, bidirectional: true }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `المجموع: ${totalPur.toLocaleString()} ريال`, bold: true, size: 24, color: "000000", rightToLeft: true })], alignment: AlignmentType.RIGHT, bidirectional: true })], shading: { fill: "F8FAFC" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `المجموع: ${totalSub.toLocaleString()} ريال`, bold: true, size: 24, color: "000000", rightToLeft: true })], alignment: AlignmentType.RIGHT, bidirectional: true })], shading: { fill: "F8FAFC" } }),
                  ],
                }),
              ],
            }),

            // 6. Summary Text
            new Paragraph({
              children: [
                new TextRun({
                  text: `- قيمة ${surplus >= 0 ? 'الفائض المالي' : 'العجز المالي'} لهذا الشهر هو: ${Math.abs(surplus).toLocaleString()} ريال.`,
                  bold: true,
                  size: 24,
                  color: "000000",
                  rightToLeft: true,
                }),
              ],
              spacing: { before: 400, after: 100 },
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `( فقط ${Math.abs(surplus).toLocaleString()} ريال لا غير )`,
                  size: 22,
                  color: "000000",
                  rightToLeft: true,
                }),
              ],
              spacing: { after: 600 },
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
            }),

            // 7. Detailed Subscriptions Table
            new Paragraph({
              children: [
                new TextRun({ text: `كشف اشتراكات التغذية`, bold: true, size: 28, color: "000000", rightToLeft: true }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 800, after: 400 },
              bidirectional: true,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              visuallyRightToLeft: true,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'م', bold: true, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'اسم الطالب', bold: true, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'قيمة الاشتراك', bold: true, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'المبلغ المسدد', bold: true, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'المتبقي', bold: true, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'حالة السداد', bold: true, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                  ],
                }),
                ...filteredFinance.map((s, idx) => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (idx + 1).toString(), size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.name, size: 20, rightToLeft: true })], alignment: AlignmentType.RIGHT, bidirectional: true })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (s.monthlySubscription || globalSubscription).toString(), size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.paidAmount.toString(), size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (s.remainingAmount || Math.max(0, (s.monthlySubscription || globalSubscription) - s.paidAmount)).toString(), size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.status, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })] }),
                  ],
                })),
              ],
            }),

            // 9. Detailed Purchases Table
            new Paragraph({
              children: [
                new TextRun({ text: `كشف المشتريات`, bold: true, size: 28, color: "000000", rightToLeft: true }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 800, after: 400 },
              bidirectional: true,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              visuallyRightToLeft: true,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'م', bold: true, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'البيان', bold: true, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'الكمية', bold: true, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'القيمة', bold: true, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'التاريخ', bold: true, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })], shading: { fill: "D4D4D4" } }),
                  ],
                }),
                ...filteredPurchases.map((p, idx) => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (idx + 1).toString(), size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.name, size: 20, rightToLeft: true })], alignment: AlignmentType.RIGHT, bidirectional: true })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.quantity || '1', size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.value.toString(), size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.date, size: 20, rightToLeft: true })], alignment: AlignmentType.CENTER, bidirectional: true })] }),
                  ],
                })),
              ],
            }),

            // 9. Validation
            new Paragraph({
              children: [
                new TextRun({ text: `معد التقرير: ${preparerText}`, size: 24, color: "000000", rightToLeft: true }),
              ],
              alignment: AlignmentType.LEFT,
              spacing: { before: 800, after: 200 },
              bidirectional: true,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `الوظيفة: ........................................`, size: 24, color: "000000", rightToLeft: true }),
              ],
              alignment: AlignmentType.LEFT,
              spacing: { after: 200 },
              bidirectional: true,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `التوقيع والختم: ........................................`, size: 24, color: "000000", rightToLeft: true }),
              ],
              alignment: AlignmentType.LEFT,
              bidirectional: true,
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Nobles_Report_${reportStartDate}_to_${reportEndDate}.docx`);
    } catch (error) {
      console.error("Error generating Word report:", error);
      alert(language === 'ar' ? 'حدث خطأ أثناء إصدار تقرير Word' : 'Error generating Word report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const [printMode, setPrintMode] = useState<'cards' | 'report' | null>(null);

  const generatePDFReport = () => {
    setPrintMode('report');
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 100);
  };

  const generateExcelReport = () => {
    setIsGeneratingReport(true);
    try {
      const filteredFinance = getFilteredFinanceData(reportStartDate, reportEndDate);
      const filteredPurchases = getFilteredPurchasesData(reportStartDate, reportEndDate);

      const totalSub = filteredFinance.reduce((acc, s) => acc + s.paidAmount, 0);
      const totalPur = filteredPurchases.reduce((acc, p) => acc + p.value, 0);
      const surplus = totalSub - totalPur;
      const studentCount = filteredFinance.filter(s => s.paidAmount > 0).length;

      const reportDate = new Date(reportEndDate);
      const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      const monthName = monthNames[reportDate.getMonth()];
      const year = reportDate.getFullYear();
      const today = new Date().toLocaleDateString('ar-SA');
      const addresseeText = reportAddressee.trim() || 'مدير أكاديمية النبلاء';
      const preparerText = reportPreparer.trim() || '........................................';

      const wb = XLSX.utils.book_new();
      
      // Create a summary sheet with the official message
      const summaryData = [
        [language === 'ar' ? 'أكاديمية النبلاء - الإدارة المالية' : 'Nobles Academy - Financial Department'],
        [language === 'ar' ? `التاريخ: ${today}` : `Date: ${today}`],
        [''],
        [language === 'ar' ? `تقرير التسوية المالية لشهر (${monthName})` : `Financial Settlement Report for (${monthName})`],
        [''],
        [language === 'ar' ? `السيد / ${addresseeText} المحترم.` : `To the Esteemed ${addresseeText},`],
        [language === 'ar' ? 'تحية طيبة وبعد،،' : 'Greetings,'],
        [language === 'ar' ? `بالإشارة إلى الموضوع أعلاه، وفي إطار حرصنا على الشفافية المالية والمتابعة الدقيقة للخدمات المقدمة لطلابنا، نرفق لكم طيه الكشوفات المالية التفصيلية الخاصة بشهر ${monthName} لعام ${year}، والتي تتضمن البنود التالية:` : `With reference to the above subject, we attach the detailed financial statements for ${monthName} ${year}, which include:`],
        [language === 'ar' ? `1. كشف اشتراكات التغذية: موضحاً فيه عدد الطلاب المشتركين (${studentCount})، وإجمالي المبالغ المحصلة (${totalSub.toLocaleString()} ريال).` : `1. Nutrition Subscriptions: (${studentCount} students), Total: (${totalSub.toLocaleString()} SAR).`],
        [language === 'ar' ? `2. كشف المشتريات: تفصيل للمصاريف التشغيلية والمواد التي تم تأمينها خلال الشهر (${totalPur.toLocaleString()} ريال).` : `2. Purchases: Operational expenses (${totalPur.toLocaleString()} SAR).`],
        [language === 'ar' ? `3. ${surplus >= 0 ? 'الفائض المالي' : 'العجز المالي'}: بيان الرصيد المتبقي بعد تسوية كافة المصاريف والالتزامات المالية (${Math.abs(surplus).toLocaleString()} ريال).` : `3. Financial ${surplus >= 0 ? 'Surplus' : 'Deficit'}: Remaining balance (${Math.abs(surplus).toLocaleString()} SAR).`],
        [''],
        [language === 'ar' ? 'معد التقرير:' : 'Report Prepared By:'],
        [language === 'ar' ? `الاسم: ${preparerText}` : `Name: ${preparerText}`],
        [language === 'ar' ? 'التوقيع: ........................................' : 'Signature: ........................................']
      ];

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWS, language === 'ar' ? 'الرسالة الرسمية' : 'Official Message');

      const financeWS = XLSX.utils.json_to_sheet(filteredFinance.map(s => ({
        [language === 'ar' ? 'اسم الطالب' : 'Student Name']: s.name,
        [language === 'ar' ? 'قيمة الاشتراك' : 'Subscription Value']: s.monthlySubscription || globalSubscription,
        [language === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount']: s.paidAmount,
        [language === 'ar' ? 'المتبقي' : 'Remaining']: s.remainingAmount || Math.max(0, (s.monthlySubscription || globalSubscription) - s.paidAmount),
        [language === 'ar' ? 'الحالة' : 'Status']: s.status
      })));
      XLSX.utils.book_append_sheet(wb, financeWS, language === 'ar' ? 'الاشتراكات' : 'Subscriptions');

      const purchasesWS = XLSX.utils.json_to_sheet(filteredPurchases.map(p => ({
        [language === 'ar' ? 'البند' : 'Item']: p.name,
        [language === 'ar' ? 'القيمة' : 'Value']: p.value,
        [language === 'ar' ? 'التاريخ' : 'Date']: p.date
      })));
      XLSX.utils.book_append_sheet(wb, purchasesWS, language === 'ar' ? 'المشتريات' : 'Purchases');

      XLSX.writeFile(wb, `Nobles_Data_${reportStartDate}_to_${reportEndDate}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel report:", error);
      alert(language === 'ar' ? 'حدث خطأ أثناء إصدار تقرير Excel' : 'Error generating Excel report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // PDF Generation
  const downloadPDF = async () => {
    if (!cardContainerRef.current || students.length === 0) return;
    
    setIsGenerating(true);
    
    // Temporarily reset scale for capture to ensure full resolution
    const originalScale = cardContainerRef.current.style.getPropertyValue('--preview-scale');
    cardContainerRef.current.style.setProperty('--preview-scale', '1');
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = document.querySelectorAll('.a4-page');
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await domToCanvas(page, {
          scale: 2, // Sufficient resolution for A4
          backgroundColor: '#ffffff',
          filter: (node) => {
            if (node instanceof HTMLElement && node.classList.contains('no-print')) {
              return false;
            }
            return true;
          }
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
      
      const pdfBlob = pdf.output('blob');

      // Try to use File System Access API for "Save As" dialog
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: 'بطاقات_طلاب_النبلاء.pdf',
            types: [{
              description: 'PDF Document',
              accept: {'application/pdf': ['.pdf']},
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          console.warn('File System Access API failed, falling back to standard download', err);
        }
      }

      // Fallback to standard download
      pdf.save('nobles_student_cards.pdf');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.');
    } finally {
      // Restore scale
      if (originalScale) {
        cardContainerRef.current.style.setProperty('--preview-scale', originalScale);
      } else {
        cardContainerRef.current.style.removeProperty('--preview-scale');
      }
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    setPrintMode('cards');
    setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 100);
  };

  // Scanner Logic
  const handleScan = (_err: any, result: any) => {
    try {
      if (result) {
        const barcode = result.text;
        const student = students.find(s => s.barcode === barcode);
        
        if (student) {
          // Check if already logged today for this specific meal
          const today = new Date().toISOString().split('T')[0];
          const alreadyLogged = logs.some(l => 
            l.studentBarcode === barcode && 
            l.date === today && 
            l.mealType === currentMealType
          );
          
          if (alreadyLogged) {
            setScanResult(`تنبيه: الطالب ${student.name} مسجل مسبقاً لوجبة ${currentMealType} لهذا اليوم.`);
          } else {
            const newLog: MealLog = {
              id: crypto.randomUUID(),
              studentName: student.name,
              studentBarcode: student.barcode,
              studentDepartment: student.department,
              timestamp: new Date().toLocaleTimeString(),
              date: today,
              mealType: currentMealType
            };
            setLogs([newLog, ...logs]);
            setScanResult(`نجاح: تم تسجيل ${student.name} لوجبة ${currentMealType}.`);
          }
        } else {
          setScanResult('باركود غير معروف.');
        }
        
        // Reset scan result after 3 seconds
        setTimeout(() => setScanResult(null), 3000);
      }
    } catch (error) {
      console.error('Scan Error:', error);
      setScanResult('حدث خطأ أثناء المسح.');
    }
  };

  // Excel Export
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLogs.map((l, index) => ({
      'م': index + 1,
      'اسم الطالب': l.studentName,
      'القسم': l.studentDepartment,
      'الباركود': l.studentBarcode,
      'الوجبة': l.mealType,
      'الوقت': l.timestamp,
      'التاريخ': l.date
    })));

    // Set column widths
    const wscols = [
      { wch: 5 },  // م
      { wch: 30 }, // اسم الطالب
      { wch: 20 }, // القسم
      { wch: 15 }, // الباركود
      { wch: 10 }, // الوجبة
      { wch: 15 }, // الوقت
      { wch: 15 }  // التاريخ
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجلات الوجبات');
    const fileName = isRangeSearch 
      ? `سجلات_الوجبات_${startDate}_إلى_${endDate}.xlsx`
      : `سجلات_الوجبات_${selectedDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      let matchesDate = false;
      if (isRangeSearch) {
        if (!startDate && !endDate) matchesDate = true;
        else if (startDate && !endDate) matchesDate = l.date >= startDate;
        else if (!startDate && endDate) matchesDate = l.date <= endDate;
        else matchesDate = l.date >= startDate && l.date <= endDate;
      } else {
        matchesDate = l.date === selectedDate;
      }

      const matchesSearch = l.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           l.studentBarcode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [logs, isRangeSearch, startDate, endDate, selectedDate, searchQuery]);

  if (isInitializing) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-beige-50 dark:bg-slate-900 flex flex-col items-center justify-center"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center gap-8"
          >
            <div className="w-32 h-32 md:w-48 md:h-48 bg-primary/5 dark:bg-primary/10 rounded-[3rem] flex items-center justify-center p-6 shadow-2xl shadow-primary/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"></div>
              <img 
                src="/logo.svg" 
                alt="Logo" 
                className="w-full h-full object-contain relative z-10"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-4xl font-black text-primary dark:text-slate-100 font-arabic tracking-tight">أكاديمية النبلاء</h1>
              <p className="text-slate-400 dark:text-slate-500 font-bold tracking-[0.2em] text-xs md:text-sm uppercase font-display">Al Nobala Academy</p>
            </div>
          </motion.div>
          
          <div className="absolute bottom-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
            </div>
            <p className="text-slate-300 dark:text-slate-600 text-[10px] font-black tracking-[0.3em] uppercase font-display">from Nobles Team</p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-page-bg dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="bg-beige-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:h-24 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-primary hover:text-white dark:hover:bg-accent dark:hover:text-primary transition-all shadow-sm border border-slate-100 dark:border-slate-700"
              title={t.settings}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center p-2 shadow-inner border border-slate-100 dark:border-slate-700">
                <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className={`flex flex-col ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <h1 className="text-xl md:text-2xl font-black text-primary dark:text-slate-100 font-arabic leading-none tracking-tight">{t.title}</h1>
                <p className="text-[10px] md:text-[11px] text-slate-400 dark:text-slate-500 font-bold tracking-[0.2em] uppercase mt-1 font-display">{t.subtitle}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isOfflineReady && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-500/20 animate-pulse">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-black font-arabic">جاهز للعمل بدون إنترنت</span>
              </div>
            )}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
              title={darkMode ? (language === 'ar' ? "الوضع النهاري" : "Light Mode") : (language === 'ar' ? "الوضع الليلي" : "Dark Mode")}
            >
              {darkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-500" />}
            </button>
            {currentModule !== 'selection' && (
              <button 
                onClick={() => {
                  setCurrentModule('selection');
                  setIsModuleLocked(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-arabic"
              >
                <LogOutIcon size={14} className={language === 'ar' ? 'rotate-180' : ''} />
                {t.mainMenu}
              </button>
            )}
            {showInstallBtn && !isStandalone && (
              <div className="relative">
                <button 
                  onClick={handleInstallClick}
                  className="bg-accent/10 text-primary border border-accent/20 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-accent/20 transition-all flex items-center gap-2"
                >
                  <Download size={14} />
                  تثبيت
                </button>
                
                {showInstallHelp && (
                  <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-primary">طريقة التثبيت اليدوي:</p>
                      <button onClick={() => setShowInstallHelp(false)} className="text-slate-400 hover:text-slate-600">
                        <Plus size={14} className="rotate-45" />
                      </button>
                    </div>
                    <ul className="text-[10px] text-slate-600 space-y-1.5 list-disc list-inside font-medium">
                      <li>للآيفون: اضغط زر "مشاركة" ثم "إضافة إلى الشاشة الرئيسية".</li>
                      <li>للأندرويد: اضغط على الثلاث نقاط في المتصفح ثم "تثبيت التطبيق".</li>
                      <li>للكمبيوتر: اضغط على أيقونة التثبيت في شريط العنوان العلوي.</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${printMode === 'report' ? 'hidden print:hidden' : ''}`}>
        <AnimatePresence mode="wait">
          {currentModule === 'selection' && (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto space-y-12 py-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-primary dark:text-slate-100 font-arabic">{t.welcome}</h2>
                <p className="text-slate-400 dark:text-slate-500 font-bold text-lg font-arabic">{t.selectModule}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Kitchen Module Card */}
                <button 
                  onClick={() => setCurrentModule('kitchen')}
                  className="group relative bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-right overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/10 transition-all"></div>
                  <div className="relative z-10 space-y-6">
                    <div className="w-20 h-20 bg-beige-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-700 group-hover:rotate-6 transition-transform">
                      <LayoutGrid size={40} className="text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-primary dark:text-slate-100 font-arabic">{t.kitchen}</h3>
                      <p className="text-slate-600 dark:text-slate-500 font-bold font-arabic leading-relaxed text-sm">{t.kitchenDesc}</p>
                    </div>
                    <div className="flex items-center gap-2 text-primary dark:text-accent font-black font-arabic group-hover:gap-4 transition-all">
                      <span>{t.enter}</span>
                      <ArrowLeft size={20} className={language === 'ar' ? '' : 'rotate-180'} />
                    </div>
                  </div>
                </button>

                {/* Finance Module Card */}
                <button 
                  onClick={() => handleModuleAccess('finance')}
                  className="group relative bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-right overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-accent/10 transition-all"></div>
                  <div className="relative z-10 space-y-6">
                    <div className="w-20 h-20 bg-beige-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-700 group-hover:rotate-6 transition-transform">
                      <Coins size={40} className="text-accent" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-primary dark:text-slate-100 font-arabic">{t.finance}</h3>
                      <p className="text-slate-600 dark:text-slate-500 font-bold font-arabic leading-relaxed text-sm">{t.financeDesc}</p>
                    </div>
                    <div className="flex items-center gap-2 text-accent font-black font-arabic group-hover:gap-4 transition-all">
                      <span>{t.enter}</span>
                      <ArrowLeft size={20} className={language === 'ar' ? '' : 'rotate-180'} />
                    </div>
                  </div>
                </button>

                {/* Purchases Module Card */}
                <button 
                  onClick={() => handleModuleAccess('purchases')}
                  className="group relative bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-right overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
                  <div className="relative z-10 space-y-6">
                    <div className="w-20 h-20 bg-beige-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-700 group-hover:rotate-6 transition-transform">
                      <ShoppingCart size={40} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-primary dark:text-slate-100 font-arabic">{t.purchases}</h3>
                      <p className="text-slate-600 dark:text-slate-500 font-bold font-arabic leading-relaxed text-sm">{t.purchasesDesc}</p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black font-arabic group-hover:gap-4 transition-all">
                      <span>{t.enter}</span>
                      <ArrowLeft size={20} className={language === 'ar' ? '' : 'rotate-180'} />
                    </div>
                  </div>
                </button>

                {/* Reports Module Card */}
                <button 
                  onClick={() => handleModuleAccess('reports')}
                  className="group relative bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-right overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-indigo-500/10 transition-all"></div>
                  <div className="relative z-10 space-y-6">
                    <div className="w-20 h-20 bg-beige-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-700 group-hover:rotate-6 transition-transform">
                      <FileText size={40} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-primary dark:text-slate-100 font-arabic">{t.reports}</h3>
                      <p className="text-slate-600 dark:text-slate-500 font-bold font-arabic leading-relaxed text-sm">{t.reportsDesc}</p>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black font-arabic group-hover:gap-4 transition-all">
                      <span>{t.enter}</span>
                      <ArrowLeft size={20} className={language === 'ar' ? '' : 'rotate-180'} />
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {currentModule === 'kitchen' && (
            <motion.div 
              key="kitchen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 no-print">
                <div className={`flex flex-col gap-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <h2 className="text-3xl md:text-4xl font-black text-primary dark:text-slate-100 font-arabic">{language === 'ar' ? 'لوحة التحكم - المطبخ' : 'Kitchen Dashboard'}</h2>
                  <p className="text-slate-400 dark:text-slate-500 font-bold font-arabic">{language === 'ar' ? 'إدارة الطلاب، المسح الضوئي، ومتابعة السجلات' : 'Manage students, scanning, and logs'}</p>
                </div>
                
                <nav className="flex items-center p-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <button 
                    onClick={() => setActiveTab('cards')}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-sm font-black transition-all font-arabic ${activeTab === 'cards' ? 'bg-beige-50 dark:bg-slate-700 text-primary dark:text-slate-100 shadow-md ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    <LayoutGrid size={20} />
                    البطاقات
                  </button>
                  <button 
                    onClick={() => setActiveTab('scanner')}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-sm font-black transition-all font-arabic ${activeTab === 'scanner' ? 'bg-white dark:bg-slate-700 text-primary dark:text-slate-100 shadow-md ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    <Camera size={20} />
                    الماسح
                  </button>
                  <button 
                    onClick={() => setActiveTab('logs')}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-sm font-black transition-all font-arabic ${activeTab === 'logs' ? 'bg-white dark:bg-slate-700 text-primary dark:text-slate-100 shadow-md ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    <History size={20} />
                    السجلات
                  </button>
                </nav>
              </div>

              <AnimatePresence mode="wait">
          {activeTab === 'cards' && (
            <motion.div 
              key="cards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Add Student Section */}
              <div className="bg-beige-50 dark:bg-slate-800 p-8 md:p-12 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/30 dark:shadow-black/20 no-print relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner">
                      <Plus size={32} className="text-primary dark:text-accent" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-primary dark:text-slate-100 font-arabic">إدارة الطلاب</h2>
                      <p className="text-slate-400 dark:text-slate-500 font-bold text-sm md:text-base font-arabic">إضافة طلاب جدد أو استيراد بيانات من ملف إكسل</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-8 py-4 rounded-2xl font-black hover:border-primary/30 hover:shadow-lg transition-all flex items-center justify-center gap-3 group">
                      <FileUp size={22} className="group-hover:text-primary transition-colors" />
                      <span className="font-arabic">استيراد إكسل</span>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleExcelImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <label className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display">Student Name / اسم الطالب:</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="text" 
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="أدخل اسم الطالب بالكامل..."
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                        className="flex-1 px-8 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary transition-all text-xl font-black font-arabic placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        onKeyPress={(e) => e.key === 'Enter' && addStudent()}
                      />
                      <button 
                        onClick={addStudent}
                        className="bg-primary text-white px-12 py-5 rounded-2xl font-black hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 font-arabic text-lg"
                      >
                        إضافة
                        <Plus size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display">Department / القسم:</label>
                    <div className="grid grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                      <button 
                        onClick={() => setNewStudentDept('أكاديمي')}
                        className={`py-4 rounded-xl text-base font-black transition-all font-arabic ${newStudentDept === 'أكاديمي' ? 'bg-beige-50 dark:bg-slate-700 text-primary dark:text-slate-100 shadow-md ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        أكاديمي
                      </button>
                      <button 
                        onClick={() => setNewStudentDept('تعاوني')}
                        className={`py-4 rounded-xl text-base font-black transition-all font-arabic ${newStudentDept === 'تعاوني' ? 'bg-beige-50 dark:bg-slate-700 text-primary dark:text-slate-100 shadow-md ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        تعاوني
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Cards Preview */}
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 no-print">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/5 dark:bg-primary/20 rounded-xl flex items-center justify-center border border-primary/5 dark:border-primary/20">
                      <LayoutGrid size={24} className="text-primary dark:text-accent" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-primary dark:text-slate-100 font-arabic">معاينة الطباعة</h2>
                      <p className="text-slate-400 dark:text-slate-500 text-xs font-bold font-arabic">سيتم ترتيب البطاقات تلقائياً في صفحات A4</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    {students.length > 0 && (
                      <div className="relative">
                        {!showClearConfirm ? (
                          <button 
                            onClick={() => setShowClearConfirm(true)}
                            className="flex items-center justify-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 px-6 py-4 rounded-2xl text-sm font-black text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all shadow-sm font-arabic"
                          >
                            <Trash2 size={20} />
                            تصفية الكل
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-red-600 dark:bg-red-700 p-1.5 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-200">
                            <button 
                              onClick={clearAllStudents}
                              className="px-5 py-2.5 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 rounded-xl text-sm font-black hover:bg-red-50 dark:hover:bg-slate-800 transition-all font-arabic"
                            >
                              تأكيد
                            </button>
                            <button 
                              onClick={() => setShowClearConfirm(false)}
                              className="px-4 py-2.5 text-white text-sm font-black hover:bg-white/10 dark:hover:bg-black/20 rounded-xl transition-all font-arabic"
                            >
                              إلغاء
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <button 
                      onClick={downloadPDF}
                      disabled={students.length === 0 || isGenerating}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 px-8 py-4 rounded-2xl text-sm font-black text-primary dark:text-slate-100 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 shadow-sm font-arabic"
                    >
                      {isGenerating ? (
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      ) : (
                        <Download size={20} />
                      )}
                      {isGenerating ? 'جاري...' : 'تنزيل PDF'}
                    </button>
                    <button 
                      onClick={handlePrint}
                      disabled={students.length === 0}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl shadow-primary/20 font-arabic"
                    >
                      <Printer size={20} />
                      طباعة
                    </button>
                  </div>
                </div>

                {/* A4 Sheet Preview */}
                <div className={`bg-beige-100/50 dark:bg-slate-900/50 p-6 md:p-12 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-inner overflow-x-auto no-scrollbar ${printMode === 'cards' ? 'print-only' : ''}`}>
                  <div 
                    ref={cardContainerRef}
                    className="flex flex-col gap-12 items-center min-w-[210mm] md:min-w-0"
                    style={{ 
                      direction: 'rtl',
                      transform: 'scale(var(--preview-scale, 1))',
                      transformOrigin: 'top center'
                    }}
                  >
                    {students.length === 0 ? (
                      <div className="py-32 text-center space-y-6 opacity-30">
                        <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                          <LayoutGrid size={48} className="text-slate-400 dark:text-slate-600" />
                        </div>
                        <p className="text-2xl font-black font-arabic text-slate-900 dark:text-slate-100">أضف طلاباً لعرض البطاقات هنا</p>
                      </div>
                    ) : (
                      Array.from({ length: Math.ceil(students.length / 8) }).map((_, pageIndex) => (
                        <div 
                          key={pageIndex}
                          className="w-[210mm] h-[297mm] bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] p-[10mm] grid grid-cols-2 grid-rows-4 gap-[5mm] content-start justify-items-center relative overflow-hidden flex-shrink-0 a4-page rounded-sm"
                        >
                          {students.slice(pageIndex * 8, (pageIndex + 1) * 8).map((student) => (
                            <StudentCard 
                              key={student.id} 
                              student={student} 
                              onDelete={deleteStudent} 
                            />
                          ))}
                          
                          {/* Page Number for Preview */}
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 font-black tracking-[0.3em] no-print uppercase font-display">
                            PAGE {pageIndex + 1} OF {Math.ceil(students.length / 8)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'scanner' && (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-beige-50 dark:bg-slate-800 p-8 md:p-12 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-2xl space-y-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-primary dark:text-accent mx-auto shadow-inner border border-slate-100 dark:border-slate-700">
                    <Camera size={40} className="md:w-12 md:h-12" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-primary dark:text-slate-100 font-arabic">ماسح الوجبات</h2>
                    <p className="text-slate-400 dark:text-slate-500 mt-3 text-base md:text-lg font-medium font-arabic">وجه الكاميرا نحو رمز الباركود لتسجيل الوجبة</p>
                  </div>
                </div>

                <div className="flex justify-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl max-w-sm mx-auto border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => setCurrentMealType('غداء')}
                    className={`flex-1 py-3.5 rounded-xl text-base font-black transition-all font-arabic ${currentMealType === 'غداء' ? 'bg-beige-100 dark:bg-slate-700 text-primary dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    غداء
                  </button>
                  <button 
                    onClick={() => setCurrentMealType('عشاء')}
                    className={`flex-1 py-3.5 rounded-xl text-base font-black transition-all font-arabic ${currentMealType === 'عشاء' ? 'bg-beige-100 dark:bg-slate-700 text-primary dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    عشاء
                  </button>
                </div>

                <div className="relative aspect-square max-w-md mx-auto bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-700 ring-1 ring-slate-200 dark:ring-slate-600">
                  {scanning ? (
                    <div className="w-full h-full">
                      <ErrorBoundary>
                        <BarcodeScannerComponent
                          width="100%"
                          height="100%"
                          onUpdate={handleScan}
                        />
                      </ErrorBoundary>
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md z-10 font-bold tracking-widest">
                        LIVE CAMERA ACTIVE
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                      <button 
                        onClick={() => setScanning(true)}
                        className="bg-primary text-white px-12 py-5 rounded-2xl font-black hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 font-arabic text-lg"
                      >
                        تشغيل الكاميرا
                      </button>
                    </div>
                  )}
                  
                  {/* Scanner Overlay */}
                  <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none">
                    <div className="w-full h-full border-2 border-accent/40 rounded-3xl relative">
                      <div className="absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 border-accent rounded-tl-3xl"></div>
                      <div className="absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 border-accent rounded-tr-3xl"></div>
                      <div className="absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 border-accent rounded-bl-3xl"></div>
                      <div className="absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 border-accent rounded-br-3xl"></div>
                      
                      {/* Scanning Line */}
                      {scanning && (
                        <motion.div 
                          animate={{ top: ['10%', '90%', '10%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute left-6 right-6 h-1 bg-accent shadow-[0_0_25px_rgba(212,175,55,1)] rounded-full"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {scanResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -30 }}
                      className={`p-8 rounded-[2.5rem] flex flex-col items-center gap-5 justify-center shadow-2xl border-2 ${
                        scanResult.includes('نجاح') 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}
                    >
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                        scanResult.includes('نجاح') ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                      }`}>
                        {scanResult.includes('نجاح') ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black font-arabic">{scanResult.split(':')[0]}</h3>
                        <p className="font-bold text-lg opacity-90 font-arabic">{scanResult.split(':')[1] || scanResult}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {scanning && (
                  <button 
                    onClick={() => setScanning(false)}
                    className="text-slate-400 text-sm font-black hover:text-red-500 transition-all uppercase tracking-[0.2em] font-display"
                  >
                    STOP SCANNING
                  </button>
                )}

                {/* Recent Scans List */}
                <div className="pt-10 border-t border-slate-100 dark:border-slate-700 text-right">
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 font-display">Recent Activity / آخر العمليات</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {logs.slice(0, 3).map((log) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={log.id}
                        className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-primary dark:text-slate-100 font-arabic">{log.studentName}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{log.timestamp}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black font-arabic ${
                          log.mealType === 'غداء' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                        }`}>
                          {log.mealType}
                        </span>
                      </motion.div>
                    ))}
                    {logs.length === 0 && (
                      <div className="col-span-full py-10 text-center">
                        <p className="text-slate-300 text-sm font-bold italic font-arabic">لا توجد عمليات مسح بعد</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Daily Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-arabic">إجمالي وجبات اليوم ({selectedDate})</p>
                    <p className="text-4xl font-black text-primary dark:text-slate-100">{logs.filter(l => l.date === selectedDate).length}</p>
                  </div>
                  <div className="w-16 h-16 bg-primary/5 dark:bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Utensils size={32} className="text-primary dark:text-accent" />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-arabic">توزيع الوجبات اليوم</p>
                    <div className="flex gap-6">
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        غداء: <span className="text-primary font-black">{logs.filter(l => l.date === selectedDate && l.mealType === 'غداء').length}</span>
                      </p>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        عشاء: <span className="text-primary font-black">{logs.filter(l => l.date === selectedDate && l.mealType === 'عشاء').length}</span>
                      </p>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-accent/10 dark:bg-accent/20 rounded-2xl flex items-center justify-center shrink-0">
                    <History size={32} className="text-accent" />
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="bg-beige-50 dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/30 dark:shadow-black/20">
                <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto">
                    <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={() => setIsRangeSearch(false)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all font-arabic ${!isRangeSearch ? 'bg-beige-50 dark:bg-slate-700 text-primary dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        يومي
                      </button>
                      <button 
                        onClick={() => setIsRangeSearch(true)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all font-arabic ${isRangeSearch ? 'bg-beige-50 dark:bg-slate-700 text-primary dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        فترة
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                      {!isRangeSearch ? (
                        <div className="flex items-center gap-3 flex-1 sm:flex-none">
                          <div className="relative">
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            <input 
                              type="month" 
                              value={selectedDate.slice(0, 7)}
                              onChange={(e) => {
                                const newMonth = e.target.value;
                                if (newMonth) {
                                  setSelectedDate(`${newMonth}-01`);
                                }
                              }}
                              className="w-full sm:w-auto pr-12 pl-5 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-primary dark:text-slate-100"
                              title="اختر الشهر"
                            />
                          </div>
                          <div className="relative flex items-center gap-2">
                            <div className="relative">
                              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                              <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full sm:w-auto pr-12 pl-5 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-primary dark:text-slate-100"
                                title="اختر اليوم"
                              />
                            </div>
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl">
                              {new Date(selectedDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' })}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 flex-1 sm:flex-none">
                          <div className="relative">
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            <input 
                              type="date" 
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full sm:w-auto pr-11 pl-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-primary dark:text-slate-100 text-sm"
                            />
                          </div>
                          <span className="text-slate-400 font-bold">إلى</span>
                          <div className="relative">
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            <input 
                              type="date" 
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full sm:w-auto pr-11 pl-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-primary dark:text-slate-100 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-80">
                      <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="بحث بالاسم أو الباركود..."
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                        className="w-full pr-14 pl-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold font-arabic text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <button 
                      onClick={exportToExcel}
                      className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200/30 font-arabic"
                    >
                      <Download size={20} />
                      تصدير إكسل
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-beige-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/20 dark:shadow-black/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic">اسم الطالب</th>
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">الباركود</th>
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">نوع الوجبة</th>
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">الوقت</th>
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/30 dark:hover:bg-slate-900/30 transition-colors group">
                          <td className="px-8 py-5">
                            <p className="font-black text-primary dark:text-slate-100 font-arabic">{log.studentName}</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="font-mono text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg">{log.studentBarcode}</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={`inline-block px-4 py-1 rounded-full text-xs font-black font-arabic ${
                              log.mealType === 'غداء' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                            }`}>
                              {log.mealType}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="font-black text-slate-600 dark:text-slate-400 text-sm">{log.timestamp}</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="font-black text-slate-400 dark:text-slate-500 text-xs">{log.date}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredLogs.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto">
                        <Search size={32} className="text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-400 dark:text-slate-500 font-bold font-arabic">لا توجد نتائج مطابقة للبحث</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      )}

          {currentModule === 'finance' && (
            <motion.div 
              key="finance"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-10"
            >
              {/* Finance Header */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 no-print">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl md:text-4xl font-black text-primary dark:text-slate-100 font-arabic">الشؤون المالية</h2>
                  <p className="text-slate-600 dark:text-slate-500 font-bold font-arabic">إدارة الاشتراكات الشهرية ومتابعة التحصيل المالي</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                    <Calendar size={20} className="text-primary" />
                    <select 
                      value={currentMonth}
                      onChange={(e) => setCurrentMonth(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 font-black text-slate-700 dark:text-slate-100 font-arabic outline-none cursor-pointer"
                    >
                      {availableMonths.map(m => (
                        <option key={m} value={m} className="dark:bg-slate-900">{m}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={startNewMonth}
                    className="bg-primary text-white px-6 py-4 rounded-2xl font-black hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 font-arabic"
                  >
                    <Plus size={20} />
                    شهر جديد
                  </button>
                  <button 
                    onClick={exportFinanceToExcel}
                    className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200/30 font-arabic"
                  >
                    <Download size={20} />
                    تصدير التقرير
                  </button>
                  <label className="cursor-pointer bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-8 py-4 rounded-2xl font-black hover:border-primary/30 hover:shadow-lg transition-all flex items-center justify-center gap-3 group">
                    <FileUp size={22} className="group-hover:text-primary transition-colors" />
                    <span className="font-arabic">استيراد</span>
                    <input 
                      type="file" 
                      accept=".xlsx, .xls" 
                      onChange={handleFinanceExcelImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Finance Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Wallet size={32} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic">إجمالي المدفوعات</p>
                    <p className="text-3xl font-black text-primary dark:text-slate-100">{totalPaid.toLocaleString()} <span className="text-sm">ريال</span></p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Coins size={32} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic">إجمالي الفائض</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{totalSurplus.toLocaleString()} <span className="text-sm">ريال</span></p>
                  </div>
                </div>
                <div className="bg-accent/10 dark:bg-accent/20 p-8 rounded-[2.5rem] border border-accent/20 dark:border-accent/30 shadow-xl flex items-center gap-6 relative">
                  <div className="w-16 h-16 bg-accent/20 dark:bg-accent/30 rounded-2xl flex items-center justify-center text-primary dark:text-accent">
                    <Utensils size={32} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-primary dark:text-accent uppercase tracking-wider font-arabic">قيمة الاشتراك الموحدة</p>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={globalSubscription || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const sanitized = val.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
                                             .replace(/[^0-9.]/g, '');
                        const parts = sanitized.split('.');
                        if (parts.length <= 2) updateGlobalSubscription(Number(sanitized));
                      }}
                      placeholder="0.00"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      className="w-full bg-transparent border-none text-3xl font-black text-primary dark:text-slate-100 focus:outline-none placeholder:text-primary/30 dark:placeholder:text-slate-600"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const updated = financeStudents.map(s => ({
                        ...s,
                        monthlySubscription: globalSubscription,
                        remainingAmount: Math.max(0, globalSubscription - s.paidAmount),
                        surplusAmount: Math.max(0, s.paidAmount - globalSubscription),
                        status: (s.paidAmount >= globalSubscription && globalSubscription > 0 ? 'مسدد' : s.paidAmount > 0 ? 'مسدد جزئياً' : 'غير مسدد') as 'مسدد' | 'مسدد جزئياً' | 'غير مسدد'
                      }));
                      setFinanceStudents(updated);
                    }}
                    className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
                    title={language === 'ar' ? 'إعادة حساب الكل' : 'Recalculate All'}
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              </div>

              {/* Add Finance Student Section */}
              <div className="bg-beige-50 dark:bg-slate-800 p-8 md:p-10 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl no-print relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent via-primary to-accent"></div>
                <div className="flex flex-col md:flex-row gap-6 items-end">
                  <div className="flex-1 space-y-3">
                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-arabic">اسم الطالب:</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={newFinanceName}
                        onChange={(e) => setNewFinanceName(e.target.value)}
                        placeholder="أدخل اسم الطالب..."
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-accent transition-all font-black font-arabic"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={addFinanceStudent}
                    className="bg-accent text-primary px-12 py-4 rounded-2xl font-black hover:bg-accent/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent/20 font-arabic"
                  >
                    <UserPlus size={20} />
                    إضافة طالب
                  </button>
                </div>
              </div>

              {/* Finance Filters & Search */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-lg no-print space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 no-print">
                  <div className="flex flex-wrap items-center gap-4">
                    <button 
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: language === 'ar' ? 'حذف المشتركين المحددين' : 'Delete Selected Students',
                          message: language === 'ar' ? `هل أنت متأكد من حذف ${selectedFinanceStudents.size} من المشتركين؟` : `Are you sure you want to delete ${selectedFinanceStudents.size} students?`,
                          type: 'danger',
                          onConfirm: () => {
                            setFinanceStudents(financeStudents.filter(s => !selectedFinanceStudents.has(s.id)));
                            setSelectedFinanceStudents(new Set());
                          }
                        });
                      }}
                      disabled={selectedFinanceStudents.size === 0}
                      className="px-6 py-3 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Trash2 size={18} />
                      {language === 'ar' ? 'حذف المحدد' : 'Delete Selected'}
                    </button>
                    <button 
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: language === 'ar' ? 'حذف جميع المشتركين' : 'Delete All Students',
                          message: language === 'ar' ? 'هل أنت متأكد من حذف جميع المشتركين في هذا الجدول؟' : 'Are you sure you want to delete all students in this table?',
                          type: 'danger',
                          onConfirm: () => {
                            const filteredIds = new Set(filteredFinanceStudents.map(s => s.id));
                            setFinanceStudents(financeStudents.filter(s => !filteredIds.has(s.id)));
                            setSelectedFinanceStudents(new Set());
                          }
                        });
                      }}
                      className="px-6 py-3 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-2xl font-black text-sm hover:bg-red-200 transition-all flex items-center gap-2"
                    >
                      <RotateCcw size={18} />
                      {language === 'ar' ? 'حذف الكل' : 'Delete All'}
                    </button>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />
                    <button 
                      onClick={resetFinancePayments}
                      className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-black hover:bg-amber-600 transition-all shadow-lg shadow-amber-200/30 font-arabic"
                      title={language === 'ar' ? 'تصفير جميع المدفوعات' : 'Reset All Payments'}
                    >
                      <RotateCcw size={20} />
                      {language === 'ar' ? 'تصفير الحسابات' : 'Reset Accounts'}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-primary" />
                      <select 
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 font-black text-slate-700 dark:text-slate-100 font-arabic outline-none cursor-pointer text-sm"
                      >
                        <option value="">{language === 'ar' ? 'اختر الشهر' : 'Select Month'}</option>
                        {availableMonths.map(m => (
                          <option key={m} value={m} className="dark:bg-slate-900">{m}</option>
                        ))}
                      </select>
                      {currentMonth && (
                        <button 
                          onClick={() => deleteMonth(currentMonth)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={language === 'ar' ? 'حذف هذا الشهر' : 'Delete this month'}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                    <div className="flex items-center gap-2 relative group">
                      <span className="text-sm font-black text-slate-500 dark:text-slate-400 font-arabic">{t.from}</span>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                        <input 
                          type="date" 
                          value={financeStartDate}
                          onChange={(e) => setFinanceStartDate(e.target.value)}
                          className="pl-10 pr-4 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 relative group">
                      <span className="text-sm font-black text-slate-600 dark:text-slate-400 font-arabic">{t.to}</span>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                        <input 
                          type="date" 
                          value={financeEndDate}
                          onChange={(e) => setFinanceEndDate(e.target.value)}
                          className="pl-10 pr-4 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-sm"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setFinanceStartDate('');
                        setFinanceEndDate('');
                        setFinanceSearchQuery('');
                        setFinanceFilter('all');
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title={language === 'ar' ? 'مسح التصفية' : 'Clear Filters'}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                  <div className="relative w-full lg:w-96">
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      value={financeSearchQuery}
                      onChange={(e) => setFinanceSearchQuery(e.target.value)}
                      placeholder="بحث عن طالب..."
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      className="w-full pr-14 pl-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold font-arabic"
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-full lg:w-auto overflow-x-auto no-scrollbar">
                    <button 
                      onClick={() => setFinanceFilter('all')}
                      className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all font-arabic whitespace-nowrap ${financeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-primary dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      الكل
                    </button>
                    <button 
                      onClick={() => setFinanceFilter('paid')}
                      className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all font-arabic whitespace-nowrap ${financeFilter === 'paid' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-100 dark:ring-emerald-900/50' : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                    >
                      مسدد
                    </button>
                    <button 
                      onClick={() => setFinanceFilter('partial')}
                      className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all font-arabic whitespace-nowrap ${financeFilter === 'partial' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-100 dark:ring-amber-900/50' : 'text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'}`}
                    >
                      مسدد جزئياً
                    </button>
                    <button 
                      onClick={() => setFinanceFilter('unpaid')}
                      className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all font-arabic whitespace-nowrap ${financeFilter === 'unpaid' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm ring-1 ring-red-100 dark:ring-red-900/50' : 'text-slate-400 hover:text-red-600 dark:hover:text-red-400'}`}
                    >
                      غير مسدد
                    </button>
                  </div>
                </div>
              </div>

              {/* Finance Table */}
              <div className="bg-beige-50 dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-6 no-print">
                          <input 
                            type="checkbox" 
                            checked={filteredFinanceStudents.length > 0 && filteredFinanceStudents.every(s => selectedFinanceStudents.has(s.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newSelected = new Set(selectedFinanceStudents);
                                filteredFinanceStudents.forEach(s => newSelected.add(s.id));
                                setSelectedFinanceStudents(newSelected);
                              } else {
                                const newSelected = new Set(selectedFinanceStudents);
                                filteredFinanceStudents.forEach(s => newSelected.delete(s.id));
                                setSelectedFinanceStudents(newSelected);
                              }
                            }}
                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                        </th>
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic">اسم الطالب</th>
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">الاشتراك الشهري</th>
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">المبلغ المسدد</th>
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">المتبقي</th>
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">الفائض</th>
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">الملاحظات</th>
                        <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">الحالة</th>
                        <th className="px-8 py-6 text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-arabic text-center no-print">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredFinanceStudents.map((student) => (
                        <tr key={student.id} className={`hover:bg-white/30 dark:hover:bg-slate-900/30 transition-colors group ${selectedFinanceStudents.has(student.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                          <td className="px-4 py-5 no-print">
                            <input 
                              type="checkbox" 
                              checked={selectedFinanceStudents.has(student.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedFinanceStudents);
                                if (e.target.checked) newSelected.add(student.id);
                                else newSelected.delete(student.id);
                                setSelectedFinanceStudents(newSelected);
                              }}
                              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              {student.status === 'غير مسدد' && (
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                              )}
                              <p className="font-black text-primary dark:text-slate-100 font-arabic">{student.name}</p>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="font-black text-slate-600 dark:text-slate-400">{(student.monthlySubscription || 0).toFixed(2)}</span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            {editingStudentId === student.id ? (
                              <div className="flex items-center gap-2 justify-center">
                                <input 
                                  type="text" 
                                  inputMode="decimal"
                                  value={tempPaidAmount}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const sanitized = val.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
                                                         .replace(/[^0-9.]/g, '');
                                    const parts = sanitized.split('.');
                                    if (parts.length <= 2) setTempPaidAmount(sanitized);
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  onClick={(e) => (e.target as HTMLInputElement).select()}
                                  placeholder="0"
                                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                                  className="w-24 px-3 py-1.5 rounded-lg border-2 border-accent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-center font-black text-sm focus:outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      let rate = 1;
                                      if (paymentCurrency === 'SAR') rate = exchangeRates.SAR;
                                      if (paymentCurrency === 'USD') rate = exchangeRates.USD;
                                      updatePaidAmount(student.id, Number(tempPaidAmount) * rate);
                                      setPaymentCurrency('YER');
                                    }
                                  }}
                                  autoFocus
                                />
                                <select
                                  value={paymentCurrency}
                                  onChange={(e) => setPaymentCurrency(e.target.value as 'YER' | 'SAR' | 'USD')}
                                  className="px-2 py-1.5 rounded-lg border-2 border-accent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-black text-sm focus:outline-none"
                                >
                                  <option value="YER">ر.ي</option>
                                  <option value="SAR">ر.س</option>
                                  <option value="USD">$</option>
                                </select>
                                <button 
                                  onClick={() => {
                                    let rate = 1;
                                    if (paymentCurrency === 'SAR') rate = exchangeRates.SAR;
                                    if (paymentCurrency === 'USD') rate = exchangeRates.USD;
                                    updatePaidAmount(student.id, Number(tempPaidAmount) * rate);
                                    setPaymentCurrency('YER');
                                  }}
                                  className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingStudentId(null);
                                    setPaymentCurrency('YER');
                                  }}
                                  className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all"
                                >
                                  <Plus size={16} className="rotate-45" />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setEditingStudentId(student.id);
                                  setTempPaidAmount(student.paidAmount === 0 ? '' : student.paidAmount.toString());
                                }}
                                className="font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-2 justify-center mx-auto"
                              >
                                {student.paidAmount.toLocaleString()}
                                <Coins size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            )}
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={`font-black ${(student.remainingAmount || 0) > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                              {(student.remainingAmount || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={`font-black ${(student.surplusAmount || 0) > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {(student.surplusAmount || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <input 
                              type="text"
                              value={student.notes || ''}
                              onChange={(e) => {
                                const updated = financeStudents.map(s => s.id === student.id ? { ...s, notes: e.target.value } : s);
                                setFinanceStudents(updated);
                              }}
                              placeholder={language === 'ar' ? 'ملاحظات...' : 'Notes...'}
                              className="w-full bg-transparent border-none text-xs font-bold text-slate-500 dark:text-slate-400 focus:outline-none text-right font-arabic"
                            />
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black font-arabic ${
                              student.status === 'مسدد' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              student.status === 'مسدد جزئياً' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center no-print">
                            <button 
                              onClick={() => deleteFinanceStudent(student.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredFinanceStudents.length === 0 && (
                    <div className="py-24 text-center space-y-6">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto">
                        <Search size={40} className="text-slate-300 dark:text-slate-600" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-black text-slate-400 dark:text-slate-500 font-arabic">لا توجد بيانات طلاب</p>
                        <p className="text-sm text-slate-300 dark:text-slate-600 font-bold font-arabic">أضف طلاباً يدوياً أو استورد ملف إكسل للبدء</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Purchases Module */}
          {currentModule === 'purchases' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              {/* Purchases Header & Summary */}
              <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                <div className="space-y-2 text-right">
                  <h2 className="text-4xl font-black text-primary dark:text-slate-100 font-arabic">قسم المشتريات</h2>
                  <p className="text-slate-600 dark:text-slate-500 font-bold font-arabic">إدارة المشتريات اليومية وأرشفة الفواتير</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                    <Calendar size={20} className="text-primary" />
                    <select 
                      value={currentMonth}
                      onChange={(e) => setCurrentMonth(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 font-black text-slate-700 dark:text-slate-100 font-arabic outline-none cursor-pointer"
                    >
                      {availableMonths.map(m => (
                        <option key={m} value={m} className="dark:bg-slate-900">{m}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      const nextMonthDate = new Date(currentMonth + '-01');
                      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
                      const nextMonth = nextMonthDate.toISOString().slice(0, 7);
                      if (!availableMonths.includes(nextMonth)) {
                        setAvailableMonths([...availableMonths, nextMonth]);
                      }
                      setCurrentMonth(nextMonth);
                    }}
                    className="bg-primary text-white px-6 py-4 rounded-2xl font-black hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 font-arabic"
                  >
                    <Plus size={20} />
                    شهر جديد
                  </button>
                  <button 
                    onClick={exportPurchasesToExcel}
                    className="w-full md:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200/30 font-arabic"
                  >
                    <Download size={20} />
                    {language === 'ar' ? 'تصدير إكسل' : 'Export Excel'}
                  </button>
                  <label className="cursor-pointer w-full md:w-auto bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-8 py-4 rounded-2xl font-black hover:border-primary/30 hover:shadow-lg transition-all flex items-center justify-center gap-3 group">
                    <FileUp size={22} className="group-hover:text-primary transition-colors" />
                    <span className="font-arabic">{language === 'ar' ? 'استيراد إكسل' : 'Import Excel'}</span>
                    <input 
                      type="file" 
                      accept=".xlsx, .xls" 
                      onChange={handlePurchaseExcelImport}
                      className="hidden"
                    />
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:w-auto">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-6 min-w-[280px]">
                      <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center shadow-inner border border-emerald-100 dark:border-emerald-900/30">
                        <Coins size={32} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic">إجمالي المشتريات</p>
                        <p className="text-3xl font-black text-primary dark:text-slate-100">{(totalPurchasesCurrent || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spending Progress & Budget */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 font-arabic">ميزانية المشتريات</h3>
                    <p className="text-xs text-slate-600 font-bold font-arabic">تتبع الإنفاق مقابل الميزانية المحددة</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-black text-slate-600 uppercase font-arabic">الميزانية:</span>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={purchaseBudget}
                      onChange={(e) => {
                        const val = e.target.value;
                        const sanitized = val.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
                                             .replace(/[^0-9.]/g, '');
                        const parts = sanitized.split('.');
                        if (parts.length <= 2) setPurchaseBudget(Number(sanitized));
                      }}
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      className="w-24 bg-transparent border-none text-right font-black text-primary dark:text-accent focus:outline-none"
                    />
                    <span className="text-xs font-black text-slate-400">ريال</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-slate-600 font-arabic">نسبة الاستهلاك</span>
                    <span className={totalPurchasesCurrent > purchaseBudget ? 'text-red-500' : 'text-primary'}>
                      {Math.round((totalPurchasesCurrent / (purchaseBudget || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((totalPurchasesCurrent / (purchaseBudget || 1)) * 100, 100)}%` }}
                      className={`h-full rounded-full ${totalPurchasesCurrent > purchaseBudget ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-accent'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span className="font-arabic">0 ريال</span>
                    <span className="font-arabic">{purchaseBudget.toLocaleString()} ريال</span>
                  </div>
                </div>
              </div>

              {/* Add Purchase Form */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl no-print">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                  <div className="space-y-3 text-right">
                    <label className="text-sm font-black text-slate-600 dark:text-slate-400 mr-2 font-arabic">اسم المشتريات</label>
                    <input 
                      type="text" 
                      value={newPurchaseName}
                      onChange={(e) => setNewPurchaseName(e.target.value)}
                      placeholder="مثلاً: خضروات، أدوات نظافة..."
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold font-arabic"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3 text-right">
                      <label className="text-sm font-black text-slate-500 dark:text-slate-400 mr-2 font-arabic">سعر الوحدة</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          inputMode="decimal"
                          value={newPurchaseUnitPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            const sanitized = val.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
                                                 .replace(/[^0-9.]/g, '');
                            const parts = sanitized.split('.');
                            if (parts.length <= 2) setNewPurchaseUnitPrice(sanitized);
                          }}
                          placeholder="0.00"
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                          className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary transition-all font-bold"
                        />
                        <select
                          value={newPurchaseCurrency}
                          onChange={(e) => setNewPurchaseCurrency(e.target.value as 'YER' | 'SAR' | 'USD')}
                          className="px-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-sm"
                        >
                          <option value="YER">ر.ي</option>
                          <option value="SAR">ر.س</option>
                          <option value="USD">$</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3 text-right">
                      <label className="text-sm font-black text-slate-500 dark:text-slate-400 mr-2 font-arabic">العدد</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={newPurchaseCount}
                        onChange={(e) => {
                          const val = e.target.value;
                          const sanitized = val.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
                                               .replace(/[^0-9.]/g, '');
                          const parts = sanitized.split('.');
                          if (parts.length <= 2) setNewPurchaseCount(sanitized);
                        }}
                        placeholder="0"
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 text-right">
                    <label className="text-sm font-black text-slate-600 dark:text-slate-400 mr-2 font-arabic">ملاحظات / الكمية</label>
                    <input 
                      type="text" 
                      value={newPurchaseQuantity}
                      onChange={(e) => setNewPurchaseQuantity(e.target.value)}
                      placeholder="مثلاً: 5 كرتون"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold font-arabic"
                    />
                  </div>
                  <div className="space-y-3 text-right">
                    <label className="text-sm font-black text-slate-500 dark:text-slate-400 mr-2 font-arabic">الإجمالي</label>
                    <div className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 text-primary dark:text-accent font-black text-xl">
                      {(() => {
                        let rate = 1;
                        if (newPurchaseCurrency === 'SAR') rate = exchangeRates.SAR;
                        if (newPurchaseCurrency === 'USD') rate = exchangeRates.USD;
                        return (Number(newPurchaseUnitPrice) * Number(newPurchaseCount) * rate).toLocaleString();
                      })()}
                    </div>
                  </div>
                  <div className="space-y-3 text-right">
                    <label className="text-sm font-black text-slate-500 dark:text-slate-400 mr-2 font-arabic">التاريخ</label>
                    <div className="relative">
                      <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="date" 
                        value={newPurchaseDate}
                        onChange={(e) => setNewPurchaseDate(e.target.value)}
                        className="w-full pr-14 pl-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleInvoiceUpload}
                        className="hidden" 
                        id="invoice-upload"
                      />
                      <label 
                        htmlFor="invoice-upload"
                        className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer font-black font-arabic ${newPurchaseInvoice ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-primary hover:text-primary'}`}
                      >
                        <FileUp size={20} />
                        {newPurchaseInvoice ? 'تم إرفاق الفاتورة' : 'إرفاق فاتورة'}
                      </label>
                    </div>
                    <button 
                      onClick={addPurchase}
                      className="px-8 py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 font-arabic"
                    >
                      <Plus size={20} />
                      إضافة
                    </button>
                  </div>
                </div>
              </div>

              {/* Purchases Table */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-lg no-print space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4 no-print">
                  <div className="flex flex-wrap items-center gap-4">
                    <button 
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: language === 'ar' ? 'حذف المشتريات المحددة' : 'Delete Selected Purchases',
                          message: language === 'ar' ? `هل أنت متأكد من حذف ${selectedPurchases.size} من المشتريات؟` : `Are you sure you want to delete ${selectedPurchases.size} purchases?`,
                          type: 'danger',
                          onConfirm: () => {
                            setPurchases(purchases.filter(p => !selectedPurchases.has(p.id)));
                            setSelectedPurchases(new Set());
                          }
                        });
                      }}
                      disabled={selectedPurchases.size === 0}
                      className="px-6 py-3 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Trash2 size={18} />
                      {language === 'ar' ? 'حذف المحدد' : 'Delete Selected'}
                    </button>
                    <button 
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: language === 'ar' ? 'حذف جميع المشتريات' : 'Delete All Purchases',
                          message: language === 'ar' ? 'هل أنت متأكد من حذف جميع المشتريات في هذا الجدول؟' : 'Are you sure you want to delete all purchases in this table?',
                          type: 'danger',
                          onConfirm: () => {
                            const filteredIds = new Set(filteredPurchases.map(p => p.id));
                            setPurchases(purchases.filter(p => !filteredIds.has(p.id)));
                            setSelectedPurchases(new Set());
                          }
                        });
                      }}
                      className="px-6 py-3 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-2xl font-black text-sm hover:bg-red-200 transition-all flex items-center gap-2"
                    >
                      <RotateCcw size={18} />
                      {language === 'ar' ? 'حذف الكل' : 'Delete All'}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-primary" />
                      <select 
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 font-black text-slate-700 dark:text-slate-100 font-arabic outline-none cursor-pointer text-sm"
                      >
                        <option value="">{language === 'ar' ? 'اختر الشهر' : 'Select Month'}</option>
                        {availableMonths.map(m => (
                          <option key={m} value={m} className="dark:bg-slate-900">{m}</option>
                        ))}
                      </select>
                      {currentMonth && (
                        <button 
                          onClick={() => deleteMonth(currentMonth)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={language === 'ar' ? 'حذف هذا الشهر' : 'Delete this month'}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-500 dark:text-slate-400 font-arabic">{t.from}</span>
                      <input 
                        type="date" 
                        value={purchaseStartDate}
                        onChange={(e) => setPurchaseStartDate(e.target.value)}
                        className="px-4 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-600 dark:text-slate-400 font-arabic">{t.to}</span>
                      <input 
                        type="date" 
                        value={purchaseEndDate}
                        onChange={(e) => setPurchaseEndDate(e.target.value)}
                        className="px-4 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-sm"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setPurchaseStartDate('');
                        setPurchaseEndDate('');
                        setPurchaseSearchQuery('');
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title={language === 'ar' ? 'مسح التصفية' : 'Clear Filters'}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="relative w-full lg:w-96 mb-6">
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    value={purchaseSearchQuery}
                    onChange={(e) => setPurchaseSearchQuery(e.target.value)}
                    placeholder="بحث في المشتريات..."
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    className="w-full pr-14 pl-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold font-arabic"
                  />
                </div>

                <div className="bg-beige-50 dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-white/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                          <th className="px-4 py-6 no-print">
                            <input 
                              type="checkbox" 
                              checked={filteredPurchases.length > 0 && filteredPurchases.every(p => selectedPurchases.has(p.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const newSelected = new Set(selectedPurchases);
                                  filteredPurchases.forEach(p => newSelected.add(p.id));
                                  setSelectedPurchases(newSelected);
                                } else {
                                  const newSelected = new Set(selectedPurchases);
                                  filteredPurchases.forEach(p => newSelected.delete(p.id));
                                  setSelectedPurchases(newSelected);
                                }
                              }}
                              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                          </th>
                          <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic">اسم المشتريات</th>
                          <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">سعر الوحدة</th>
                          <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">العدد</th>
                          <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">الإجمالي</th>
                          <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">ملاحظات</th>
                          <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">التاريخ</th>
                          <th className="px-8 py-6 text-sm font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider font-arabic text-center">الفاتورة</th>
                          <th className="px-8 py-6 text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-arabic text-center no-print">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredPurchases.map((purchase) => (
                          <tr key={purchase.id} className={`hover:bg-white/30 dark:hover:bg-slate-900/30 transition-colors group ${selectedPurchases.has(purchase.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                            <td className="px-4 py-5 no-print">
                              <input 
                                type="checkbox" 
                                checked={selectedPurchases.has(purchase.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedPurchases);
                                  if (e.target.checked) newSelected.add(purchase.id);
                                  else newSelected.delete(purchase.id);
                                  setSelectedPurchases(newSelected);
                                }}
                                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                              />
                            </td>
                            <td className="px-8 py-5">
                              <p className="font-black text-primary dark:text-slate-100 font-arabic">{purchase.name}</p>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="font-black text-slate-600 dark:text-slate-400">{(purchase.unitPrice || 0).toFixed(2)}</span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="font-black text-slate-600 dark:text-slate-400">{purchase.count || 0}</span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="font-black text-emerald-600 dark:text-emerald-400">{(purchase.value || 0).toFixed(2)}</span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <input 
                                type="text"
                                value={purchase.notes || ''}
                                onChange={(e) => {
                                  const updated = purchases.map(p => p.id === purchase.id ? { ...p, notes: e.target.value } : p);
                                  setPurchases(updated);
                                }}
                                placeholder={language === 'ar' ? 'ملاحظات...' : 'Notes...'}
                                className="w-full bg-transparent border-none text-xs font-bold text-slate-500 dark:text-slate-400 focus:outline-none text-right font-arabic"
                              />
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="font-black text-slate-400 dark:text-slate-500">{purchase.date}</span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              {purchase.invoiceImage ? (
                                <button 
                                  onClick={() => setShowInvoiceModal(purchase.invoiceImage!)}
                                  className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all mx-auto"
                                >
                                  <FileText size={18} />
                                </button>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">-</span>
                              )}
                            </td>
                            <td className="px-8 py-5 text-center no-print">
                              <button 
                                onClick={() => deletePurchase(purchase.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredPurchases.length === 0 && (
                      <div className="py-24 text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto">
                          <ShoppingCart size={40} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-black text-slate-400 dark:text-slate-500 font-arabic">لا توجد مشتريات مسجلة</p>
                          <p className="text-sm text-slate-300 dark:text-slate-600 font-bold font-arabic">أضف مشتريات جديدة للبدء في تتبع المصاريف</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {/* Reports Module */}
          {currentModule === 'reports' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Reports Header */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2 text-right">
                  <h2 className="text-4xl font-black text-primary dark:text-slate-100 font-arabic">{t.reports}</h2>
                  <p className="text-slate-400 dark:text-slate-500 font-bold font-arabic">{t.managementReport}</p>
                </div>
                <button 
                  onClick={() => setCurrentModule('selection')}
                  className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-arabic flex items-center gap-2"
                >
                  <ArrowRight size={20} className={language === 'ar' ? '' : 'rotate-180'} />
                  {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                </button>
              </div>

              {/* Report Configuration */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl space-y-8">
                <div className="flex items-center gap-4 text-primary">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <h3 className="text-xl font-black font-arabic">{t.reportPeriod}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-4 no-print">
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                    <Calendar size={20} className="text-primary" />
                    <select 
                      value={currentMonth}
                      onChange={(e) => {
                        const month = e.target.value;
                        setCurrentMonth(month);
                        if (month) {
                          const [year, monthNum] = month.split('-');
                          const firstDay = `${year}-${monthNum}-01`;
                          const lastDay = new Date(Number(year), Number(monthNum), 0).toISOString().split('T')[0];
                          setReportStartDate(firstDay);
                          setReportEndDate(lastDay);
                        }
                      }}
                      className="bg-transparent border-none focus:ring-0 font-black text-slate-700 dark:text-slate-100 font-arabic outline-none cursor-pointer"
                    >
                      <option value="">{language === 'ar' ? 'اختر الشهر' : 'Select Month'}</option>
                      {availableMonths.map(m => (
                        <option key={m} value={m} className="dark:bg-slate-900">{m}</option>
                      ))}
                    </select>
                    {currentMonth && (
                      <button 
                        onClick={() => deleteMonth(currentMonth)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mr-auto"
                        title={language === 'ar' ? 'حذف هذا الشهر' : 'Delete this month'}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-400 font-arabic">سيتم تصفية بيانات المشتريات والاشتراكات حسب الشهر المحدد في التقرير</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 dark:text-slate-400 font-arabic">{t.from}</label>
                    <input 
                      type="date" 
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 dark:text-slate-400 font-arabic">{t.to}</label>
                    <input 
                      type="date" 
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 dark:text-slate-400 font-arabic">موجه إلى (جهة المخاطبة)</label>
                    <input 
                      type="text" 
                      value={reportAddressee}
                      onChange={(e) => setReportAddressee(e.target.value)}
                      placeholder="مثال: مدير أكاديمية النبلاء"
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 dark:text-slate-400 font-arabic">اسم معد التقرير</label>
                    <input 
                      type="text" 
                      value={reportPreparer}
                      onChange={(e) => setReportPreparer(e.target.value)}
                      placeholder="الاسم الثلاثي"
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={generateWordReport}
                    disabled={isGeneratingReport || !reportStartDate || !reportEndDate}
                    className="flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200/30 font-arabic"
                  >
                    {isGeneratingReport ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileText size={22} />}
                    {t.downloadWord}
                  </button>
                  <button 
                    onClick={generatePDFReport}
                    disabled={isGeneratingReport || !reportStartDate || !reportEndDate}
                    className="flex items-center justify-center gap-3 px-8 py-5 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-200/30 font-arabic"
                  >
                    {isGeneratingReport ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileDown size={22} />}
                    {t.downloadPDF}
                  </button>
                  <button 
                    onClick={generateExcelReport}
                    disabled={isGeneratingReport || !reportStartDate || !reportEndDate}
                    className="flex items-center justify-center gap-3 px-8 py-5 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200/30 font-arabic"
                  >
                    {isGeneratingReport ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={22} />}
                    {language === 'ar' ? 'تحميل إكسل' : 'Download Excel'}
                  </button>
                </div>
              </div>

              {/* Report Preview / Summary */}
              <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto w-full">

                <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                  <h3 className="text-xl font-black text-primary dark:text-slate-100 font-arabic text-center">{t.netBalance}</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                      <span className="font-black text-emerald-700 dark:text-emerald-400 font-arabic">{t.totalSubscriptions}</span>
                      <span className="font-black text-emerald-700 dark:text-emerald-400">
                        {getFilteredFinanceData(reportStartDate, reportEndDate).reduce((acc, s) => acc + s.paidAmount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                      <span className="font-black text-red-700 dark:text-red-400 font-arabic">{t.totalPurchases}</span>
                      <span className="font-black text-red-700 dark:text-red-400">
                        {getFilteredPurchasesData(reportStartDate, reportEndDate).reduce((acc, p) => acc + p.value, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 relative group">
                      {(() => {
                        const calculatedSurplus = getFilteredFinanceData(reportStartDate, reportEndDate).reduce((acc, s) => acc + s.paidAmount, 0) - 
                          getFilteredPurchasesData(reportStartDate, reportEndDate).reduce((acc, p) => acc + p.value, 0);
                        return (
                          <>
                            <span className="text-lg font-black font-arabic">
                              {calculatedSurplus >= 0 
                                ? (language === 'ar' ? 'الفائض' : 'Surplus') 
                                : (language === 'ar' ? 'العجز' : 'Deficit')}
                            </span>
                            <span className="text-2xl font-black">
                              {Math.abs(calculatedSurplus).toLocaleString()}
                            </span>
                          </>
                        );
                      })()}
                      <button 
                        onClick={() => {
                          // Force re-render by updating a dummy state or just rely on the fact that it's calculated on render
                          // But user might want to "refresh" data from source if it was cached
                          // For now, it's always calculated on render, so this is just for visual feedback
                          setIsGeneratingReport(true);
                          setTimeout(() => setIsGeneratingReport(false), 500);
                        }}
                        className="absolute -top-3 -right-3 w-10 h-10 bg-white text-primary rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        title={language === 'ar' ? 'تحديث الحسابات' : 'Refresh Calculations'}
                      >
                        <RotateCcw size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Hidden Printable Report Template */}
      {printMode === 'report' && (
        <div id="printable-report" className="hidden print:block print-only font-arabic text-right" dir="rtl">
        {(() => {
          const filteredFinance = getFilteredFinanceData(reportStartDate, reportEndDate);
          const filteredPurchases = getFilteredPurchasesData(reportStartDate, reportEndDate);
          const totalSub = filteredFinance.reduce((acc, s) => acc + s.paidAmount, 0);
          const totalPur = filteredPurchases.reduce((acc, p) => acc + p.value, 0);
          const surplus = totalSub - totalPur;
          const studentCount = filteredFinance.filter(s => s.paidAmount > 0).length;
          const reportDate = new Date(reportEndDate);
          const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
          const monthName = monthNames[reportDate.getMonth()];
          const year = reportDate.getFullYear();
          const today = new Date().toLocaleDateString('ar-SA');
          const referenceNumber = Math.floor(Math.random() * 100000);
          const addresseeText = reportAddressee.trim() || 'مدير أكاديمية النبلاء';
          const preparerText = reportPreparer.trim() || '........................................';

          return (
            <>
              {/* 1. Top Banner & 2. Reference Data */}
              <div className="flex justify-between items-start mb-8">
                <div className="text-right">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-white">
                      <ShieldCheck size={28} />
                    </div>
                    <div className="text-slate-700 text-[10px] font-bold leading-relaxed">
                      أكاديمية النبلاء<br/>الإدارة المالية
                    </div>
                  </div>
                </div>
                <div className="text-left text-sm font-medium text-slate-600 space-y-2">
                  <p>التاريخ: [{today}]</p>
                  <p>الرقم المرجعي: [{referenceNumber}/ص]</p>
                </div>
              </div>

              {/* 3. Strategic Title */}
              <div className="w-full bg-slate-100 py-4 mb-8 mt-12">
                <h1 className="text-center text-[14px] font-bold text-slate-800">
                  تقرير التسوية المالية لشهر ({monthName})
                </h1>
              </div>

              {/* 4. Addressing & Official Message */}
              <div className="mb-8 pr-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-lg font-bold text-slate-800">السيد / {addresseeText} المحترم.</p>
                  <p className="text-lg text-slate-800">تحية طيبة وبعد،،</p>
                </div>
                <p className="text-base text-slate-700 leading-relaxed text-justify">
                  بالإشارة إلى الموضوع أعلاه، وفي إطار حرصنا على الشفافية المالية والمتابعة الدقيقة للخدمات المقدمة لطلابنا، نرفق لكم طيه الكشوفات المالية التفصيلية الخاصة بشهر {monthName} لعام {year}، والتي تتضمن البنود التالية:
                  <br/>1. كشف اشتراكات التغذية: موضحاً فيه عدد الطلاب المشتركين ({studentCount})، وإجمالي المبالغ المحصلة ({totalSub.toLocaleString()} ريال).
                  <br/>2. كشف المشتريات: تفصيل للمصاريف التشغيلية والمواد التي تم تأمينها خلال الشهر ({totalPur.toLocaleString()} ريال) مدعومة بالفواتير اللازمة.
                  <br/>3. {surplus >= 0 ? 'الفائض المالي' : 'العجز المالي'}: بيان الرصيد المتبقي بعد تسوية كافة المصاريف والالتزامات المالية ({Math.abs(surplus).toLocaleString()} ريال).
                  <br/><br/>نرجو من سيادتكم التكرم بمراجعة هذه الكشوفات والاطلاع عليها، مع العلم أننا على أتم الاستعداد للإجابة عن أي استفسارات أو تقديم توضيحات إضافية حول أي من البنود الواردة.
                  <br/>شاكرين لكم حسن تعاونكم ودعمكم المستمر لتطوير العمل في الأكاديمية.
                </p>
              </div>

              {/* 5. Data Grid (Two Columns: Income / Expenses) */}
              <div className="mb-10">
                <table className="w-full border-collapse border border-slate-400 text-right">
                  <thead>
                    <tr className="bg-[#d4d4d4] text-black">
                      <th className="border border-slate-400 p-3 w-1/2 text-center font-bold text-lg">المصاريف</th>
                      <th className="border border-slate-400 p-3 w-1/2 text-center font-bold text-lg">المداخيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 p-4 align-top">
                        <div className="space-y-4">
                          <div>
                            <p className="font-bold text-slate-900">مشتريات دورية:</p>
                            <p className="text-lg text-slate-800">{totalPur.toLocaleString()} ريال</p>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">مصاريف نثرية:</p>
                            <p className="text-lg text-slate-800">0 ريال</p>
                          </div>
                        </div>
                      </td>
                      <td className="border border-slate-400 p-4 align-top">
                        <div className="space-y-4">
                          <div>
                            <p className="font-bold text-slate-900">اشتراكات التغذية:</p>
                            <p className="text-slate-800">{studentCount} طالب × اشتراك = {totalSub.toLocaleString()} ريال</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-400 p-3 font-black text-slate-900 text-lg">
                        المجموع: {totalPur.toLocaleString()} ريال
                      </td>
                      <td className="border border-slate-400 p-3 font-black text-slate-900 text-lg">
                        المجموع: {totalSub.toLocaleString()} ريال
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 6. Summary Text */}
              <div className="mb-16">
                <p className="text-xl font-bold text-slate-900 leading-relaxed">
                  - قيمة {surplus >= 0 ? 'الفائض المالي' : 'العجز المالي'} لهذا الشهر هو: {Math.abs(surplus).toLocaleString()} ريال.
                </p>
                <p className="text-lg text-slate-800 mt-2">
                  ( فقط {Math.abs(surplus).toLocaleString()} ريال لا غير )
                </p>
              </div>

              {/* 7. Detailed Subscriptions Table */}
              <div className="mt-16" style={{ pageBreakBefore: 'always' }}>
                <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">كشف اشتراكات التغذية</h2>
                <table className="w-full border-collapse border border-slate-400 text-right text-sm">
                  <thead>
                    <tr className="bg-[#d4d4d4] text-black">
                      <th className="border border-slate-400 p-2 text-center">م</th>
                      <th className="border border-slate-400 p-2 text-center">اسم الطالب</th>
                      <th className="border border-slate-400 p-2 text-center">قيمة الاشتراك</th>
                      <th className="border border-slate-400 p-2 text-center">المبلغ المسدد</th>
                      <th className="border border-slate-400 p-2 text-center">المتبقي</th>
                      <th className="border border-slate-400 p-2 text-center">حالة السداد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFinance.map((s, idx) => (
                      <tr key={s.id}>
                        <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 p-2">{s.name}</td>
                        <td className="border border-slate-400 p-2 text-center">{s.monthlySubscription || globalSubscription}</td>
                        <td className="border border-slate-400 p-2 text-center">{s.paidAmount}</td>
                        <td className="border border-slate-400 p-2 text-center">{s.remainingAmount || Math.max(0, (s.monthlySubscription || globalSubscription) - s.paidAmount)}</td>
                        <td className="border border-slate-400 p-2 text-center">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 9. Detailed Purchases Table */}
              <div className="mt-16" style={{ pageBreakBefore: 'always' }}>
                <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">كشف المشتريات</h2>
                <table className="w-full border-collapse border border-slate-400 text-right text-sm">
                  <thead>
                    <tr className="bg-[#d4d4d4] text-black">
                      <th className="border border-slate-400 p-2 text-center">م</th>
                      <th className="border border-slate-400 p-2 text-center">البيان</th>
                      <th className="border border-slate-400 p-2 text-center">الكمية</th>
                      <th className="border border-slate-400 p-2 text-center">القيمة</th>
                      <th className="border border-slate-400 p-2 text-center">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((p, idx) => (
                      <tr key={p.id}>
                        <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 p-2">{p.name}</td>
                        <td className="border border-slate-400 p-2 text-center">{p.quantity || '1'}</td>
                        <td className="border border-slate-400 p-2 text-center">{p.value}</td>
                        <td className="border border-slate-400 p-2 text-center">{p.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 9. Validation */}
              <div className="mt-16 text-left pl-8" style={{ pageBreakInside: 'avoid' }}>
                <div className="inline-block text-right space-y-6">
                  <p className="text-lg"><span className="font-bold w-32 inline-block">معد التقرير:</span> {preparerText}</p>
                  <p className="text-lg"><span className="font-bold w-32 inline-block">الوظيفة:</span> ........................................</p>
                  <p className="text-lg"><span className="font-bold w-32 inline-block">التوقيع والختم:</span> ........................................</p>
                </div>
              </div>
            </>
          );
        })()}
      </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        language={language}
      />

      {/* Offline/Online Toast */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 font-arabic"
          >
            <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center">
              <WifiOff size={20} />
            </div>
            <div>
              <p className="text-sm font-black">أنت الآن تعمل في وضع عدم الاتصال</p>
              <p className="text-[10px] font-bold text-slate-400">سيتم حفظ التعديلات محلياً ومزامنتها لاحقاً</p>
            </div>
          </motion.div>
        )}
        {showOnlineToast && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-2xl font-arabic"
          >
            <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center">
              <Wifi size={20} />
            </div>
            <div>
              <p className="text-sm font-black">تم استعادة الاتصال بالإنترنت</p>
              <p className="text-[10px] font-bold text-emerald-100">جاري مزامنة البيانات مع السحابة...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Sidebar */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm no-print"
            />
            <motion.div 
              initial={{ x: language === 'ar' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'ar' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 ${language === 'ar' ? 'right-0' : 'left-0'} bottom-0 w-full max-w-sm bg-white dark:bg-slate-900 z-[70] shadow-2xl flex flex-col no-print`}
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 font-arabic">{t.settings}</h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Cloud Sync Section */}
                {isFirebaseConfigured && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">{language === 'ar' ? 'المزامنة السحابية' : 'Cloud Sync'}</h4>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">
                            {isOnline ? (language === 'ar' ? 'متصل' : 'Online') : (language === 'ar' ? 'غير متصل' : 'Offline')}
                          </span>
                        </div>
                        {isSyncing && <RotateCcw size={12} className="animate-spin text-indigo-500" />}
                      </div>
                      <button 
                        onClick={syncDataToCloud}
                        disabled={!isOnline || isSyncing}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all disabled:opacity-50 font-arabic"
                      >
                        <Database size={14} />
                        {language === 'ar' ? 'مزامنة الآن' : 'Sync Now'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Backup & Restore */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Database className="text-primary" size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 dark:text-slate-100 font-arabic">{language === 'ar' ? 'خزنة البيانات (النسخ الاحتياطي)' : 'Data Vault (Backup)'}</h3>
                      <p className="text-[10px] text-slate-500 font-bold">{language === 'ar' ? 'النسخ الاحتياطي التلقائي مفعل' : 'Auto-backup enabled'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        const data = localStorage.getItem(`nobles_backup_${new Date().toISOString().split('T')[0]}`) || JSON.stringify({ students, financeStudents, purchases, logs, globalSubscription, purchaseBudget });
                        const blob = new Blob([data], { type: 'application/json' });
                        saveAs(blob, `Nobles_Backup_${new Date().toISOString().split('T')[0]}.json`);
                      }}
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Download size={20} className="text-primary" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-arabic">{language === 'ar' ? 'تحميل نسخة' : 'Download'}</span>
                    </button>
                    <label className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                      <Upload size={20} className="text-accent" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-arabic">{language === 'ar' ? 'استعادة نسخة' : 'Restore'}</span>
                      <input 
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                const data = JSON.parse(event.target?.result as string);
                                if (data.students) setStudents(data.students);
                                if (data.financeStudents) setFinanceStudents(data.financeStudents);
                                if (data.purchases) setPurchases(data.purchases);
                                if (data.logs) setLogs(data.logs);
                                if (data.globalSubscription) setGlobalSubscription(data.globalSubscription);
                                if (data.purchaseBudget) setPurchaseBudget(data.purchaseBudget);
                                alert(language === 'ar' ? 'تمت استعادة البيانات بنجاح' : 'Data restored successfully');
                              } catch (err) {
                                alert(language === 'ar' ? 'ملف النسخة الاحتياطية غير صالح' : 'Invalid backup file');
                              }
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Language Toggle */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">{t.language}</h4>
                  <button 
                    onClick={toggleLanguage}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="text-primary" size={20} />
                      <span className="font-bold text-slate-700 dark:text-slate-200">{language === 'ar' ? 'العربية' : 'English'}</span>
                    </div>
                    <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg">
                      {language === 'ar' ? 'AR' : 'EN'}
                    </div>
                  </button>
                </div>

                {/* Currency Exchange Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'ar' ? 'أسعار الصرف (وكالة ديسمبر - عدن)' : 'Exchange Rates (December Agency)'}</h4>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const fetchRates = async () => {
                              try {
                                const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                                const data = await response.json();
                                if (data.rates && data.rates.YER) {
                                  // Align with December Agency market rates
                                  const marketSar = 410;
                                  const marketUsd = 1550;
                                  setExchangeRates({ 
                                    SAR: marketSar, 
                                    USD: marketUsd 
                                  });
                                  setLastRateUpdate(new Date().toISOString());
                                  localStorage.setItem('nobles_last_rate_update', new Date().toISOString());
                                  localStorage.setItem('nobles_exchange_rates', JSON.stringify({ 
                                    SAR: marketSar, 
                                    USD: marketUsd 
                                  }));
                                }
                              } catch (e) { console.error(e); }
                            };
                            fetchRates();
                          }}
                          className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-md transition-colors text-indigo-600"
                          title={language === 'ar' ? 'تحديث الآن' : 'Refresh Now'}
                        >
                          <RotateCcw size={14} />
                        </button>
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-md font-bold">
                          {language === 'ar' ? 'تحديث تلقائي ساعي' : 'Hourly Auto-Update'}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {language === 'ar' ? 'آخر تحديث: ' : 'Last update: '}
                        {new Date(lastRateUpdate).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-300 font-arabic">الريال السعودي (SAR)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          step="any"
                          inputMode="decimal"
                          value={exchangeRates.SAR}
                          onChange={(e) => setExchangeRates({ ...exchangeRates, SAR: Number(e.target.value) })}
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-indigo-500 font-bold"
                        />
                        <span className="text-sm font-black text-slate-400">ر.ي</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-300 font-arabic">الدولار الأمريكي (USD)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          step="any"
                          inputMode="decimal"
                          value={exchangeRates.USD}
                          onChange={(e) => setExchangeRates({ ...exchangeRates, USD: Number(e.target.value) })}
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-indigo-500 font-bold"
                        />
                        <span className="text-sm font-black text-slate-400">ر.ي</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share & Permanent Access */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">{language === 'ar' ? 'الوصول الدائم' : 'Permanent Access'}</h4>
                  <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 dark:border-primary/20 space-y-3">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-arabic leading-relaxed">
                      {language === 'ar' 
                        ? 'هذا التطبيق يعمل بشكل مستقل ودائم. يمكنك استخدامه من أي متصفح أو تثبيته على هاتفك للوصول السريع حتى بدون إنترنت.'
                        : 'This app works independently and permanently. You can use it from any browser or install it on your phone for quick access even offline.'}
                    </p>
                    <button 
                      onClick={() => {
                        const url = window.location.href;
                        navigator.clipboard.writeText(url);
                        setConfirmModal({
                          isOpen: true,
                          title: language === 'ar' ? 'تم النسخ' : 'Link Copied',
                          message: language === 'ar' ? 'تم نسخ رابط التطبيق المباشر. يمكنك الآن فتحه من أي متصفح خارج بيئة التطوير.' : 'Direct app link copied. You can now open it in any browser outside the development environment.',
                          type: 'info',
                          onConfirm: () => setConfirmModal({ ...confirmModal, isOpen: false })
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-black text-xs hover:bg-primary/90 transition-all font-arabic"
                    >
                      <Globe size={14} />
                      {language === 'ar' ? 'نسخ رابط التطبيق المباشر' : 'Copy Direct App Link'}
                    </button>
                    <button 
                      onClick={() => {
                        if (window.caches) {
                          caches.keys().then((names) => {
                            for (const name of names) caches.delete(name);
                          });
                        }
                        localStorage.clear();
                        window.location.reload();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-black text-xs hover:bg-red-100 dark:hover:bg-red-900/20 transition-all font-arabic"
                    >
                      <RotateCcw size={14} />
                      {language === 'ar' ? 'مسح التخزين المؤقت وإعادة التشغيل' : 'Clear Cache & Restart'}
                    </button>
                  </div>
                </div>

                {/* Support & Contact */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">{t.support}</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <a 
                      href="https://wa.me/967739542075" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
                    >
                      <MessageCircle size={20} />
                      <span className="font-bold">واتساب</span>
                    </a>
                    <a 
                      href="mailto:hasaoah@gmail.com"
                      className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                    >
                      <Mail size={20} />
                      <span className="font-bold">البريد الإلكتروني</span>
                    </a>
                  </div>
                </div>

                {/* Legal & Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">{t.about}</h4>
                  <div className="space-y-2">
                    <button onClick={() => setShowHelp(true)} className="w-full flex items-center gap-3 p-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
                      <HelpCircle size={20} />
                      <span className="font-bold">{t.help}</span>
                    </button>
                    <button onClick={() => setShowTerms(true)} className="w-full flex items-center gap-3 p-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
                      <FileSignature size={20} />
                      <span className="font-bold">{t.terms}</span>
                    </button>
                    <button onClick={() => setShowPrivacy(true)} className="w-full flex items-center gap-3 p-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
                      <Shield size={20} />
                      <span className="font-bold">{t.privacy}</span>
                    </button>
                    <button onClick={() => setShowAbout(true)} className="w-full flex items-center gap-3 p-4 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
                      <Info size={20} />
                      <span className="font-bold">{t.about}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t.version} 2.1.0</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold mt-1 tracking-widest uppercase">MADE BY ENG. HUSSAM AL-HAJJAR</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Legal Modals */}
      <LegalModal 
        isOpen={showAbout} 
        onClose={() => setShowAbout(false)} 
        title={t.about}
        language={language}
      >
        <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'} font-arabic`}>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center">
              <img src="/logo.svg" alt="Logo" className="w-16 h-16" referrerPolicy="no-referrer" />
            </div>
            <h3 className="text-2xl font-black text-primary">{t.title}</h3>
            <p className="text-slate-500 font-bold">{t.version} 2.1.0</p>
          </div>
          <p className="text-slate-600 leading-relaxed font-bold">
            {language === 'ar' 
              ? 'هذا التطبيق مصمم خصيصاً لأكاديمية النبلاء لتسهيل إدارة شؤون الطلاب، المطبخ، والمالية. يهدف النظام إلى تحويل العمليات الورقية إلى رقمية بالكامل لضمان الدقة والسرعة.'
              : 'This application is specifically designed for Nobles Academy to facilitate the management of student affairs, kitchen, and finance. The system aims to fully digitize paper operations to ensure accuracy and speed.'}
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-sm font-black text-slate-800 mb-1">{t.developer}</p>
            <p className="text-xs text-slate-500 font-bold">
              {language === 'ar' ? 'جميع الحقوق محفوظة © 2026' : 'All rights reserved © 2026'}
            </p>
          </div>
        </div>
      </LegalModal>

      <LegalModal 
        isOpen={showPrivacy} 
        onClose={() => setShowPrivacy(false)} 
        title={t.privacy}
        language={language}
      >
        <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} font-arabic text-slate-600 font-bold leading-relaxed`}>
          <h3 className="text-lg font-black text-slate-800">{language === 'ar' ? '1. جمع البيانات' : '1. Data Collection'}</h3>
          <p>{language === 'ar' ? 'نحن نقوم بجمع بيانات الطلاب الأساسية (الاسم، القسم، الباركود) لغرض الإدارة الداخلية فقط.' : 'We collect basic student data (name, department, barcode) for internal management purposes only.'}</p>
          <h3 className="text-lg font-black text-slate-800">{language === 'ar' ? '2. حماية البيانات' : '2. Data Protection'}</h3>
          <p>{language === 'ar' ? 'يتم تخزين جميع البيانات محلياً على جهازك أو عبر خوادم آمنة مشفرة. لا يتم مشاركة البيانات مع أي أطراف ثالثة.' : 'All data is stored locally on your device or via secure encrypted servers. Data is not shared with any third parties.'}</p>
          <h3 className="text-lg font-black text-slate-800">{language === 'ar' ? '3. ملفات تعريف الارتباط' : '3. Cookies'}</h3>
          <p>{language === 'ar' ? 'يستخدم التطبيق الذاكرة المحلية (LocalStorage) لحفظ إعداداتك وتفضيلاتك (مثل الوضع الليلي واللغة).' : 'The app uses LocalStorage to save your settings and preferences (like dark mode and language).'}</p>
        </div>
      </LegalModal>

      <LegalModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        title={t.terms}
        language={language}
      >
        <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} font-arabic text-slate-600 font-bold leading-relaxed`}>
          <h3 className="text-lg font-black text-slate-800">{language === 'ar' ? '1. الاستخدام المقبول' : '1. Acceptable Use'}</h3>
          <p>{language === 'ar' ? 'يقتصر استخدام هذا التطبيق على موظفي وإدارة أكاديمية النبلاء المصرح لهم فقط.' : 'Use of this app is restricted to authorized employees and management of Nobles Academy only.'}</p>
          <h3 className="text-lg font-black text-slate-800">{language === 'ar' ? '2. المسؤولية' : '2. Responsibility'}</h3>
          <p>{language === 'ar' ? 'الإدارة مسؤولة عن دقة البيانات المدخلة في النظام. التطبيق يوفر الأدوات اللازمة للمعالجة والحساب.' : 'Management is responsible for the accuracy of data entered into the system. The app provides tools for processing and calculation.'}</p>
          <h3 className="text-lg font-black text-slate-800">{language === 'ar' ? '3. التحديثات' : '3. Updates'}</h3>
          <p>{language === 'ar' ? 'نحتفظ بالحق في تحديث التطبيق وإضافة ميزات جديدة لتحسين تجربة المستخدم.' : 'We reserve the right to update the app and add new features to improve user experience.'}</p>
        </div>
      </LegalModal>

      <LegalModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        title={t.help}
        language={language}
      >
        <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'} font-arabic`}>
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <h4 className="font-black text-primary mb-2">{language === 'ar' ? 'كيفية إضافة طالب؟' : 'How to add a student?'}</h4>
              <p className="text-sm text-slate-600 font-bold">{language === 'ar' ? 'انتقل إلى قسم المطبخ، ثم "إدارة البطاقات"، واضغط على زر "إضافة طالب جديد".' : 'Go to Kitchen, then "Card Management", and click "Add New Student".'}</p>
            </div>
            <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
              <h4 className="font-black text-accent mb-2">{language === 'ar' ? 'كيفية تغيير كلمة المرور؟' : 'How to change password?'}</h4>
              <p className="text-sm text-slate-600 font-bold">{language === 'ar' ? 'يمكنك إعادة تعيين كلمة المرور من واجهة التطوير عبر خيار "إعادة التعيين" في نافذة القفل.' : 'You can reset the password from the development interface via the "Reset" option in the lock window.'}</p>
            </div>
          </div>
        </div>
      </LegalModal>

      {/* Password Modal */}
      <AnimatePresence>
        {isModuleLocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-xl no-print"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-white/20 text-center space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
              
              <div className="w-24 h-24 bg-beige-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-slate-100 dark:border-slate-700">
                <Lock size={48} className={`text-primary dark:text-accent ${loginError ? 'text-red-500' : ''}`} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-primary dark:text-slate-100 font-arabic">{language === 'ar' ? 'قسم محمي' : 'Protected Module'}</h3>
                <p className={`text-slate-400 dark:text-slate-500 font-bold font-arabic ${loginError ? 'text-red-500' : ''}`}>
                  {loginError ? (language === 'ar' ? 'كلمة المرور غير صحيحة!' : 'Incorrect password!') : t.enterPass}
                </p>
              </div>

              <motion.div 
                animate={loginError ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Key className={`absolute ${language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 ${loginError ? 'text-red-500' : 'text-slate-400'}`} size={20} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                    placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
                    className={`w-full ${language === 'ar' ? 'pr-14 pl-14' : 'pl-14 pr-14'} py-5 rounded-2xl border-2 ${loginError ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'} focus:outline-none focus:border-primary transition-all font-black text-center text-2xl tracking-[0.5em]`}
                    autoFocus
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${language === 'ar' ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors`}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setIsModuleLocked(false);
                      setPendingModule(null);
                      setPasswordInput('');
                    }}
                    className="flex-1 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 text-slate-400 font-black hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-arabic"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button 
                    onClick={verifyPassword}
                    className="flex-[2] py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all font-arabic"
                  >
                    {language === 'ar' ? 'دخول' : 'Enter'}
                  </button>
                </div>

                {/* Reset Password Option */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    onClick={openResetPassword}
                    className="text-xs font-black text-slate-300 hover:text-primary transition-colors font-arabic flex items-center gap-2 mx-auto"
                  >
                    <ShieldCheck size={14} />
                    {t.resetPass}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md no-print"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-700 text-center space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
              
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto text-amber-500">
                <Key size={40} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-arabic">
                  {language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold font-arabic text-sm">
                  {resetStep === 1 
                    ? (language === 'ar' ? 'يرجى إدخال كلمة المرور الحالية للمتابعة' : 'Please enter current password to continue')
                    : (language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter your new password')}
                </p>
              </div>

              {resetError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl text-sm font-bold font-arabic animate-pulse">
                  {resetError}
                </div>
              )}

              {resetStep === 1 ? (
                <div className="space-y-4">
                  <input 
                    type="password"
                    value={resetCurrentPassword}
                    onChange={(e) => setResetCurrentPassword(e.target.value)}
                    placeholder={language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-amber-500 transition-all font-black text-center text-xl tracking-widest"
                  />
                  <button 
                    onClick={handleResetStep1}
                    className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all font-arabic"
                  >
                    {language === 'ar' ? 'متابعة' : 'Continue'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input 
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder={language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-amber-500 transition-all font-black text-center text-xl tracking-widest"
                  />
                  <input 
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder={language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-amber-500 transition-all font-black text-center text-xl tracking-widest"
                  />
                  <button 
                    onClick={handleResetStep2}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all font-arabic"
                  >
                    {language === 'ar' ? 'حفظ كلمة المرور' : 'Save Password'}
                  </button>
                </div>
              )}

              <button 
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice Viewer Modal */}
      <AnimatePresence>
        {showInvoiceModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInvoiceModal(null)}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h4 className="font-black text-primary dark:text-slate-100 font-arabic">{language === 'ar' ? 'عرض الفاتورة' : 'View Invoice'}</h4>
                <button 
                  onClick={() => setShowInvoiceModal(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 overflow-auto max-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <img 
                  src={showInvoiceModal} 
                  alt="Invoice" 
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
