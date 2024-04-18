import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import invariant from "tiny-invariant";
import bcrypt from "bcryptjs";

import { sessionStorage } from "./session.server";
import prisma from "~/lib/prisma.server";

type SessionUser = {
  id: number;
};

export const authenticator = new Authenticator<SessionUser>(sessionStorage);

const formStrategy = new FormStrategy(async ({ form }) => {
  const email = form.get("email");
  const password = form.get("password");

  invariant(typeof email === "string", "email must be a string");
  invariant(email.length > 0, "email must not be empty");

  invariant(typeof password === "string", "password must be a string");
  invariant(password.length > 0, "password must be not be empty");

  const user = await loginWithEmailAndPassword(email.toLowerCase(), password);

  return user;
});

authenticator.use(formStrategy);

async function loginWithEmailAndPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  invariant(!!user, "User not found");

  invariant(
    !!user.password,
    "Invalid credentials. Your password is incorrect or your password has not been set"
  );

  const isValidPassword = await verifyPassword(password, user.password);

  invariant(
    isValidPassword,
    "Invalid credentials. Your password is incorrect or your password has not been set"
  );

  invariant(user.isActive, "Your account is inactive. Please contact admin!");

  return user;
}

export async function signupWithEmailAndPassword({
  email,
  name,
  password,
}: {
  email: string;
  password: string;
  name: string;
}) {
  const foundUser = await prisma.user.findUnique({
    where: { email },
  });

  invariant(!foundUser, "Email already exists");

  const hash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, name, password: hash },
  });

  return user;
}

export async function hashPassword(password: string) {
  const hash = await bcrypt.hash(password, 10);
  return hash;
}

export async function verifyPassword(password: string, hashedPassword: string) {
  const match = await bcrypt.compare(password, hashedPassword);
  return match;
}
