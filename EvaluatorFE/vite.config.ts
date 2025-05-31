import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "hu-ev-40c023a17-hu-as-40c158d50-1738260917-urtjok3rza-wl.a.run.app",
      "*",
    ],
  },
});
