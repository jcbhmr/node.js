import { spawnSync } from "node:child_process"
import type { PathLike } from "node:fs"
import { access, copyFile, rename, constants as fsConstants, unlink } from "node:fs/promises"
import { constants as osConstants } from "node:os"
import process from "node:process"
import { Buffer } from "node:buffer"
import { isMainThread } from "node:worker_threads"

export function userExecve(file: string, args?: readonly string[] | undefined, env?: NodeJS.ProcessEnv | undefined): never {
    if (!isMainThread) {
        throw Object.assign(new TypeError("Calling execve() is not supported in Worker threads"), { code: "ERR_WORKER_UNSUPPORTED_OPERATION" })
    }
    try {
        const result = spawnSync(file, args?.slice(1), {
            argv0: args?.[0],
            stdio: "inherit",
            env,
        })
        if (result.signal != null) {
            process.kill(process.pid, result.signal)
            process.exit(128 + osConstants.signals[result.signal])
        } else {
            process.exit(result.status!)
        }
    } catch (error) {
        if (error instanceof TypeError) {
            throw error
        } else {
            console.error(error);
            process.abort();
        }
    }
}

export const args = process.argv.slice(["--eval", "-e", "--print", "-p"].some(nodeArg => process.execArgv.includes(nodeArg)) ? 1 : 2)

async function renameExcl(src: PathLike, dest: PathLike): Promise<void> {
    let exists: boolean;
    try {
        await access(dest);
        exists = true;
    } catch (error: any) {
        if (error?.code === "ENOENT") {
            exists = false;
        } else {
            throw error;
        }
    }
    if (exists) {
        throw Object.assign(new Error(`${dest} already exists`), { code: "EEXIST" });
    }
    await rename(src, dest);
}

function pathLikeAppend(path: PathLike, suffix: string): PathLike {
    if (typeof path === "string") {
        return path + suffix;
    } else if (path instanceof URL) {
        return new URL(path.href + suffix);
    } else if (path instanceof Buffer) {
        return Buffer.concat([path, Buffer.from(suffix)]);
    } else {
        throw new TypeError("path is not PathLike");
    }
}

export async function copyFileInUse(src: PathLike, dest: PathLike): Promise<void> {
    const destOld = pathLikeAppend(dest, ".OLD");
    const destNew = pathLikeAppend(dest, ".NEW");
    await copyFile(src, destNew, fsConstants.COPYFILE_EXCL);
    await rename(dest, destOld);
    try {
        await renameExcl(destNew, dest);
    } catch (error) {
        try {
            await renameExcl(destOld, dest);
        } catch (error2) {
            const error3 = new AggregateError([error, error2], `${dest} is in a partially replaced state`);
            console.error(error3);
            if (isMainThread) {
                process.abort();
            } else {
                process.kill(process.pid, "SIGABRT");
                process.exit(128 + osConstants.signals.SIGABRT);
            }
        }
        throw error;
    }
    await unlink(destOld);
}
