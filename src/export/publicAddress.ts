import { BlockList, isIPv4, isIPv6 } from "node:net";

/** Ranges that aren't on the public internet (RFC 6890 special-purpose registries and friends). */
const nonPublic = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  nonPublic.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  nonPublic.addSubnet(network, prefix, "ipv6");
}

const IPV4_MAPPED = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i;

/** True for a public unicast IP address; false for private, loopback, link-local, etc. */
export function isPublicAddress(address: string): boolean {
  const mapped = IPV4_MAPPED.exec(address);
  if (mapped) return isPublicAddress(mapped[1]);
  if (isIPv4(address)) return !nonPublic.check(address, "ipv4");
  if (isIPv6(address)) return !nonPublic.check(address, "ipv6");
  return false;
}
