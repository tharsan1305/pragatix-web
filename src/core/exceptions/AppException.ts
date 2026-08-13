/**
 * Centralized Application Exception Handler for React Web
 * Mirrors Flutter's core/exceptions architecture.
 */

export class AppException extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AppException';
    this.statusCode = statusCode;
    this.details = details;
  }

  public static fromApiError(error: any): AppException {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || getMessageForStatus(status);
      return new AppException(message, status, error.response.data);
    } else if (error.request) {
      return new AppException('Network Error: Server is unreachable. Please check your connection.', 503);
    } else {
      return new AppException(error.message || 'An unexpected error occurred.', 500);
    }
  }
}

function getMessageForStatus(status: number): string {
  switch (status) {
    case 400: return 'Bad Request: Please check your input.';
    case 401: return 'Unauthorized: Session expired. Please log in again.';
    case 403: return 'Forbidden: You do not have permission to perform this action.';
    case 404: return 'Resource Not Found.';
    case 409: return 'Conflict: Resource already exists.';
    case 422: return 'Unprocessable Entity: Validation failed.';
    case 429: return 'Too Many Requests: Please try again later.';
    case 500: return 'Internal Server Error: Please try again later.';
    case 503: return 'Service Unavailable: Backend is currently down.';
    default: return `Request failed with status code ${status}`;
  }
}
