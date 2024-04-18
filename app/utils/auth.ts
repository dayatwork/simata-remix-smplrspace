import { useMatches } from "@remix-run/react";

import { LoggedInUserPayload } from "./guard.server";

export function useLoggedInUser() {
  const matches = useMatches();
  const data = matches.find((match) => match.id === "routes/app")?.data as
    | { loggedInUser: LoggedInUserPayload }
    | undefined;
  return data?.loggedInUser;
}
