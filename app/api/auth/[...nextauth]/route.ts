import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * LINE OAuth Provider for NextAuth.js
 * LINE Login v2.1 API を使用
 */
function LineProvider(options: { clientId: string; clientSecret: string }) {
  return {
    id: "line",
    name: "LINE",
    type: "oauth" as const,
    authorization: {
      url: "https://access.line.me/oauth2/v2.1/authorize",
      params: { scope: "profile openid email", bot_prompt: "normal" },
    },
    token: "https://api.line.me/oauth2/v2.1/token",
    userinfo: "https://api.line.me/v2/profile",
    profile(profile: any) {
      return {
        id: profile.userId,
        name: profile.displayName,
        email: profile.email ?? null,
        image: profile.pictureUrl,
      };
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
  };
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).provider = token.provider;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
