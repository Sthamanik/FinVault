class ApiError extends Error {
  statusCode: number;
  data?: any;
  success: boolean;
  errors?: any[];

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: any[] = [],
    stack: string = ""
  ) {
    super(message); // Call the parent constructor with the message

    // Set the properties
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;

    // Capture the stack trace if not provided
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };