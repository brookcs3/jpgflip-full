import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { FFmpeg } from "@ffmpeg/ffmpeg";

// Prefetch FFmpeg resources - initializing it in DropConvert component
const ffmpeg = new FFmpeg();

createRoot(document.getElementById("root")!).render(<App />);
