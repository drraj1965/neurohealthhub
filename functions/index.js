import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

export const myFunction = onRequest(
  {
    region: "me-central1"
  },
  (req, res) => {
    logger.info("Hello logs!", { structuredData: true });
    res.send("Hello from NeuroHealthHub!");
  }
);