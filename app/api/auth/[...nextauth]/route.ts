
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/db';
import type { Session, User } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, { databaseName: process.env.DATABASE_NAME }),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    session: ({ session, user }: { session: Session; user: User | AdapterUser }) => ({
      ...session,
      user: {
        ...session.user,
        id: (user as User).id,
      },
    }),
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };