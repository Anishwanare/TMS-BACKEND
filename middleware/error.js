class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const errorMiddleware = (err, req, res, next) => {
    let message = err.message || "Internal Server Error";
    let statusCode = err.statusCode || 500;

    if (err.name === "JsonWebTokenError") {
        message = "JSON Web Token is not valid, please try again.";
        statusCode = 400;
    } else if (err.name === "TokenExpiredError") {
        message = "JSON Web Token is expired, please try again.";
        statusCode = 400;
    } else if (err.name === "CastError") {
        message = `Invalid ${err.path}`;
        statusCode = 400;
    }

    if (err.errors && typeof err.errors === "object") {
        message = Object.values(err.errors)
            .map(error => error.message)
            .join(". ");
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};

export default ErrorHandler;
