import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bulek.capitaine", // يفضل دائماً استخدام صيغة com.company.app
  appName: "Bulek capitaine",
  webDir: "out",
  server: {
  androidScheme: "https",
  allowNavigation: ["admin.bulekeats.com"], // السماح صراحة بالانتقال لهذا النطاق
},
};

export default config;