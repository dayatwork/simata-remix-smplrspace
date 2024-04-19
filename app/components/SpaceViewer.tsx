import { loadSmplrJs } from "@smplrspace/smplr-loader";
import { Space } from "node_modules/@smplrspace/smplr-loader/dist/generated/smplr";
import { useEffect, useRef, useState } from "react";

export type LocationData = {
  id: string;
  name: string;
  color: string;
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

interface Props {
  cornersData: CornerData[];
  deviceLocationData: LocationData[];
  smplrSpaceId: string;
  spaceName: string;
  spaceDescription?: string;
}

export default function SpaceViewer({
  cornersData,
  smplrSpaceId: spaceId,
  spaceName,
  spaceDescription,
}: Props) {
  const spaceRef = useRef<Space>();
  const [viewerReady, setViewerReady] = useState(false);

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
    spaceRef.current?.addDataLayer<SmplrRoom>({
      id: "Corners",
      type: "polygon",
      color: (d) => d.color || "#00FF00",
      height: 0.21,
      tooltip: (d) => d.name,
      data: cornersData,
    });
  }, [viewerReady, cornersData]);

  return (
    <div className="flex-1 h-full relative">
      <div className="absolute top-4 left-6 z-10">
        <h1 className="font-bold text-xl">{spaceName}</h1>
        <p>{spaceDescription}</p>
      </div>
      <div id="test" className="h-full"></div>
    </div>
  );
}
