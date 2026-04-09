import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: any): any {
    return { hasError: true, error };
  }

  public componentDidCatch(error: any, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-right" dir="rtl">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full space-y-6 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">عذراً، حدث خطأ ما</h2>
              <p className="text-slate-500">حدث خطأ غير متوقع في التطبيق. يمكنك محاولة إعادة تحميل الصفحة.</p>
            </div>
            {(this as any).state.error && (
              <div className="p-4 bg-slate-50 rounded-2xl text-xs font-mono text-slate-400 overflow-auto max-h-32 text-left">
                {(this as any).state.error.toString()}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <RefreshCw size={20} />
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
