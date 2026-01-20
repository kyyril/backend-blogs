import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import routes from "./routes";
import { typeDefs, resolvers } from "./graphql";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Initialize Prisma client
export const prisma = new PrismaClient();

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://syncblog.pages.dev",
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ],
  credentials: true, // Allow cookies to be sent
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "X-Access-Token",
  ],
  optionsSuccessStatus: 200, // For legacy browser support
};

// ==========================================
// ASYNC SERVER INITIALIZATION
// ==========================================
async function startServer() {
  // Initialize Apollo Server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Enable GraphQL Playground in production
  });

  // Start Apollo Server
  await apolloServer.start();
  console.log("✅ Apollo Server started");

  // Middlewares
  app.use(cors(corsOptions));
  app.use(cookieParser()); // Parse cookies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // GraphQL endpoint
  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({
        // You can add authentication context here if needed
        user: (req as any).user,
      }),
    })
  );

  // REST API Routes
  app.use("/api", routes);

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Server is running",
      graphql: "/graphql",
      restApi: "/api",
    });
  });

  // Global error handler
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err.stack);
      res.status(err.status || 500).json({
        message: err.message || "Something went wrong!",
        error: process.env.NODE_ENV === "development" ? err : {},
      });
    }
  );

  // Start server
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${port}/graphql`);
    console.log(`🔗 REST API: http://localhost:${port}/api`);
  });
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Disconnected from database");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  console.log("Disconnected from database");
  process.exit(0);
});
