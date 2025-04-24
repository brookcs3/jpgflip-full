import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { applyThemeColors } from "./lib/theme";
import { siteConfig } from "./config";

// Apply theme colors based on site configuration
applyThemeColors();

// Log site configuration for debugging
console.log(`Running in ${siteConfig.siteName} mode with configuration:`, siteConfig);

// Prefetch FFmpeg resources - initializing it in DropConvert component
const ffmpeg = new FFmpeg();

createRoot(document.getElementById("root")!).render(<App />);
