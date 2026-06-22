class HttpError extends Error {
  constructor(status, message, code = "REQUEST_FAILED") {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

function badRequest(message, code = "BAD_REQUEST") {
  return new HttpError(400, message, code);
}

module.exports = {
  HttpError,
  badRequest
};
