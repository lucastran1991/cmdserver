import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, {
    providers: [],
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.status(200).json({ message: "Protected content", user: session.user });
}