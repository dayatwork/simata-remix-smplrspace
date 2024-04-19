import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { PenSquare } from "lucide-react";
import { buttonVariants } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import prisma from "~/lib/prisma.server";

export async function loader() {
  const devices = await prisma.device.findMany({
    include: { currentLocation: { include: { room: true, space: true } } },
  });

  return json({ devices });
}

export default function Devices() {
  const { devices } = useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <main className="flex-1 flex">
      <div className="flex-1 py-6 px-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Devices</h1>
          <Link to="new" className={buttonVariants()}>
            Register New Device
          </Link>
        </div>
        <div className="border rounded-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <span className="sr-only w-24">Image</span>
                </TableHead>
                <TableHead>Device Name</TableHead>
                <TableHead>Device Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last Detected Location</TableHead>
                <TableHead>
                  <span className="sr-only">Action</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow
                  key={device.id}
                  className={
                    location.pathname.startsWith(`/app/devices/${device.id}`)
                      ? "bg-foreground/5"
                      : ""
                  }
                >
                  <TableCell className="py-1 w-24">
                    {device.image ? (
                      <img
                        className="w-16 h-16 object-cover rounded-lg"
                        src={device.image}
                        alt={device.name}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-neutral-400 rounded-lg" />
                    )}
                  </TableCell>
                  <TableCell className="py-1 font-semibold">
                    {device.name}
                  </TableCell>
                  <TableCell className="py-1">{device.code}</TableCell>
                  <TableCell className="py-1">{device.description}</TableCell>
                  <TableCell className="py-1">
                    <div>
                      <p className="font-medium">
                        {device.currentLocation?.space.name}
                      </p>
                      <p className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: device.color }}
                        ></span>
                        {device.currentLocation?.room.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Link
                        to={device.id.toString()}
                        className="flex w-8 h-8 items-center justify-center border rounded hover:bg-accent"
                      >
                        <span className="sr-only">Edit</span>
                        <PenSquare className="w-4 h-4" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Outlet />
    </main>
  );
}
