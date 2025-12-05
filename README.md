# Node.js for npm

📦 Node.js released as an npm package

## Installation

**You probably don't want to `npm install --global` this package.** Use this
package if your primary development workflow uses Deno or Bun and you need
Node.js as a project dependency for something.

<div>Deno</div>

```sh
deno add npm:@jcbhmr/node
```

<div>Bun</div>

```sh
bun install @jcbhmr/node
```

You can also use this with `npx` to quickly run a specific Node.js version
without installing it globally.

```sh
npx --yes --package @jcbhmr/node@^20 node ./node-20-script.js
```

## Usage

This package has a `node` binary. It's a transparent wrapper around the official Node.js binaries.

```sh
# 'npx' should use your project's local dependencies
npx node ./my-node-script.js
```

[📚 See the official Node.js CLI and runtime environment documentation for more information.](https://nodejs.org/docs/latest/api/)

## Development

**How it works**

1. When you `npm install` (or similar) this package, npm will see that there are
   a number of optional dependencies. Each optional dependency like
   `@jcbhmr/node-win32-x64` corresponds to a specific Node.js binary for a
   specific platform and architecture. npm will only install the optional
   dependencies that match the current platform and architecture.
2. When you invoke `npx node` (or similar), the `main.js` file will determine
   which optional dependency it should look for.
3. Spawn the platform-specific Node.js binary with the provided arguments using
   `process.execve()` if possible, or `child_process.spawn()` as a fallback.
