import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  // A base DEVE ter exatamente o nome do seu repositório no GitHub entre barras
  base: '/trip-planner/', 
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Atualiza o PWA automaticamente em segundo plano
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Trip Planner PWA',
        short_name: 'TripPlan',
        description: 'Planejamento e Orçamento de Viagens Offline-First',
        theme_color: '#3b82f6', // Nossa cor primary (Azul) para a barra do navegador
        background_color: '#f8fafc', // bg-slate-50 para combinar com o app
        display: 'standalone', // Faz o app abrir sem a barra de endereços (como app nativo)
        start_url: '/trip-planner/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }) as any
  ],
});