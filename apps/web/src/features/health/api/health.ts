import { request } from "@/shared/api/httpClient"

import { HealthResponse } from "../model/health";

export async function getHealthStatus(): Promise<HealthResponse> {
    return request<HealthResponse>("health");
}

export async function getHealthResponseString(): Promise<string> {
    try {
        if ((await getHealthStatus()).status === "ok") {
            return "Die API läuft!";
        } else {
            return "Die API läuft nicht.";
        }
    } catch {
        return "Die API läuft nicht.";
    }
}
