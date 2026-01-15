import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
// Ensure this module and its server actions run on Node.js (not the Edge runtime)
export const runtime = "nodejs";

const secretKey = "secret";
const key = new TextEncoder().encode(secretKey);

// Encrypts the payload into a JWT token.
export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10 sec from now")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function login(formData: FormData) {
  //This function logins a user.
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  //Validation on the server.
  if (!email || !password) throw new Error("Are you a robot?");
  const { verifyUser } = await import("./lib/auth");
  const user = await verifyUser(email, password);
  if (!user) throw new Error("Please stop. Just, no...");
  //Verify login session
  const sessionUser = {
    email: user.email,
    name: user.username ?? user.email.split("@")[0],
  };
  const expires = new Date(Date.now() + 10 * 1000);
  const session = await encrypt({ user: sessionUser, expires });
  (await cookies()).set({
    name: "session",
    value: session,
    httpOnly: true,
    expires,
  });
}

export async function register(formData: FormData) {
  //This function registers a user.
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  //Validation on the server.
  if (!email || !password) throw new Error("Are you a robot?");
  //Registering attempts to login:
  try {
    const { registerUser } = await import("./lib/auth");
    const created = await registerUser({
      email,
      password,
      username: formData.get("username")?.toString().trim() ?? undefined,
    });
    //Create the session
    const user = {
      email: created.email,
      name: created.username ?? created.email.split("@")[0],
    };
    const expires = new Date(Date.now() + 10 * 1000);
    const session = await encrypt({ user, expires });
    (await cookies()).set({
      name: "session",
      value: session,
      httpOnly: true,
      expires,
    });
  } catch (err: any) {
    if (err?.code === 11000 /*mongo duplicate key*/)
      throw new Error(
        "You obviously had that email. Why don't you log-in instead?"
      );
    throw err;
  }
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  // Refresh the session so it doesn't expire
  const parsed = await decrypt(session);
  parsed.expires = new Date(Date.now() + 10 * 1000);
  const res = NextResponse.next();
  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires,
  });
  return res;
}
