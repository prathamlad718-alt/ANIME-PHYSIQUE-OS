import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.awakening.physiqueos',
  appName: 'Anime Physique OS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
