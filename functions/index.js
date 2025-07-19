/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {setGlobalOptions} = require("firebase-functions");
// const {onRequest} = require("firebase-functions/https");
// const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


/* eslint-disable camelcase */
const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");

setGlobalOptions({region: "us-central1", maxInstances: 1});

// Define your allowed origin(s) here!
// For local development, it will be your localhost address.
const allowedOrigin = "https://commutegeek.com";

exports.createCheckoutSession =
onRequest(
    {secrets: ["STRIPE_SECRET_KEY"]},
    async (req, res) => {
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

      // This line now correctly uses the defined allowedOrigin
      res.set("Access-Control-Allow-Origin", allowedOrigin);
      res.set("Vary", "Origin");

      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.set("Access-Control-Max-Age", "3600");
        return res.status(204).send("");
      }

      const {amount, success_url, cancel_url} = req.body;

      if (
        typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount < 100 ||
    amount > 10000000
      ) {
        return res.status(400).json({error: "Invalid amount"});
      }

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: [{
            price_data: {
              currency: "cad",
              product_data: {name: "CommuteGeek Donation"},
              unit_amount: amount,
            },
            quantity: 1,
          }],
          success_url,
          cancel_url,
        });

        return res.status(200).json({url: session.url});
      } catch (error) {
        console.error("Stripe error:", error);
        return res.status(500).json({error: error.message});
      }
    });
