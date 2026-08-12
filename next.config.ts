import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Autorise l'accès au serveur de dev (et au live-reload) depuis un
  // téléphone sur le même réseau Wi-Fi. Si l'IP locale de ton PC change
  // (reconnexion Wi-Fi, autre réseau...), ajoute la nouvelle ici.
  allowedDevOrigins: ["192.168.1.64"],
};

export default nextConfig;
