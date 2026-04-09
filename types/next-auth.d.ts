import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: DefaultSession["user"] & {
      id?: string;
      email_verified?: boolean;
      auth_provider?: "LOCAL" | "GOOGLE";
      avatar_url?: string | null;
      bio?: string | null;
      location?: string | null;
      is_verified?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      email_verified?: boolean;
      auth_provider?: "LOCAL" | "GOOGLE";
      avatar_url?: string | null;
      bio?: string | null;
      location?: string | null;
      is_verified?: boolean;
    };
  }
}
