import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["src/code.ts"],
  bundle: true,
  outdir: "dist",
  format: "iife",
  target: "es2022",
  platform: "neutral",
  sourcemap: true,
  minify: !watch,
  treeShaking: true,
};

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(buildOptions);
  console.log("Build complete");
}
