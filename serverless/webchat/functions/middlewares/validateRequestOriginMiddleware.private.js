const { allowedOrigins } = require(Runtime.getFunctions()[
    "helpers/getAllowedOrigins"
  ].path);
  
const validateRequestOriginMiddleware = (request, response, next) => {
    if (!process.env.ALLOWED_ORIGINS) {
        console.error("Please specify at least one ALLOWED_ORIGINS in your environment");
        response.setStatusCode(500); // Or another appropriate status code
        response.setBody({ error: "Please specify at least one ALLOWED_ORIGINS in your environment" });
        next('error');
        return;
    }

    const requestOrigin = request.origin;

    // If request origin is not included in the ALLOWED_ORIGINS list, throw an error
    if (!allowedOrigins.includes(requestOrigin)) {
        console.error(`Request origin '${requestOrigin}' not allowed`);
        response.setStatusCode(403); // Or another appropriate status code
        response.setBody({ error: `Request origin '${requestOrigin}' not allowed` });
        next('error');
        return;
    } else {
        response.appendHeader('Access-Control-Allow-Origin', requestOrigin);
    }
    response.appendHeader("Access-Control-Allow-Methods", "OPTIONS, POST");
    response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

    next();
};

module.exports = { validateRequestOriginMiddleware };
