import { useEffect } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  Link,
  useLoaderData,
} from "@remix-run/react";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import showToast, { Toaster } from "react-hot-toast";
import "./tailwind.css";

import { Button } from "./components/ui/button";
import { getToast } from "./utils/toast.server";
import { combineHeaders } from "./utils/misc";
import { getTheme } from "./utils/theme-session.server";
import { ClientHintCheck, getHints, useNonce } from "./utils/client-hints";

export async function loader({ request }: LoaderFunctionArgs) {
  const { toast, headers: toastHeaders } = await getToast(request);

  return json(
    {
      requestInfo: {
        hints: getHints(request),
        userPrefs: {
          theme: getTheme(request),
        },
      },
      toast,
    },
    { headers: combineHeaders(toastHeaders) }
  );
}

function Document({
  children,
  nonce,
  theme,
}: {
  children: React.ReactNode;
  nonce: string;
  theme?: string;
}) {
  return (
    <html lang="en" className={theme}>
      <head>
        <ClientHintCheck nonce={nonce} />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { toast } = useLoaderData<typeof loader>();
  const nonce = useNonce();

  useEffect(() => {
    if (!toast) {
      return;
    }
    if (toast.type === "success") {
      showToast.success(toast.description);
    } else if (toast.type === "error") {
      showToast.error(toast.description);
    } else {
      showToast(toast.description);
    }
  }, [toast]);

  return (
    <Document nonce={nonce} theme="light">
      <Outlet />
      <Toaster />
    </Document>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <html lang="en" className="light">
      <head>
        <title>Oops!</title>
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen flex flex-col items-center justify-center">
        {isRouteErrorResponse(error) && error.status === 404 ? (
          <img className="h-48" src="/not-found.svg" alt="not found" />
        ) : (
          <img className="h-48" src="/error.svg" alt="error" />
        )}
        <h1 className="mt-6 text-4xl font-bold">
          {isRouteErrorResponse(error)
            ? `${error.status} ${error.statusText}`
            : error instanceof Error
            ? error.message
            : "Unknown Error"}
        </h1>
        <Button asChild size="lg" className="mt-4">
          <Link to="/app">Back to app</Link>
        </Button>
        <Scripts />
      </body>
    </html>
  );
}
