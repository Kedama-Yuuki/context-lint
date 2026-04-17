import * as esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");
const isProduction = process.argv.includes("--production");

/** @type {import('esbuild').BuildOptions} */
const shared = {
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node20",
  sourcemap: !isProduction,
  minify: isProduction,
  external: ["vscode"],
};

// Build client (extension entry point)
const clientBuild = esbuild.build({
  ...shared,
  entryPoints: ["src/client/extension.ts"],
  outfile: "dist/client/extension.js",
});

// Build server (language server)
const serverBuild = esbuild.build({
  ...shared,
  entryPoints: ["src/server/server.ts"],
  outfile: "dist/server/server.js",
});

if (isWatch) {
  const clientCtx = await esbuild.context({
    ...shared,
    entryPoints: ["src/client/extension.ts"],
    outfile: "dist/client/extension.js",
  });
  const serverCtx = await esbuild.context({
    ...shared,
    entryPoints: ["src/server/server.ts"],
    outfile: "dist/server/server.js",
  });
  await Promise.all([clientCtx.watch(), serverCtx.watch()]);
  console.log("Watching for changes...");
} else {
  await Promise.all([clientBuild, serverBuild]);
  console.log("Build complete");
}
