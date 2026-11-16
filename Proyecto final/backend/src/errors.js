export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve().then(() => handler(request, response, next)).catch(next);
  };
}
