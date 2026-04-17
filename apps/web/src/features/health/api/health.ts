import { request } from "@/shared/api/httpClient"

import { HealthResponse } from "../model/health";

export async function getHealthStatus(): Promise<HealthResponse> {
    return request<HealthResponse>("health");
}

export async function getHealthResponseString(): Promise<string> {
    if ((await getHealthStatus()).status === "ok"){
        return "Die API läuft!";
    }else{
        return "Die API läuft nicht.";
    }
}
