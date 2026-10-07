import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";
import htmlInject from "vite-plugin-html-inject";
import tailwindcss from "@tailwindcss/vite";

const root = import.meta.dirname;

// Every .html file in the project root is a page: about.html -> { about: "/abs/about.html" }
function pages() {
  return Object.fromEntries(
    fs
      .readdirSync(root)
      .filter((file) => file.endsWith(".html"))
      .map((file) => [file.replace(/\.html$/, ""), resolve(root, file)]),
  );
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
  plugins: [htmlLayout(), htmlInject({ replace: { undefined: "" } }), tailwindcss()],
  build: {
    rollupOptions: {
      input: pages(),
    },
  },
});
