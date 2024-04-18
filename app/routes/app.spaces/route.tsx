import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { buttonVariants } from "~/components/ui/button";
import prisma from "~/lib/prisma.server";

export async function loader() {
  const spaces = await prisma.space.findMany();
  return json({ spaces });
}

export default function Spaces() {
  const { spaces } = useLoaderData<typeof loader>();
  return (
    <main className="max-w-7xl w-full mx-auto py-6 px-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Spaces</h1>
        <Link to="new" className={buttonVariants()}>
          Create New Space
        </Link>
      </div>
      <ul className="grid grid-cols-4 gap-4">
        {spaces.map((space) => (
          <li key={space.id}>
            <Link
              to={space.id.toString()}
              className="rounded-xl overflow-hidden border flex flex-col hover:-translate-y-1 transition hover:shadow-xl"
            >
              {space.imagePreview ? (
                <img
                  src={space.imagePreview}
                  alt={space.name}
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="bg-neutral-300 h-52 w-full"></div>
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-1">{space.name}</h2>
                <p className="text-muted-foreground">{space.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
