#!/usr/bin/env node
import { $ } from "execa"
import packageJSON from "./package.json" with { type: "json" }
import { parse as parseSemver } from "semver"
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const nodeVersion = parseSemver(packageJSON.version, {}, true).build.join(".");

const imageIndex = await $({ verbose: "short" })`go tool crane manifest arm64v8/node:${nodeVersion}-alpine`.then(result => JSON.parse(result.stdout))
assert(imageIndex.mediaType === "application/vnd.oci.image.index.v1+json", "Expected an OCI image index");
const imageManifestRef = imageIndex.manifests.find((manifest: any) => manifest.mediaType === "application/vnd.oci.image.manifest.v1+json")
assert(imageManifestRef !== undefined, "Expected to find an image manifest reference in the image index");

const imageManifest = await $({ verbose: "short" })`go tool crane manifest arm64v8/node@${imageManifestRef.digest}`.then(result => JSON.parse(result.stdout))
assert(imageManifest.mediaType === "application/vnd.oci.image.manifest.v1+json", "Expected an OCI image manifest");
const layerRef = imageManifest.layers[1]

await mkdir("./.cache", { recursive: true })
await $({ verbose: "short", stdout: { file: "./.cache/layer-node.tar.gz" } })`go tool crane blob arm64v8/node@${layerRef.digest}`
await mkdir("./dist", { recursive: true })
await $({ verbose: "short" })`tar -xzf ./.cache/layer-node.tar.gz -C ./dist/ usr/local/bin/node --strip-components=1000`

const response = await fetch(`https://github.com/nodejs/node/raw/v${nodeVersion}/LICENSE`)
if (response.status !== 200) {
    throw new Error(`Failed to fetch LICENSE file ${response.url}: ${response.status} ${response.statusText}`);
}
await writeFile("./dist/LICENSE", await response.bytes());
