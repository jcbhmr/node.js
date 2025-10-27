#!/usr/bin/env node
import { $ } from "execa"
import packageJSON from "./package.json" with { type: "json" }
import { parse as parseSemver } from "semver"
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";

const nodeVersion = parseSemver(packageJSON.version, {}, true).build.join(".");

await mkdir("./dist", { recursive: true })
const response = await fetch(`https://unofficial-builds.nodejs.org/download/release/v${nodeVersion}/node-v${nodeVersion}-linux-x64-musl.tar.xz`)
if (response.status !== 200) {
    throw new Error(`Failed to fetch Node.js binary ${response.url}: ${response.status} ${response.statusText}`);
}
await pipeline(
    response.body ?? new ReadableStream(),
    createWriteStream("./dist/node.tar.xz")
)
await $({ verbose: "short" })`tar -xJf ./dist/node.tar.xz -C ./dist/ node-v${nodeVersion}-linux-x64-musl/LICENSE node-v${nodeVersion}-linux-x64-musl/bin/node --strip-components=1`
await rename("./dist/bin/node", "./dist/node");
await rm("./dist/bin/", { recursive: true, force: true });
