"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.myFunction = void 0;
// functions/src/index.ts
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
// ✅ Point to your actual service account file
const serviceAccountPath = path_1.default.resolve(__dirname, "../secrets/neurohealthhub-1965-firebase-adminsdk-fbsvc-b15474d7f4.json");
// ✅ Manually load credentials instead of relying on GOOGLE_APPLICATION_CREDENTIALS env
const serviceAccount = JSON.parse((0, fs_1.readFileSync)(serviceAccountPath, "utf-8"));
// ✅ Initialize Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
// ✅ Cloud Function deployed in me-central1
exports.myFunction = (0, https_1.onRequest)({ region: "me-central1" }, async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        const testRef = db.collection("deployment_test").doc("lastDeploy");
        await testRef.set({
            status: "Function working from me-central1",
            timestamp,
        });
        res.send(`✅ Hello from NeuroHealthHub! Function updated at ${timestamp}`);
    }
    catch (error) {
        console.error("Function error:", error);
        res.status(500).send("❌ Error writing to Firestore.");
    }
});
