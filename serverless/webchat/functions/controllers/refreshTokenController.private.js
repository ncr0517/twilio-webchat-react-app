const jwt = require("jsonwebtoken");
const { TOKEN_TTL_IN_SECONDS } = require(Runtime.getFunctions()[
    "constants"
  ].path);
const { createToken } = require(Runtime.getFunctions()[
    "helpers/createToken"
  ].path);
  const { logFinalAction, logInitialAction, logInterimAction } = require(Runtime.getFunctions()[
    "helpers/logs"
  ].path);

const refreshTokenController = async (request, response) => {
    logInitialAction("Refreshing token");
    let providedIdentity;

    try {
        const validatedToken = await new Promise((res, rej) =>
            jwt.verify(request.body.token, process.env.API_SECRET, {}, (err, decoded) => {
                if (err) return rej(err);
                return res(decoded);
            })
        );
        providedIdentity = validatedToken?.grants?.identity;
    } catch (e) {
        logInterimAction("Invalid token provided:", e.message);
        //return response.sendStatus(403);
        return new Twilio.Response({
            statusCode: 403,
            body: JSON.stringify(`Couldn't refresh token: ${error?.message}`),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    logInterimAction("Token is valid for", providedIdentity);

    const refreshedToken = createToken(providedIdentity);

    logFinalAction("Token refreshed");

    return new Twilio.Response({
        statusCode: 200,
        body: JSON.stringify({
            token: refreshedToken,
            expiration: Date.now() + TOKEN_TTL_IN_SECONDS * 1000
        }),
        headers: { 'Content-Type': 'application/json' }
    });

};

module.exports = { refreshTokenController };
