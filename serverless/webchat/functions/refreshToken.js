exports.handler = function(context, event, callback) {
    console.log("refreshing token");

    // Import your controller
    const { refreshTokenController } = require('./controllers/refreshTokenController');

    console.log(event);

    // Create a mock request object
    const req = {
        body: {
            token: event.token || ""
        },
        // Add other Express request properties as needed
    };

    // Create a mock response object
    const res = {
        status: (statusCode) => ({
            send: (body) => callback(null, {
                statusCode,
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
            json: (body) => callback(null, {
                statusCode,
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
        }),
        // Add other Express response methods as needed
    };

    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'POST');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Call your controller with appropriate parameters
    // Note: You'll need to adapt parameters as Twilio functions have a different signature than Express handlers
    refreshTokenController(req, res).then((result) =>
    {   
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
};