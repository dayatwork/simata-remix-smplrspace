import { Room } from "@prisma/client";
import { SerializeFrom } from "@remix-run/node";
import { LocationData, CornerData } from "~/components/SpaceViewer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface Props {
  deviceLocationData: LocationData[];
  cornersData: CornerData[];
  rooms: SerializeFrom<Room[]>;
}

export default function RightSidebar({
  cornersData,
  deviceLocationData,
  rooms,
}: Props) {
  console.log({ cornersData, deviceLocationData, rooms });

  return (
    <div className="w-72 border-l border-gray-200 p-4 flex flex-col gap-2 h-[calc(100vh-60px)] overflow-auto">
      <Tabs defaultValue="rooms" className="w-full">
        <TabsList>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="device-locations">Locations</TabsTrigger>
          <TabsTrigger value="simulator">Simulator</TabsTrigger>
        </TabsList>
        <TabsContent value="rooms">
          <Accordion type="single" collapsible>
            {rooms?.map((room) => (
              <AccordionItem key={room.id} value={room.id.toString()}>
                <AccordionTrigger className="py-2">
                  <div className="flex gap-2 items-center">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: room.color }}
                    ></span>
                    <span>{room.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
        <TabsContent value="device-locations">Device locations</TabsContent>
        <TabsContent value="simulator">Simulator</TabsContent>
      </Tabs>
    </div>
  );
}
