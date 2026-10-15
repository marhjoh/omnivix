import { describe, expect, it } from "vitest";
import { isPublicAddress } from "./publicAddress";

describe("isPublicAddress", () => {
  it.each(["8.8.8.8", "151.101.1.69", "2606:4700:4700::1111", "::ffff:8.8.8.8"])(
    "allows public %s",
    (address) => {
      expect(isPublicAddress(address)).toBe(true);
    },
  );

  it.each([
    ["loopback", "127.0.0.1"],
    ["private 10/8", "10.1.2.3"],
    ["private 172.16/12", "172.20.0.1"],
    ["private 192.168/16", "192.168.1.1"],
    ["link-local / cloud metadata", "169.254.169.254"],
    ["carrier-grade NAT", "100.64.0.1"],
    ["unspecified", "0.0.0.0"],
    ["multicast", "224.0.0.1"],
    ["broadcast", "255.255.255.255"],
    ["IPv6 loopback", "::1"],
    ["IPv6 unique local", "fd00::1"],
    ["IPv6 link-local", "fe80::1"],
    ["IPv4-mapped loopback", "::ffff:127.0.0.1"],
    ["IPv4-mapped private", "::ffff:10.0.0.1"],
    ["NAT64", "64:ff9b::7f00:1"],
    ["not an address", "localhost"],
  ])("blocks %s (%s)", (_, address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
});
