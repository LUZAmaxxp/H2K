export function storeAuthToken(token: string, rememberMe: boolean) {
  if (rememberMe) {
    localStorage.setItem("authToken", token);
  } else {
    sessionStorage.setItem("authToken", token);
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
}

export function removeAuthToken() {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
}
