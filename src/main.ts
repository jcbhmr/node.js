#!/usr/bin/env node
import process from "node:process"
import { fileURLToPath } from "node:url"
import { args, userExecve, isGlibc } from "./utils.ts"

const libcSuffix = process.platform === "linux" ? `-${isGlibc() ? "glibc" : "musl"}` : "";
const suffix = `-${process.platform}-${process.arch}${libcSuffix}`;
const nodePath = fileURLToPath(import.meta.resolve(`@jcbhmr/node${suffix}/node`));
const execve = process.execve?.bind(process) ?? userExecve;
execve(nodePath, [process.argv0, ...args])
