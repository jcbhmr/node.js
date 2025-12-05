#!/usr/bin/env node
import process from "node:process"
import { fileURLToPath } from "node:url"
import { args, userExecve } from "./utils.ts"
import { family as detectLibcFamily } from "detect-libc"

const libcSuffix = await (async () => {
    if (process.platform !== "linux") {
        return "";
    }
    const family = await detectLibcFamily() as "glibc" | "musl" | null;
    if (family == null) {
        return "";
    }
    return `-${family}`;
})()
const suffix = `-${process.platform}-${process.arch}${libcSuffix}`;

const nativePath = fileURLToPath(import.meta.resolve(`@jcbhmr/node${suffix}`));
const execve = process.execve?.bind(process) ?? userExecve;
execve(nativePath, [process.argv0, ...args]);
