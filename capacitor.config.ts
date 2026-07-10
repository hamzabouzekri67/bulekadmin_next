import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "bulekcapitaine.com",
  appName: "Bulek capitaine",
  webDir: "out",
  server: {
    androidScheme: "https",
    cleartext: true,
    hostname: "bulek.app", // حدد hostname ثابت بدلاً من localhost
  },
};

export default config;
