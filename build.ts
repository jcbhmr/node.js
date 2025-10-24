#!/usr/bin/env node
import packageJSON from "./package.json" with { type: "json" };
import { createWriteStream, type PathLike } from "node:fs";
import { Writable } from "node:stream";
import * as tar from "tar";
import JSZip, { type JSZipObject } from "jszip";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

async function download(url: string | URL, path: PathLike): Promise<void> {
  const response = await fetch(url);
  if (response.status !== 200) {
    throw new Error(
      `${response.url} returned ${response.status}, expected 200`,
    );
  }
  if (!response.body) {
    throw new Error(`${response.url} returned no body`);
  }
  await mkdir(
    dirname(path instanceof URL ? fileURLToPath(path) : path.toString()),
    { recursive: true },
  );
  await response.body.pipeTo(Writable.toWeb(createWriteStream(path)));
}

async function extractZip(from: PathLike, to: PathLike): Promise<void> {
  const data = await readFile(from);
  const zip = await new JSZip().loadAsync(data);
  const entries = [] as [string, JSZipObject][];
  zip.forEach((relativePath, file) => {
    entries.push([relativePath, file]);
  });
  await mkdir(to, { recursive: true });
  for (const [relativePath, file] of entries) {
    const toRelativePath = join(
      to instanceof URL ? fileURLToPath(to) : to.toString(),
      relativePath,
    );
    await mkdir(dirname(toRelativePath), { recursive: true });
    await pipeline(file.nodeStream(), createWriteStream(toRelativePath));
  }
}

if (
  await access("./out/win32-x64.zip").then(
    () => false,
    () => true,
  )
) {
  await download(
    `https://nodejs.org/download/release/v${packageJSON.version}/node-v${packageJSON.version}-win-x64.zip`,
    "./out/win32-x64.zip",
  );
}
if (
  await access("./out/win32-x64/").then(
    () => false,
    () => true,
  )
) {
  await extractZip("./out/win32-x64.zip", "./out/win32-x64/");
}
