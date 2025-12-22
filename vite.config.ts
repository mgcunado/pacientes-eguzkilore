// import { defineConfig } from "vite";
// import { fresh } from "@fresh/plugin-vite";
// import tailwindcss from "@tailwindcss/vite";
//
// export default defineConfig({
// plugins: [
// // fresh(),
// fresh({
// serverEntry: "./main.ts",
// }),
// tailwindcss(),
// ],
// server: {
// // Con HMR activo, los cambios en componentes o islands se actualizan sin recargar la página completa, y Vite no recompila todo _fresh
// hmr: true,
// watch: {
// ignored: ["**/_fresh/**", "**/node_modules/**"]
// }
// },
// });

import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    fresh({
      serverEntry: "./main.ts",
    }),
    tailwindcss(),
  ],

  server: {
    hmr: false,
    // con hmr: true se para el navegador con cada cambio realizado y lanza el siguiente error: Internal Server Error! transport was disconnected, cannot call "fetchModule"
    // hmr: true,
    watch: {
      ignored: [
        // "**/_fresh/**", // ← SOLO ESTE
        "**/node_modules/**",
        // "**/.git/**",
      ],
    },
  },

  optimizeDeps: {
    exclude: [
      "fresh",
      "@fresh/core",
      "@fresh/plugin-vite",
    ],
  },
});

// import { defineConfig } from "vite";
// import { fresh } from "@fresh/plugin-vite";
// import tailwindcss from "@tailwindcss/vite";
//
// export default defineConfig({
// plugins: [
// fresh({
// serverEntry: "./main.ts",
// }),
// tailwindcss(),
// ],
// server: {
// hmr: true,
// watch: {
// ignored: [
// "**/_fresh/**", // imprescindible para evitar compilaciones lentas
// "**/node_modules/**",
// ],
// },
// },
// });
