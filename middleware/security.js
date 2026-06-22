const compression = require("compression");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");

const env = require("../config/env");

function applySecurityMiddleware(app) {
  app.set("trust proxy", 1);

  if (env.ENABLE_REQUEST_LOGS) {
    app.use(pinoHttp({
      redact: ["req.headers.authorization", "req.headers.cookie"],
      customProps: req => ({ requestId: req.id })
    }));
  }

  app.use(compression());

  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
          "https://pagead2.googlesyndication.com",
          "https://cdnjs.cloudflare.com"
        ],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "blob:", "https://quickconvert.online", "https://www.google-analytics.com"],
        "connect-src": ["'self'", "https://www.google-analytics.com"],
        "frame-src": ["'self'", "https://googleads.g.doubleclick.net"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));
}

module.exports = applySecurityMiddleware;
