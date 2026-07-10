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
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
              B
            </div>
            <span className="text-lg font-bold text-gray-800">Bulek Admin</span>
          </div>

          {/* يظهر فقط في الويب */}
          {isWeb && (
            <div className="animate-pulse">
              <a
                href="/downloads/app-release.apk"
                download="BulekAdmin.apk"
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md hover:scale-105"
              >
                <span>تحميل تطبيق الأندرويد</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
