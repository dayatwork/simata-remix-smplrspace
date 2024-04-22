import mqtt from "mqtt";

export const client = mqtt.connect("ws://broker.emqx.io:8083/mqtt", {
  port: 8083,
  username: "",
  password: "",
});
