const multer = require("multer");

const { HttpError } = require("../utils/httpError");

function notFoundHandler(req, res) {
  if (req.accepts("html")) {
    return res.status(404).sendFile(require("path").join(__dirname, "../public/pages/index.html"));
  }

  return res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found."
    }
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "Uploaded file is too large."
      : "Upload failed. Please check your file and try again.";

    return res.status(400).json({
      error: {
        code: err.code,
        message
      }
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  req.log?.error({ err }, "Unhandled request error");
  console.error(err);

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong. Please try again."
    }
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
