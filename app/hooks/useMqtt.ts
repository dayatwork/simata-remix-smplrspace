import { useState, useEffect } from "react";
import mqtt, { MqttClient, IClientOptions } from "mqtt";

const setting = {
  url: import.meta.env.VITE_MQTT_URL,
  config: {
    username: import.meta.env.VITE_MQTT_USERNAME,
    password: import.meta.env.VITE_MQTT_PASSWORD,
    port: +import.meta.env.VITE_MQTT_PORT,
  },
};

export type LocationChangedPayload = {
  id: string;
  deviceName: string;
  roomName: string;
  position: {
    levelIndex: number;
    elevation: number;
    x: number;
    z: number;
  };
};

export default function useMqtt() {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [payload, setPayload] = useState<{ topic: string; message: string }>(
    {} as { topic: string; message: string }
  );

  const getClientId = () => {
    console.log(`Set MQTT Broker...`);
    return `mqttjs_ + ${Math.random().toString(16).substring(2, 8)}`;
  };

  const mqttConnect = async () => {
    const clientId = getClientId();
    const url = setting.url;
    const options: IClientOptions = {
      clientId,
      keepalive: 60,
      clean: true,
      reconnectPeriod: 300000,
      connectTimeout: 30000,
      rejectUnauthorized: false,
      ...setting.config,
    };
    const clientMqtt = mqtt.connect(url, options);
    setClient(clientMqtt);
  };

  const mqttDisconnect = () => {
    if (client) {
      client.end(() => {
        console.log("MQTT Disconnected");
        setIsConnected(false);
      });
    }
  };

  const mqttSubscribe = async (topic: string) => {
    if (client) {
      console.log("MQTT subscribe ", topic);
      const clientMqtt = client.subscribe(
        topic,
        {
          qos: 0,
          rap: false,
          rh: 0,
        },
        (error) => {
          if (error) {
            console.log("MQTT subscript to topics error", error);
            return;
          }
        }
      );
      setClient(clientMqtt);
    }
  };

  const mqttUnSubscribe = async (topic: string) => {
    if (client) {
      const clientMqtt = client.unsubscribe(topic, (error) => {
        if (error) {
          console.log("MQTT unsubscribe error", error);
        }
      });
      setClient(clientMqtt);
    }
  };

  useEffect(() => {
    mqttConnect();
    return () => {
      mqttDisconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (client) {
      client.on("connect", () => {
        setIsConnected(true);
        console.log("MQTT Connected");
      });
      client.on("error", (err) => {
        console.error("MQTT connection error: ", err);
        client.end();
      });
      client.on("reconnect", () => {
        setIsConnected(true);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client.on("message", (_topic: string, message: Buffer) => {
        const payloadMessage = { topic: _topic, message: message.toString() };
        setPayload(payloadMessage);
      });
    }
  }, [client]);

  return {
    mqttConnect,
    mqttDisconnect,
    mqttSubscribe,
    mqttUnSubscribe,
    payload,
    isConnected,
  };
}
