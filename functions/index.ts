import { onRequest } from "firebase-functions/v2/https";
import { createApp } from "../server/_core/app";

let appInstance: any;

export const api = onRequest({ region: "us-central1" }, async (req, res) => {
    if (!appInstance) {
        const { app } = await createApp();
        appInstance = app;
    }
    appInstance(req, res);
});
