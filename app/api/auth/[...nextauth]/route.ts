import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { googleAuthApi, loginWithPasswordApi, verifyOtpApi } from "@/lib/authApi";

const authConfig: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
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
        id: providerId,
        email,
        name,
        avatar:
          typeof (profile as { picture?: unknown } | null)?.picture === "string"
            ? ((profile as { picture?: string }).picture ?? null)
            : null,
      });

      (user as { accessToken?: string }).accessToken = backendResult.data.accessToken;
      (user as { refreshToken?: string }).refreshToken = backendResult.data.refreshToken;
      (user as { backendUser?: unknown }).backendUser = backendResult.data.user;
      return true;
    },
    async jwt({ token, user }) {
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
      return token;
    },
    async session({ session, token }) {
      session.accessToken = typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.refreshToken = typeof token.refreshToken === "string" ? token.refreshToken : undefined;
      session.user = token.user as typeof session.user;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
