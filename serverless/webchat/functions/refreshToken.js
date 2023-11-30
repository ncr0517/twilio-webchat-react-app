exports.handler = function(context, event, callback) {
    console.log("refreshing token");

    // Import your controller
    const { refreshTokenController } = require('./controllers/refreshTokenController');

    const { validateRequestOriginMiddleware } = require(Runtime.getFunctions()[
        "middlewares/validateRequestOriginMiddleware"
    ].path);

    const { logInterimAction } = require(Runtime.getFunctions()[
        "helpers/logs"
      ].path);

    console.log(event);

    // Create a mock request object
    const req = {
        body: {
            token: event.token || ""
        },
        // Add other Express request properties as needed
    };

    const response = new Twilio.Response();

    validateRequestOriginMiddleware(req, response, (err) => {
        if (err) {
            logInterimAction(response);
            return callback(null, response);
        } else {
            refreshTokenController(req, response).then((result) =>
            {   
                response.setStatusCode(200);
                response.appendHeader('Content-Type', 'application/json');
                response.setBody(result);
                console.log(response);
                return callback(null, response);

            })
            .catch((err) => {
                response.appendHeader('Content-Type', 'plain/text');
                response.setBody(err.message);
                response.setStatusCode(500);
                // If there's an error, send an error response.
                // Keep using the response object for CORS purposes.
                return callback(null, response);

            });

        }
    });
    
};