import { Link } from "@remix-run/react";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default function Index() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <h1 className="text-4xl font-extrabold mb-6">DEMO SIMATA</h1>
      <Link
        to="login"
        className={cn(buttonVariants({ size: "lg" }), "text-lg")}
      >
        Log in
      </Link>
    </div>
  );
}
