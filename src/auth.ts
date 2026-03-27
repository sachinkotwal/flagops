import NextAuth from 'next-auth';
import Okta from 'next-auth/providers/okta';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Okta({
      clientId: process.env.AUTH_OKTA_ID!,
      clientSecret: process.env.AUTH_OKTA_SECRET!,
      issuer: process.env.AUTH_OKTA_ISSUER!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
});
