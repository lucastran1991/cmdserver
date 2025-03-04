import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const headers = new Headers();
        headers.append("Content-Type", "application/x-www-form-urlencoded");
        const reqbody = new URLSearchParams();
        reqbody.append("username", credentials?.username ?? '');
        reqbody.append("password", credentials?.password ?? '');

        console.log(reqbody);

        const res = await fetch('http://localhost:8000/auth/jwt/login', {
          method: 'POST',
          headers: headers,
          body: reqbody,
        });
        
        const user = await res.json();
        console.log(user);

        if (res.ok && user) {
          return user;
        } else {
          return null;
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);