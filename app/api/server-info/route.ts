import { NextResponse } from "next/server";
import { networkInterfaces } from "os";

function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

export async function GET() {
  const ip = getLocalIP();
  return NextResponse.json({ ip, url: `http://${ip}:3000` });
}
