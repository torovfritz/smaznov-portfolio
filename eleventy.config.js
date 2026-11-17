import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const entryPoint = fileURLToPath(new URL("./src/assets/js/site.js", import.meta.url));
const bundlePath = fileURLToPath(new URL("./src/assets/js/site.bundle.js", import.meta.url));

export default function (eleventyConfig) {
  eleventyConfig.on("eleventy.before", async () => {
    const result = await build({
      entryPoints: [entryPoint],
      outfile: bundlePath,
      bundle: true,
      format: "iife",
      platform: "browser",
      target: "es2020",
      minify: true,
      write: false
    });
    const bundle = result.outputFiles[0].contents;
    const previousBundle = await readFile(bundlePath).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });

    if (!previousBundle || !previousBundle.equals(bundle)) {
      await writeFile(bundlePath, bundle);
    }
  });

  eleventyConfig.addPassthroughCopy("src/assets");
  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk"
  };
}
