exports.handler = async function (context, event, callback) {
    console.log("starting webchat");

    const { initWebchatController } = require(Runtime.getFunctions()[
        "controllers/initWebchatController"
    ].path);

    const { validateRequestOriginMiddleware } = require(Runtime.getFunctions()[
        "middlewares/validateRequestOriginMiddleware"
    ].path);

    const { logInterimAction } = require(Runtime.getFunctions()[
        "helpers/logs"
      ].path);

    console.log(event.request.headers.origin);

    // Create a mock request object
    const req = {
        origin: event.request.headers.origin,
        body: {
            formData: event.formData || {}
        },
        // Add other Express request properties as needed
    };

    const client = context.getTwilioClient();

    // Create a custom Twilio Response
    const response = new Twilio.Response();

    validateRequestOriginMiddleware(req, response, (err) => {
        if (err) {
            logInterimAction(response);
            return callback(null, response);
        } else {
            initWebchatController(req, response, callback)
            .then((result) => {
                response.setStatusCode(200);
                response.appendHeader('Content-Type', 'application/json');
                response.setBody(result);
                logInterimAction(response);
                return callback(null, response);

            })
            .catch((err) => {
                response.setStatusCode(500);
                response.appendHeader('Content-Type', 'plain/text');
                response.setBody(err.message);
                logInterimAction(response);
                return callback(null, response);

            });
        }
    });

};