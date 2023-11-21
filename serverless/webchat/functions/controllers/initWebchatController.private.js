const axios = require("axios");
const { createToken } = require(Runtime.getFunctions()[
    "helpers/createToken"
  ].path);
const { TOKEN_TTL_IN_SECONDS } = require(Runtime.getFunctions()[
    "constants"
  ].path);
const { getTwilioClient } = require(Runtime.getFunctions()[
    "helpers/getTwilioClient"
  ].path);
const { logFinalAction, logInitialAction, logInterimAction } = require(Runtime.getFunctions()[
    "helpers/logs"
  ].path);

const contactWebchatOrchestrator = async (request, customerFriendlyName) => {
    logInterimAction("Calling Webchat Orchestrator");

    const params = new URLSearchParams();
    params.append("AddressSid", process.env.ADDRESS_SID);
    params.append("ChatFriendlyName", "Webchat widget");
    params.append("CustomerFriendlyName", customerFriendlyName);
    params.append(
        "PreEngagementData",
        JSON.stringify({
            ...request.body?.formData,
            friendlyName: customerFriendlyName
        })
    );

    let conversationSid;
    let identity;

    try {
        const res = await axios.post(`https://flex-api.twilio.com/v2/WebChats`, params, {
            auth: {
                username: process.env.ACCOUNT_SID,
                password: process.env.AUTH_TOKEN
            }
        });
        ({ identity, conversation_sid: conversationSid } = res.data);
    } catch (e) {
        logInterimAction("Something went wrong during the orchestration:", e.response?.data?.message);
        throw e.response.data;
    }

    logInterimAction("Webchat Orchestrator successfully called");

    return {
        conversationSid,
        identity
    };
};

const sendUserMessage = (conversationSid, identity, messageBody) => {
    logInterimAction("Sending user message");
    return getTwilioClient()
        .conversations.conversations(conversationSid)
        .messages.create({
            body: messageBody,
            author: identity,
            xTwilioWebhookEnabled: true // trigger webhook
        })
        .then(() => {
            logInterimAction("(async) User message sent");
        })
        .catch((e) => {
            logInterimAction(`(async) Couldn't send user message: ${e?.message}`);
        });
};

const sendWelcomeMessage = (conversationSid, customerFriendlyName) => {
    logInterimAction("Sending welcome message");
    return getTwilioClient()
        .conversations.conversations(conversationSid)
        .messages.create({
            body: `Welcome ${customerFriendlyName}! An agent will be with you in just a moment.`,
            author: "Concierge"
        })
        .then(() => {
            logInterimAction("(async) Welcome message sent");
        })
        .catch((e) => {
            logInterimAction(`(async) Couldn't send welcome message: ${e?.message}`);
        });
};

const initWebchatController = async (request, response) => {
    logInitialAction("Initiating webchat");

    const customerFriendlyName = request.body?.formData?.friendlyName || "Customer";

    let conversationSid;
    let identity;

    // const sendResponse = (statusCode, body) => {
    //     const response = new Twilio.Response();
    //     response.setStatusCode(statusCode);
    //     response.setBody(body);
    //     response.appendHeader('Content-Type', 'application/json');
    //     callback(null, response);
    // };

    // Hit Webchat Orchestration endpoint to generate conversation and get customer participant sid
    try {
        const result = await contactWebchatOrchestrator(request, customerFriendlyName);
        ({ identity, conversationSid } = result);
        console.log(`conversationSid ${conversationSid}`);
    } catch (error) {

        return new Twilio.Response({
            statusCode: 500,
            body: JSON.stringify(`Couldn't initiate WebChat: ${error?.message}`),
            headers: { 'Content-Type': 'application/json' }
        });
        //return;
        //return response.status(500).send(`Couldn't initiate WebChat: ${error?.message}`);
    }

    // Generate token for customer
    const token = createToken(identity);

    // OPTIONAL — if user query is defined
    if (request.body?.formData?.query) {
        await sendUserMessage(conversationSid, identity, request.body.formData.query).then(() =>
            // and then send another message from Concierge, letting the user know that an agent will help them soon
            sendWelcomeMessage(conversationSid, customerFriendlyName)
        );
    }

    logFinalAction("Webchat successfully initiated");

    return new Twilio.Response({
        statusCode: 200,
        body: JSON.stringify({
            token,
            conversationSid,
            expiration: Date.now() + TOKEN_TTL_IN_SECONDS * 1000
        }),
        headers: { 'Content-Type': 'application/json' }
    });

};

module.exports = { initWebchatController };
