import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";
import htmlInject from "vite-plugin-html-inject";
import tailwindcss from "@tailwindcss/vite";

const root = import.meta.dirname;

const pagesDir = resolve(root, "src/pages");

// Every .html file in src/pages is a page: about.html -> { about: "/abs/src/pages/about.html" }
function pages() {
  return Object.fromEntries(
    fs
      .readdirSync(pagesDir)
      .filter((file) => file.endsWith(".html"))
      .map((file) => [file.replace(/\.html$/, ""), resolve(pagesDir, file)]),
  );
}

// Serves src/pages at the site root, so URLs stay /about.html instead of /src/pages/about.html.
function pagesAtRoot() {
  return {
    name: "pages-at-root",
    enforce: "post",
    // Dev: rewrite /about.html -> /src/pages/about.html before Vite handles the request.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [path, query = ""] = req.url.split("?");
        const file = path === "/" ? "index.html" : path.slice(1);
        if (file.endsWith(".html") && fs.existsSync(resolve(pagesDir, file))) {
          req.url = `/src/pages/${file}${query && `?${query}`}`;
        }
        next();
      });
    },
    // Build: write dist/src/pages/about.html as dist/about.html.
    generateBundle(_, bundle) {
      for (const [key, chunk] of Object.entries(bundle)) {
        if (chunk.type === "asset" && key.startsWith("src/pages/")) {
          delete bundle[key];
          this.emitFile({
            type: "asset",
            fileName: key.slice("src/pages/".length),
            source: chunk.source,
          });
        }
      }
    },
  };
}

// Wraps page content in a layout: <layout src="src/layouts/main.html" title="Home">...</layout>
// The layout marks the insertion point with <!-- @content --> and reads args as {=$title}.
function htmlLayout() {
  const layoutTag = /<layout((?:\s+[a-z0-9_-]+="[^"]*")+)\s*>([\s\S]*?)<\/layout>/i;
  const attrMatcher = /([a-z0-9_-]+)="([^"]*)"/gi;
  return {
    name: "html-layout",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const match = html.match(layoutTag);
        if (!match) return html;
        const [, attrs, content] = match;
        const args = Object.fromEntries(
          [...attrs.matchAll(attrMatcher)].map(([, name, value]) => [name, value]),
        );
        let layout = fs.readFileSync(resolve(root, args.src), "utf8");
        for (const [name, value] of Object.entries(args)) {
          layout = layout.replaceAll(`{=$${name}}`, value);
        }
        return layout.replace("<!-- @content -->", content.trim());
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.includes("/src/layouts/")) {
        server.ws.send({ type: "full-reload", path: "*" });
      }
    },
  };
}

export default defineConfig({
  plugins: [pagesAtRoot(), htmlLayout(), htmlInject({ replace: { undefined: "" } }), tailwindcss()],
  build: {
    rollupOptions: {
      input: pages(),
    },
  },
});
