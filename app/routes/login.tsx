import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { z } from "zod";
import { parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { AuthorizationError } from "remix-auth";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authenticator } from "~/utils/auth.server";
import { commitSession, getSession } from "~/utils/session.server";
import { redirectWithToast } from "~/utils/toast.server";

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Email is invalid"),
  password: z.string({ required_error: "Password is required" }),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.clone().formData();
  const submission = parseWithZod(formData, { schema: loginSchema });

  if (submission.status !== "success") {
    return json({ error: "", submission: submission.reply() });
  }

  try {
    const user = await authenticator.authenticate("form", request, {
      throwOnError: true,
    });

    const session = await getSession(request.headers.get("cookie"));
    session.set(authenticator.sessionKey, { id: user.id });
    const headers = new Headers({ "set-cookie": await commitSession(session) });

    return redirectWithToast(
      "/app",
      { description: "Login success", type: "success" },
      { headers }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return json({
        error: error.message,
        submission: "",
      });
    }
    return json({
      error: error.message || "Something went wrong!",
      submission: "",
    });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: "/app",
  });
  return null;
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema });
    },
  });

  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Link
              to="/"
              className="flex items-center gap-2 justify-center flex-col mb-8"
            >
              <span className="text-lg font-bold">SIMATA</span>
            </Link>
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          {actionData?.error ? (
            <p className="mt-2 text-sm font-semibold px-2 py-1 rounded text-red-600 border border-red-600">
              {actionData.error.toString()}
            </p>
          ) : null}
          <Form
            method="post"
            id={form.id}
            onSubmit={form.onSubmit}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name={fields.email.name}
                type="email"
                placeholder="m@example.com"
                required
              />
              {fields.email.errors ? (
                <p
                  role="alert"
                  className="mt-1 text-sm text-red-600 font-semibold"
                >
                  {fields.email.errors}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                {/* <Link
                  to="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link> */}
              </div>
              <Input
                name={fields.password.name}
                id="password"
                type="password"
                required
              />
              {fields.password.errors ? (
                <p
                  role="alert"
                  className="mt-1 text-sm text-red-600 font-semibold"
                >
                  {fields.password.errors}
                </p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Login..." : "Login"}
            </Button>
            {/* <Button variant="outline" type="button" className="w-full">
              Sign in with Google
            </Button> */}
          </Form>
          <div className="mt-4 text-center text-sm">
            {"Don't have an account? "}
            <Link to="/sign-up" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <img
          src="https://ui.shadcn.com/placeholder.svg"
          alt="Place holder"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
