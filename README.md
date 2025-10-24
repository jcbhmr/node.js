# Node.js for npm

📦 Node.js released as an npm package

## Installation

**You probably don't want to `npm install --global` this package.** Use this package if your primary development workflow uses Deno or Bun and you need Node.js as a project dependency for something.

<div>Deno</div>

```sh
deno add npm:@jcbhmr/node
```

<div>Bun</div>

```sh
bun install @jcbhmr/node
```

You can also use this with `npx` to quickly run a specific Node.js version without installing it globally.

```sh
npx --yes @jcbhmr/node@^25
```

## Usage

Right now this package only exposes the `node` binary as a `bin` entrypoint. It's a transparent wrapper around the official Node.js binaries.

```sh
# After adding the package to your project
npx node ./my-node-script.js
```

[📚 See the official Node.js documentation for more information on using the Node.js CLI and runtime environment.](https://nodejs.org/docs/latest/api/)

## Development

**How it works**

1. When you `npm install` (or similar) this package, npm will see that there are a number of optional dependencies. Each optional dependency like `@jcbhmr/node-win32-x64` corresponds to a specific Node.js binary for a specific platform and architecture. npm will only install the optional dependencies that match the current platform and architecture.
2. When you invoke `npx node` (or similar), the `main.js` file will determine which optional dependency it should look for.
3. Replace the `bin` field in `@jcbhmr/node`'s `package.json` to point to that platform-specific package's `node(.exe)?` binary instead of the `main.js` wrapper. That way, subsequent invocations of `npx node` will directly call the platform-specific binary without going through the wrapper again.
4. Spawn the platform-specific Node.js binary with the provided arguments using `process.execve()` if possible, or [`nano-spawn`](https://www.npmjs.com/package/nano-spawn) as a fallback (Windows).
