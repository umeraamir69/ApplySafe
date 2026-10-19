import { cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

const appDir = __dirname;
const repo = path.join(appDir, "../..");
const packed = path.join(appDir, ".applysafe");

rmSync(packed, { recursive: true, force: true });
mkdirSync(path.join(packed, "packages/engine/src"), { recursive: true });
cpSync(path.join(repo, "packages/engine/src"), path.join(packed, "packages/engine/src"), {
  recursive: true,
});
mkdirSync(path.join(packed, "data/rules/ca"), { recursive: true });
cpSync(path.join(repo, "data/rules/ca"), path.join(packed, "data/rules/ca"), { recursive: true });
mkdirSync(path.join(packed, "apps/extension"), { recursive: true });
cpSync(path.join(repo, "apps/extension/rules.json"), path.join(packed, "apps/extension/rules.json"));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["yaml"],
  outputFileTracingIncludes: {
    "/": [".applysafe/**/*"],
    "/privacy": [".applysafe/**/*"],
    "/health": [".applysafe/**/*"],
    "/v1/scan": [".applysafe/**/*"],
    "/v1/rules": [".applysafe/**/*"],
  },
};

export default nextConfig;
