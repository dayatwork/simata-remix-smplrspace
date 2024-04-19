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
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import SpaceForm from "./SpaceForm";

interface Props {
  deviceLocationData: LocationData[];
  cornersData: CornerData[];
  rooms: SerializeFrom<Room[]>;
  space: Space;
}

export default function RightSidebar({
  cornersData,
  deviceLocationData,
  rooms,
  space,
}: Props) {
  console.log({ cornersData, deviceLocationData, rooms });

  return (
    <div className="w-72 border-l border-gray-200 p-4 flex flex-col gap-2 h-[calc(100vh-60px)] overflow-auto">
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
                  <RoomForm room={room} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
        <TabsContent value="devices">Devices</TabsContent>
      </Tabs>
      <Form
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
      </Form>
    </div>
  );
}