import { loadSmplrJs } from "@smplrspace/smplr-loader";
import { Space } from "node_modules/@smplrspace/smplr-loader/dist/generated/smplr";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

export type LocationData = {
  id: string;
  name: string;
  code: string;
  color: string;
  image: string;
  roomName: string;
  roomColor: string;
  roomCode: string;
  timestamp: string;
  position: {
    levelIndex: number;
    elevation: number;
    x: number;
    z: number;
  };
};

export type CornerData = {
  id: string;
  name: string;
  color: string;
  coordinates: {
    levelIndex: number;
    x: number;
    z: number;
  }[];
};

type UnknownData = Record<string, unknown>;

interface SmplrRoom extends UnknownData {
  name: string;
  color: string;
}
interface SmplrDevice extends UnknownData {
  name: string;
  color: string;
  image: string;
}

interface Props {
  cornersData: CornerData[];
  deviceLocationsData: LocationData[];
  smplrSpaceId: string;
  spaceName: string;
  spaceDescription?: string;
}

type DeviceModalData = {
  id: string;
  name: string;
  image: string;
};

export default function SpaceViewer({
  cornersData,
  smplrSpaceId: spaceId,
  spaceName,
  spaceDescription,
  deviceLocationsData,
}: Props) {
  const spaceRef = useRef<Space>();
  const [viewerReady, setViewerReady] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceModalData | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadSmplrJs("esm")
      .then((smplr) => {
        spaceRef.current = new smplr.Space({
          spaceId,
          clientToken: "pub_aa97e525ce8c4c1e85fe5947f89b5e33",
          containerId: "test",
        });
        spaceRef.current.startViewer({
          preview: true,
          onReady: () => setViewerReady(true),
          onError: (error) => console.error("Could not start viewer", error),
        });
      })
      .catch((error) => console.error(error));
  }, [spaceId]);

  useEffect(() => {
    if (!viewerReady) {
      return;
    }
    spaceRef.current?.addDataLayer({
      id: "Origin",
      type: "point",
      color: "#FF0000",
      shape: "sphere",
      diameter: 0.2,
      tooltip: () => `(0,0)`,
      data: [
        {
          id: "origin",
          position: { levelIndex: 0, elevation: 3.2, x: 0, z: 0 },
        },
      ],
    });
  }, [viewerReady]);

  useEffect(() => {
    if (!viewerReady) {
      return;
    }
    spaceRef.current?.addDataLayer<SmplrRoom>({
      id: "Corners",
      type: "polygon",
      color: (d) => d.color || "#00FF00",
      height: 0.21,
      // tooltip: (d) => d.name,
      data: cornersData,
    });
  }, [viewerReady, cornersData]);

  useEffect(() => {
    if (!viewerReady) {
      return;
    }
    spaceRef.current?.addDataLayer<SmplrDevice>({
      id: "Devices",
      type: "point",
      shape: "sphere",
      diameter: 0.4,
      color: (d) => d.color || "#00FF00",
      tooltip: (d) => d.name,
      data: deviceLocationsData,
      onClick: (d) => {
        setIsModalOpen(true);
        setSelectedDevice({
          id: d.id?.toString() || "",
          image: d.image,
          name: d.name,
        });
      },
    });
  }, [viewerReady, deviceLocationsData]);

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDevice?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <img src={selectedDevice?.image || ""} alt={selectedDevice?.name} />
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex-1 h-full relative">
        <div className="absolute top-4 left-6 z-10">
          <h1 className="font-bold text-xl">{spaceName}</h1>
          <p>{spaceDescription}</p>
        </div>
        <div id="test" className="h-full"></div>
      </div>
    </>
  );
}
