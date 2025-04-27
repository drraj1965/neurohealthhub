"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyOnQuestion = exports.myFunction = exports.sendVerificationEmail = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const options_1 = require("firebase-functions/v2/options");
const params_1 = require("firebase-functions/params");
const mail_1 = __importDefault(require("@sendgrid/mail"));
const twilio_1 = __importDefault(require("twilio"));
const firebase_admin_1 = require("./firebase-admin"); // ✅ Use shared db instance
const send_verification_1 = require("./send-verification"); // ✅ Callable export
Object.defineProperty(exports, "sendVerificationEmail", { enumerable: true, get: function () { return send_verification_1.sendVerificationEmail; } });
// ✅ Set global region
(0, options_1.setGlobalOptions)({ region: "me-central1" });
// ✅ Define secrets
const SENDGRID_API_KEY = (0, params_1.defineSecret)("SENDGRID_API_KEY");
const SENDGRID_SENDER = (0, params_1.defineSecret)("SENDGRID_SENDER");
const TWILIO_SID = (0, params_1.defineSecret)("TWILIO_SID");
const TWILIO_TOKEN = (0, params_1.defineSecret)("TWILIO_TOKEN");
const TWILIO_WHATSAPP = (0, params_1.defineSecret)("TWILIO_WHATSAPP");
// ✅ HTTP test function
exports.myFunction = (0, https_1.onRequest)(async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        await firebase_admin_1.db.collection("deployment_test").doc("lastDeploy").set({
            status: "Function working",
            timestamp,
        });
        res.send(`✅ Function deployed successfully at ${timestamp}`);
    }
    catch (error) {
        console.error("myFunction error:", error);
        res.status(500).send("❌ Error writing to Firestore.");
    }
});
// ✅ Firestore trigger to notify admin doctor when question is submitted
exports.notifyOnQuestion = (0, firestore_1.onDocumentCreated)({
    document: "questions/{questionId}",
    secrets: [
        SENDGRID_API_KEY,
        SENDGRID_SENDER,
        TWILIO_SID,
        TWILIO_TOKEN,
        TWILIO_WHATSAPP,
    ],
}, async (event) => {
    const data = event.data?.data();
    if (!data?.uid || !data?.content) {
        console.warn("Missing uid or content in document");
        return;
    }
    const userUid = data.uid;
    const message = data.content;
    try {
        const userSnap = await firebase_admin_1.db.collection("users").doc(userUid).get();
        if (!userSnap.exists) {
            console.warn("User not found:", userUid);
            return;
        }
        const user = userSnap.data();
        if (!user.isAdmin) {
            console.warn("User is not an admin:", userUid);
            return;
        }
        // ✅ Send Email
        if (user.email) {
            mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
            await mail_1.default.send({
                to: user.email,
                from: process.env.SENDGRID_SENDER,
                subject: "💬 New Patient Question",
                text: `You have a new question:\n\n${message}`,
            });
            console.log("Email sent to", user.email);
        }
        // ✅ Send WhatsApp
        if (user.mobile) {
            const client = (0, twilio_1.default)(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
            await client.messages.create({
                body: `🫞 New patient question:\n\n${message}`,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP}`,
                to: `whatsapp:${user.mobile}`,
            });
            console.log("WhatsApp sent to", user.mobile);
        }
        console.log("✅ Notification sent to admin user:", userUid);
    }
    catch (error) {
        console.error("❌ Failed to send notifications:", error);
    }
});
