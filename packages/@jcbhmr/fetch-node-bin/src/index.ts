import process from "node:process";
import { unlink } from "node:fs/promises";
import { temporaryFile, type FileOptions } from "tempy";
import { createReadStream, createWriteStream, openAsBlob, type PathLike } from "node:fs";
import { fileURLToPath } from "node:url";
import { Readable, Writable } from "node:stream";
import { BlobReader, TextWriter, ZipReader } from "@zip.js/zip.js"
import { arrayBuffer } from "node:stream/consumers";
import { normalize } from "node:path/posix";
import { Archive, EntryType } from "@napi-rs/tar"

class TemporaryFile {
    #path: string;
    constructor(options?: FileOptions) {
        this.#path = temporaryFile(options);
    }
    get path() {
        return this.#path;
    }
    async [Symbol.asyncDispose]() {
        await unlink(this.path)
    }
}

function artifactArchiveURL(version: string, platform: NodeJS.Platform, arch: NodeJS.Architecture, endianness: "BE" | "LE", libc: "glibc" | "musl" | null): string | null {
}

function unofficialArtifactArchiveURL(version: string, platform: NodeJS.Platform, arch: NodeJS.Architecture, endianness: "BE" | "LE", libc: "glibc" | "musl" | null): string | null {
}

export default async function fetchNodeBin(version: string, platform: NodeJS.Platform, arch: NodeJS.Architecture, endianness: "BE" | "LE", libc: "glibc" | "musl" | null): File | null {
    const url = artifactArchiveURL(version, platform, arch, endianness, libc) ?? unofficialArtifactArchiveURL(version, platform, arch, endianness, libc);
    if (url == null) {
        return null;
    }
    const extension = [".tar.xz", ".zip"].find(ext => url.endsWith(ext));
    if (extension == null) {
        throw new Error(`Unsupported archive format in '${url}'`);
    }
    await using archivePath = new TemporaryFile({ extension });
    const response = await fetch(url);
    if (response.status !== 200) {
        if (response.status === 404) {
            return null;
        } else {
            throw new Error(`Failed to fetch Node.js binary archive from '${url}': ${response.status} ${response.statusText}`);
        }
    }
    if (!response.body) {
        throw new Error(`No response body when fetching Node.js binary archive from '${url}'`);
    }
    await response.body.pipeTo(Writable.toWeb(createWriteStream(archivePath.path)));
    let file: File | undefined;
    if (extension === ".tar.xz") {
        const reader = new Archive(archivePath.path);
        for (const entry of reader.entries()) {
            if (entry.path() === `node-v${version}-${platform}-${arch}/bin/node`) {
                const buffer = entry.asBytes();
                file = new File([buffer], "node");
                break;
            }
        }
    } else if (extension === ".zip") {
        const reader = new ZipReader(Readable.toWeb(createReadStream(archivePath.path)));
        for await (const entry of reader.getEntriesGenerator()) {
            if (entry.directory) {
                continue;
            }
            if (entry.filename === `node-v${version}-${platform}-${arch}/node.exe`) {
                const buffer = await entry.arrayBuffer();
                file = new File([new Uint8Array(buffer)], "node.exe");
                break;
            }
        }
    } else {
        throw new Error(`Unsupported archive format '${extension}'`);
    }
    return file ?? null;
}