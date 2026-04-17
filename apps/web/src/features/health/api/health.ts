import { HealthResponse } from "../model/health";
import { ENV } from "@/shared/config/env";

export async function getHealthStatus(): Promise<HealthResponse> {
    const response = await fetch(ENV.API_URL + "health");

    if (!response.ok) {
        throw new Error("Netzwerk Antwort war nicht ok.");
    }

    return response.json();
}

export async function getHealthResponseString(): Promise<string> {
    if ((await getHealthStatus()).status === "ok"){
        return "Die API läuft!";
    }else{
        return "Die API läuft nicht.";
    }
}