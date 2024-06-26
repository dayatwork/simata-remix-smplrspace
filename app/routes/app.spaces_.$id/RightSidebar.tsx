import { Room, Space } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { LocationData, CornerData } from "~/components/SpaceViewer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import RoomForm from "./RoomForm";
// import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import SpaceForm from "./SpaceForm";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useFetchers } from "@remix-run/react";

interface Props {
  deviceLocationData: LocationData[];
  cornersData: CornerData[];
  rooms: SerializeFrom<Room[]>;
  space: Space;
  // devicesCurrentLocation: SerializeFrom<
  //   (DeviceCurrentLocation & { device: Device; room: Room })[]
  // >;
}

export default function RightSidebar({
  // cornersData,
  deviceLocationData,
  rooms,
  space,
}: // devicesCurrentLocation,
Props) {
  const [enableAddRoom, setEnableAddRoom] = useState(false);
  const fetchers = useFetchers();
  const createRoomFetcherData = fetchers.find(
    (fetcher) => fetcher.key === "create-room"
  )?.data;

  useEffect(() => {
    if (createRoomFetcherData?.success) {
      setEnableAddRoom(false);
    }
  }, [createRoomFetcherData?.success]);

  return (
    <div className="w-80 border-l border-gray-200 p-4 flex flex-col gap-2 h-[calc(100vh-60px)] overflow-auto">
      <Tabs defaultValue="rooms" className="w-full flex-1">
        <TabsList>
          <TabsTrigger value="space">Space</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>
        <TabsContent value="space">
          <SpaceForm space={space} />
        </TabsContent>
        <TabsContent value="rooms">
          <Accordion type="single" collapsible>
            {rooms?.map((room) => (
              <AccordionItem key={room.id} value={room.id.toString()}>
                <AccordionTrigger className="py-2">
                  <div className="flex gap-2 items-center text-sm">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: room.color }}
                    ></span>
                    <span>{room.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <RoomForm room={room} intent="edit-room" />
                </AccordionContent>
              </AccordionItem>
            ))}
            {enableAddRoom ? (
              <div className="mt-4">
                <div className="flex gap-2 items-center text-sm font-semibold">
                  <span className="w-4 h-4 rounded-full bg-neutral-500 animate-pulse"></span>
                  <span>Create New Room</span>
                </div>
                <RoomForm
                  intent="create-room"
                  onCancel={() => setEnableAddRoom(false)}
                />
              </div>
            ) : (
              <Button
                variant="outline"
                className="mt-4 w-full h-8 text-xs"
                size="sm"
                onClick={() => setEnableAddRoom(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Room
              </Button>
            )}
          </Accordion>
        </TabsContent>
        <TabsContent value="devices">
          <div className="p-1">
            <h3 className="text-sm font-semibold mb-2">Detected Devices</h3>
            {deviceLocationData.length === 0 && (
              <div className="h-40 w-full border border-dashed rounded-xl flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No devices detected in this space
                </p>
              </div>
            )}
            <ul className="space-y-2">
              {deviceLocationData.map((data) => (
                <li
                  key={data.id}
                  className="border rounded-lg p-1 flex gap-3 items-center"
                >
                  {data.image ? (
                    <img
                      src={data.image}
                      alt={data.name}
                      className="w-14 h-14 rounded object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-neutral-300" />
                  )}
                  <div>
                    <p className="text-sm font-semibold">{data.name}</p>
                    <p className="font-semibold text-xs flex items-center gap-1 -ml-px mb-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: data.color,
                        }}
                      ></span>
                      {data.code}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(data.timestamp).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      })}
                    </p>
                    <p className="font-semibold text-xs flex items-center gap-1 -ml-px mb-1">
                      <span
                        className="w-3 h-3"
                        style={{
                          backgroundColor: data.roomColor,
                        }}
                      ></span>
                      {data.roomName}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
      {/* <Form
        method="post"
        onSubmit={(event) => {
          const response = confirm("Please confirm you want to reset the room");
          if (!response) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="_intent" value="reset" />
        <Button variant="destructive" type="submit" className="h-8">
          Reset Room
        </Button>
      </Form> */}
    </div>
  );
}
