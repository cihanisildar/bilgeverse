
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);

    if (!res.ok) {
        let errorData;
        try {
            errorData = await res.json();
        } catch {
            errorData = { error: res.statusText };
        }
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    // Handle empty responses
    if (res.status === 204) {
        return {} as T;
    }

    return res.json();
}

export const api = {
    get: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'GET' }),
    post: <T>(url: string, data?: any, options?: RequestInit) =>
        apiFetch<T>(url, {
            ...options,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...options?.headers },
            body: data ? JSON.stringify(data) : undefined
        }),
    put: <T>(url: string, data?: any, options?: RequestInit) =>
        apiFetch<T>(url, {
            ...options,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...options?.headers },
            body: data ? JSON.stringify(data) : undefined
        }),
    patch: <T>(url: string, data?: any, options?: RequestInit) =>
        apiFetch<T>(url, {
            ...options,
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...options?.headers },
            body: data ? JSON.stringify(data) : undefined
        }),
    delete: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'DELETE' }),
};
