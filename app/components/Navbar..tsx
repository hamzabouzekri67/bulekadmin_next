"use client";

import { useEffect, useState } from "react";
import { Device } from "@capacitor/device"; // استيراد Device

export default function Navbar() {
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    const checkPlatform = async () => {
      const info = await Device.getInfo();
      // 'web' هي القيمة التي تعيدها المكتبة في المتصفح
      setIsWeb(info.platform === "web");
    };
    checkPlatform();
  }, []);

  return (
    // أضفنا hidden md:block لإخفاء العنصر بالكامل في الهاتف وإظهاره في الويب
    <nav className="hidden md:block sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-gray-200/60 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* اللوجو */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
              Bulek Admin
            </span>
          </div>

          {/* زر التحميل */}
          {isWeb && (
            <div className="animate-in fade-in zoom-in duration-500">
              <a
                href="/downloads/app-release.apk"
                download="BulekAdmin.apk"
                className="flex items-center gap-2.5 bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>تحميل تطبيق الأندرويد</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
