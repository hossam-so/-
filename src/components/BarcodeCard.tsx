import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { motion } from 'motion/react';
import { Download, Share2 } from 'lucide-react';

interface BarcodeCardProps {
  userData: any;
}

const BarcodeCard: React.FC<BarcodeCardProps> = ({ userData }) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && userData?.studentId) {
      JsBarcode(barcodeRef.current, userData.studentId, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000"
      });
    }
  }, [userData]);

  if (!userData) return null;

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="relative w-full max-w-[350px] aspect-[1.6/1] bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl overflow-hidden p-6 text-white"
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

      <div className="relative h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold tracking-wide">سكن النبلاء</h3>
            <p className="text-[10px] opacity-80 uppercase tracking-widest">بطاقة التغذية الجامعية</p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
            <img src="/vite.svg" alt="Logo" className="w-8 h-8" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/30 border-2 border-white/50 overflow-hidden">
            {userData.photoUrl ? (
              <img src={userData.photoUrl} alt={userData.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                {userData.name?.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium opacity-90">الاسم: {userData.name}</p>
            <p className="text-xs opacity-70">الرقم: {userData.studentId}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-2 mt-4 flex justify-center">
          <svg ref={barcodeRef}></svg>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
          <Download className="w-4 h-4" />
        </button>
        <button className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default BarcodeCard;
