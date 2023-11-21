exports.handler = async function(context, event, callback) {
    console.log("starting webchat");
    console.log(event);

    // Import your controller
    const { initWebchatController } = require(Runtime.getFunctions()[
        "controllers/initWebchatController"
      ].path);

    // Create a mock request object
    const req = {
        body: {
            formData: event.formData || {}
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

    const client = context.getTwilioClient();

    // Create a custom Twilio Response
    const response = new Twilio.Response();
    // Set the CORS headers to allow Flex to make an error-free HTTP request
    // to this Function
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
    response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Call your controller with appropriate parameters
    // Note: You'll need to adapt parameters as Twilio functions have a different signature than Express handlers
    initWebchatController(req, res, callback)
    .then((result) =>
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
    // response = await initWebchatController(req, res);
    // console.log("received response");
    // console.log(response);
    // return callback(null, response);
};