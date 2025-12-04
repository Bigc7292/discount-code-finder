import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../server/_core/env";

async function main() {
    if (!ENV.forgeApiKey) {
        console.error("API Key missing");
        return;
    }

    console.log("Using API Key:", ENV.forgeApiKey.substring(0, 10) + "...");

    const genAI = new GoogleGenerativeAI(ENV.forgeApiKey);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // There isn't a direct listModels method on the client instance in some versions, 
        // but we can try to just run a simple prompt on a few common models to see which works.

        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ];

        for (const m of modelsToTry) {
            console.log(`Testing model: ${m}...`);
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("Hello");
                console.log(`SUCCESS: ${m}`);
                console.log("Response:", result.response.text());
                return; // Found a working model
            } catch (e: any) {
                console.log(`FAILED: ${m} - ${e.message}`);
            }
        }

        console.log("No working model found.");

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
