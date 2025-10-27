import { rename } from "node:fs/promises";
import { defineConfig } from "tsdown";

export default defineConfig({
    entry: "./src/main.ts",
    hooks: {
        async "build:done"() {
            console.log("%cRenamed%c %c%s%c to %c%s%c for Windows compatibility", "color: green; font-weight: bold", "", "color: blue", "./dist/main.js", "", "color: blue", "./dist/main.exe", "");
            await rename("./dist/main.js", "./dist/main.exe");
        }
    }
})
