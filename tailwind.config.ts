import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: {
          400: "#fbbf24",
          500: "#f59e0b",
          DEFAULT: "#f59e0b",
        },
        background: "#0f172a",
        card: "#1e293b",
      },
    },
  },
};

export default config;
