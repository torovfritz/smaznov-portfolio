import { build } from "esbuild";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const entryPoint = fileURLToPath(new URL("./src/assets/js/site.js", import.meta.url));
const bundlePath = fileURLToPath(new URL("./src/assets/js/site.bundle.js", import.meta.url));

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addFilter("inlineLogo", (name, section) => {
    if (!/^[a-z0-9-]+$/.test(name) || !["resume", "education"].includes(section)) {
      throw new Error(`Invalid inline logo: ${section}/${name}`);
    }

    const path = fileURLToPath(new URL(`./src/assets/images/${section}/${name}.svg`, import.meta.url));
    const svg = readFileSync(path, "utf8");
    return svg.replace("<svg ", '<svg class="inline-logo" aria-hidden="true" focusable="false" ');
  });
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
