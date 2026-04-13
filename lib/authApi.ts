export type AuthApiUser = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  is_verified: boolean;
  email_verified: boolean;
  auth_provider: "LOCAL" | "GOOGLE";
  created_at: string;
  updated_at: string;
};

export type AuthApiResponse = {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthApiUser;
  };
  message?: string;
};

export type UserProfileResponse = {
  success: boolean;
  data: {
    user: AuthApiUser;
  };
  message?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    const message = typeof body === "object" && body && "message" in body ? String(body.message ?? "Request failed") : "Request failed";
    throw new Error(message);
  }
  return body;
}

export async function loginWithPasswordApi(email: string, password: string): Promise<AuthApiResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse<AuthApiResponse>(response);
}

export async function registerApi(name: string, email: string, password: string): Promise<AuthApiResponse> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return parseResponse<AuthApiResponse>(response);
}

export async function sendOtpApi(email: string): Promise<{ success: boolean; data: { message: string } }> {
  const response = await fetch(`${API_BASE}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseResponse<{ success: boolean; data: { message: string } }>(response);
}

export async function verifyOtpApi(email: string, otp: string): Promise<AuthApiResponse> {
  const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  return parseResponse<AuthApiResponse>(response);
}

export async function googleAuthApi(payload: {
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
}): Promise<AuthApiResponse> {
  const response = await fetch(`${API_BASE}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<AuthApiResponse>(response);
}

export async function uploadAvatarApi(file: File, accessToken: string): Promise<UserProfileResponse> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_BASE}/api/users/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  return parseResponse<UserProfileResponse>(response);
}
