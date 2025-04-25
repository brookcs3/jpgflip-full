import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // This application doesn't require backend routes as all conversion 
  // happens in the browser. The server just serves static files.
  
  const httpServer = createServer(app);
  return httpServer;
}
