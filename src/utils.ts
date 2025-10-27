import { spawnSync } from "node:child_process"
import { constants } from "node:os"
import process from "node:process"

export function userExecve(file: string, args?: readonly string[] | undefined, env?: NodeJS.ProcessEnv | undefined): never {
    try {
        const result = spawnSync(file, args?.slice(1), {
            argv0: args?.[0],
            stdio: "inherit",
            env,
        })
        if (result.signal != null) {
            process.exit(128 + constants.signals[result.signal])
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

declare global {
    namespace NodeJS {
        interface ProcessReport {
            excludeNetwork?: boolean;
        }
    }
}

interface Report {
    header?: {
        glibcVersionRuntime?: string;
    }
}
let reportCache: Report | undefined;
function getReport(): Report {
    if (reportCache == null) {
        const oldExcludeNetwork = process.report.excludeNetwork;
        process.report.excludeNetwork = true;
        reportCache = process.report.getReport()
        process.report.excludeNetwork = oldExcludeNetwork;
    }
    return reportCache;
}

export function isGlibc(): boolean {
    return getReport().header?.glibcVersionRuntime != null;
}
