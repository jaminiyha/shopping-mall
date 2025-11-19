import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import ViteFaviconsPlugin from "vite-plugin-favicon2"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ViteFaviconsPlugin({
      logo: "./public/emoji.png",
      inject: true,
      favicons: {
        appName: "Shopping Mall",
        appDescription: "온라인 쇼핑몰",
        developerName: "Shopping Mall",
        developerURL: null,
        background: "#fff",
        theme_color: "#fff",
        icons: {
          coast: false,
          yandex: false,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})