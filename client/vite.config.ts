import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router-dom")) {
            return "react-vendor";
          }
          if (id.includes("node_modules/firebase/app") || id.includes("node_modules/firebase/database")) {
            return "firebase-vendor";
          }
          if (id.includes("node_modules/socket.io-client")) {
            return "socket-vendor";
          }
          if (id.includes("node_modules/emoji-picker-react")) {
            return "emoji-vendor";
          }
        },
      },
    },
  },
});
