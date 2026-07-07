const BASE = "http://localhost:8080/api";
async function api(path, { method = "GET", body } = {}) {
    const res = await fetch(BASE + path, {
        method,
        headers: {
            "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 204) {
        return null;
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new ApiError(
            data?.message || "Request failed",
            res.status,
            data?.fieldErrors
        );
    }
    return data;
}
class ApiError extends Error {
    constructor(message, status, fieldErrors) {
        super(message);
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}
export { api, ApiError };