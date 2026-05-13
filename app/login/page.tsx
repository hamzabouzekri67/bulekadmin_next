"use client"
import { useLoginController } from "./controller/useLoginController";
import { User, Lock, Loader2, AlertTriangle, Salad, ChevronRight, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { email, isValid, handleEmailChange, password, isPasswordValid, handlePasswordChange, handleLogin, error, isLoading } = useLoginController();
  const canLogin = isValid && isPasswordValid;
  const [mounted, setMounted] = useState(false);

  // أنميشن بسيط عند تحميل الصفحة لأول مرة
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] relative overflow-hidden font-sans dir-ltr">
      
      {/* خلفية فنية ديناميكية (خرافية) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] animate-pulse transition-opacity duration-1000" style={{ opacity: mounted ? 1 : 0 }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[100px] delay-500 transition-opacity duration-1000" style={{ opacity: mounted ? 1 : 0 }} />

      {/* حاوية Glassmorphism */}
      <div className={`w-full max-w-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white p-10 shadow-[0_30px_60px_rgba(0,0,0,0.03)] transition-all duration-700 ease-out 
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        
        {/* اسم التطبيق والشعار - تصميم عالمي */}
        <div className="flex flex-col items-center mb-10 text-center">
        
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">Platform Console</p>
          <h1 className="text-4xl md:text-5xl font-black text-red-500 tracking-tighter italic">
            BULEK <span className="text-red-500">ADMIN</span>
          </h1>
        </div>

        <form className="space-y-6">
          
          {/* حقل الإيميل بتصميم عصري */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold tracking-tight text-slate-500 mb-1.5 uppercase">
              <User size={14} className="text-red-500" />
              Corporate Email
            </label>
            <div className="relative group">
              <input
                type="email"
                placeholder="eg. hamza@bulek.dz"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl outline-none transition-all font-medium text-sm md:text-base 
                  ${email && !isValid ? 'border-red-400 focus:ring-2 focus:ring-red-100 focus:bg-white' : 'border-slate-100 focus:ring-2 focus:ring-slate-100 focus:bg-white focus:border-slate-200'}`}
              />
              {email && isValid && <CheckCircle2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
            </div>
          </div>
        
          {/* حقل كلمة المرور */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold tracking-tight text-slate-500 mb-1.5 uppercase">
              <Lock size={14} className="text-red-500" />
              Security Access Key
            </label>
            <input
              type="password"
               value={password}
              placeholder="••••••••••"
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-100 focus:bg-white focus:border-slate-200 outline-none transition-all font-medium resize-none text-sm md:text-base"
            />
          </div>

          {/* رسالة الخطأ بتصميم جديد */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-1">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* زر تسجيل الدخول الخرافي */}
         <button
          type="button"
          onClick={(e) => handleLogin(e)}
          disabled={!canLogin || isLoading}
          className={`group w-full py-4 rounded-2xl text-white font-black text-sm md:text-base mt-6 flex items-center justify-center gap-3 transition-all duration-300 shadow-xl
           ${isLoading ? "bg-slate-900 cursor-not-allowed shadow-none": canLogin  ? "bg-red-600 hover:bg-red-700 hover:shadow-red-600/30 active:scale-95" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Authorizing...
            </>
          ) : (
            <>
              Execute Access
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        </form>

        {/* تذيل الصفحة */}
        <p className="text-center text-[11px] text-slate-400 mt-10 font-bold uppercase tracking-tight">
          Bulek Eats Finance Div. 2026
        </p>

      </div>
    </div>
  );
}