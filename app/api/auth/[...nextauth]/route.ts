import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { googleAuthApi, loginWithPasswordApi, verifyOtpApi } from "@/lib/authApi";

function requireAuthEnv(key: "NEXTAUTH_SECRET" | "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET"): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

const authConfig: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: requireAuthEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireAuthEnv("GOOGLE_CLIENT_SECRET"),
    }),
    CredentialsProvider({
      id: "password-login",
      name: "Password Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;

        const response = await loginWithPasswordApi(String(email), String(password));
        return {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          image: response.data.user.avatar_url ?? undefined,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          backendUser: response.data.user,
        };
      },
    }),
    CredentialsProvider({
      id: "otp-login",
      name: "OTP Login",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const otp = credentials?.otp;
        if (!email || !otp) return null;

        const response = await verifyOtpApi(String(email), String(otp));
        return {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          image: response.data.user.avatar_url ?? undefined,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          backendUser: response.data.user,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const providerId = account.providerAccountId;
      const email = user.email;
      const name = user.name;
      if (!providerId || !email || !name) return false;

      const backendResult = await googleAuthApi({
        google_id: providerId,
        email,
        name,
        avatar_url:
          typeof (profile as { picture?: unknown } | null)?.picture === "string"
            ? ((profile as { picture?: string }).picture ?? null)
            : null,
      });

      console.log("[NextAuth][signIn] google backend token received", {
        provider: account.provider,
        hasAccessToken: Boolean(backendResult.data.accessToken),
        hasRefreshToken: Boolean(backendResult.data.refreshToken),
        userId: backendResult.data.user.id,
      });

      (user as { accessToken?: string }).accessToken = backendResult.data.accessToken;
      (user as { refreshToken?: string }).refreshToken = backendResult.data.refreshToken;
      (user as { backendUser?: unknown }).backendUser = backendResult.data.user;
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const typed = user as {
          accessToken?: string;
          refreshToken?: string;
          backendUser?: unknown;
        };
        token.accessToken = typed.accessToken;
        token.refreshToken = typed.refreshToken;
        token.user = typed.backendUser ?? user;
      }

      console.log("[NextAuth][jwt] token state", {
        provider: account?.provider ?? "unknown",
        hasUser: Boolean(user),
        hasAccessToken: Boolean(token.accessToken),
        hasRefreshToken: Boolean(token.refreshToken),
        userId: token.user && typeof token.user === "object" ? (token.user as { id?: string }).id : undefined,
      });

      return token;
    },
    async session({ session, token }) {
      session.accessToken = typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.refreshToken = typeof token.refreshToken === "string" ? token.refreshToken : undefined;
      session.user = {
        ...session.user,
        ...(typeof token.user === "object" && token.user ? token.user : {}),
      } as typeof session.user;

      console.log("[NextAuth][session] session state", {
        hasSession: Boolean(session),
        hasUser: Boolean(session.user?.id),
        hasAccessToken: Boolean(session.accessToken),
        hasRefreshToken: Boolean(session.refreshToken),
      });

      return session;
    },
  },
  secret: requireAuthEnv("NEXTAUTH_SECRET"),
};

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
