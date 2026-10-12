/**
 * Error with an HTTP status code. Thrown from controllers/middleware and
 * turned into a consistent JSON response by the central error handler.
 */
class AppError extends Error {
  constructor(message, statusCode, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }
}

module.exports = AppError;
