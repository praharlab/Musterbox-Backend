/**
 * Custom Error class with status code.
 * @class
 * @extends Error
 */
class CustomError extends Error {
  /**
   * Create a new instance of CustomError.
   * @constructor
   * @param {string} message - The error message.
   * @param {number} statusCode - The HTTP status code.
   */
  constructor(message, statusCode) {
    super(message);
    /**
     * The HTTP status code of the error.
     * @type {number}
     */
    this.statusCode = statusCode;
  }
}

module.exports = { CustomError };
