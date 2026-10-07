# Vite tailwind alpine starter

Build a website from plain HTML files. Write the header and footer once, then reuse them on every page.

It uses Vite, Tailwind CSS and Alpine.js.

---

## Getting started

```bash
npm install       # once
npm run dev       # start the site at http://localhost:5173
npm run build     # make the final site in dist/
npm run preview   # check the final site
```

---

## How it fits together

There are three building blocks:

| Block         | What it is                                     | Where it lives    |
| ------------- | ---------------------------------------------- | ----------------- |
| **Page**      | One page of your site                          | `src/pages/`      |
| **Layout**    | The frame around a page (head, header, footer) | `src/layouts/`    |
| **Component** | A small reusable piece (a header, a card...)   | `src/components/` |

A page sits inside a layout, and the layout loads components:

```
src/pages/about.html  ──►  src/layouts/main.html  ──►  src/components/header.html
 (content)                 (frame)                    src/components/footer.html
```

```
src/
  pages/             ← your pages
    index.html       ← home page (/)
    about.html       ← /about.html
    contact.html     ← /contact.html
  layouts/
    main.html        ← the frame around every page
  components/
    header.html
    footer.html
  assets/
    images/          ← images
    videos/          ← videos
  css/style.css      ← Tailwind
  js/main.js         ← JavaScript (Alpine.js)
vite.config.js       ← build setup (you rarely need to touch it)
```

---

## 1. Pages

A page is any `.html` file in `src/pages/`. Wrap its content in a `<layout>` tag:

```html
<!-- src/pages/contact.html -->
<layout src="src/layouts/main.html" title="Contact">
  <h1>Contact</h1>
  <p>Say hi!</p>
</layout>
```

Save the file and open `http://localhost:5173/contact.html`. There is nothing to register, because every `.html` file in `src/pages/` is built automatically.

The `src/pages/` part is not in the URL:

| File                     | URL             |
| ------------------------ | --------------- |
| `src/pages/index.html`   | `/`             |
| `src/pages/about.html`   | `/about.html`   |
| `src/pages/contact.html` | `/contact.html` |

> **Note:** pages live in `src/pages/`, but paths inside them still start from the project root.
> Write `src="src/layouts/main.html"`, **not** `../layouts/main.html`.

---

## 2. Layouts

A layout is a full HTML page with a gap in it. Your page content fills the gap at `<!-- @content -->`.

```html
<!-- src/layouts/main.html -->
<!doctype html>
<html lang="en">
  <head>
    <title>{=$title} | My Site</title>
    <link rel="stylesheet" href="/src/css/style.css" />
  </head>
  <body>
    <load src="src/components/header.html" />

    <main>
      <!-- @content -->
    </main>

    <load src="src/components/footer.html" />

    <script type="module" src="/src/js/main.js"></script>
  </body>
</html>
```

So this page:

```html
<layout src="src/layouts/main.html" title="Contact">
  <h1>Contact</h1>
</layout>
```

comes out like this:

```html
<html>
  ...
  <main>
    <h1>Contact</h1>
  </main>
  ...
</html>
```

Want a different look on some pages? Make another layout, for example `src/layouts/blank.html`, and point the page at it.

---

## 3. The `<load />` tag

`<load />` pastes the contents of another file into the page. It works in pages, layouts and components.

```html
<load src="src/components/footer.html" />
```

Two rules:

1. **Close it with `/>`.**
   ✅ `<load src="..." />`
   ❌ `<load src="..."></load>`, which is silently ignored.
2. **Write the path from the project root, with no `./`.**
   ✅ `src/components/footer.html`
   ❌ `./src/components/footer.html`

---

## 4. Arguments

Arguments let you send values into a layout or component.

- **Send** a value as an attribute: `name="value"`
- **Read** it with `{=$name}`

### Into a component

```html
<!-- where you use it -->
<load src="src/components/button.html" text="Buy now" link="/shop.html" />
```

```html
<!-- src/components/button.html -->
<a href="{=$link}" class="rounded bg-black px-4 py-2 text-white">{=$text}</a>
```

The result:

```html
<a href="/shop.html" class="rounded bg-black px-4 py-2 text-white">Buy now</a>
```

Use the same component again with different arguments:

```html
<load src="src/components/button.html" text="Contact" link="/contact.html" />
```

### Into a layout

```html
<!-- src/pages/about.html -->
<layout src="src/layouts/main.html" title="About"> ... </layout>
```

```html
<!-- src/layouts/main.html -->
<title>{=$title} | My Site</title>
```

### From a page to a component

A page can't talk to the header directly, so the layout passes the value along:

```html
<!-- src/pages/about.html -->
<layout src="src/layouts/main.html" title="About"> ... </layout>

<!-- src/layouts/main.html -->
<load src="src/components/header.html" active="{=$title}" />

<!-- src/components/header.html -->
<span>You are on: {=$active}</span> → You are on: About
```

### Good to know

- Values are plain text. You can't pass HTML.
- If a component expects an argument you didn't send, it becomes empty.
- If a layout expects an argument you didn't send, you'll see `{=$name}` on the page.

---

## 5. Underline the current menu link

The header uses the `active` argument to underline the link for the current page:

```html
<!-- src/components/header.html -->
<div class="group" data-active="{=$active}">
  <a href="/" class="group-data-[active=Home]:underline">home</a>
  <a href="/about.html" class="group-data-[active=About]:underline">about</a>
</div>
```

When you add a page, add a link whose class uses that page's `title`:

```html
<a href="/contact.html" class="group-data-[active=Contact]:underline"
  >contact</a
>
```

The match is case-sensitive. Write spaces as `_`, so `title="Contact Us"` becomes `active=Contact_Us`.

---

## 6. Images and videos

Put files in `src/assets/` and link them with a path that starts with `/`:

```html
<img src="/src/assets/images/sample.png" alt="Sample" width="600" height="300" />

<video src="/src/assets/videos/sample.mp4" controls></video>
```

When you build, Vite copies the file into `dist/assets/` and fixes the link for you.
Very small files (under 4 KB) are embedded straight into the HTML.

---

## 7. Interactivity with Alpine.js

Alpine.js works on every page. Here is a counter:

```html
<div x-data="{ count: 0 }">
  <button @click="count--">-</button>
  <span x-text="count">0</span>
  <button @click="count++">+</button>
</div>
```

Learn more at [alpinejs.dev](https://alpinejs.dev).

---

## Cheat sheet

| I want to...          | Write                                                 |
| --------------------- | ----------------------------------------------------- |
| Make a page           | `src/pages/about.html`, wrapped in `<layout>`         |
| Use a layout          | `<layout src="src/layouts/main.html" title="About">`  |
| Mark the content spot | `<!-- @content -->` inside the layout                 |
| Insert a component    | `<load src="src/components/footer.html" />`           |
| Send an argument      | `<load src="..." year="2026" />`                      |
| Read an argument      | `{=$year}`                                            |
| Pass a page value on  | `<load src="..." active="{=$title}" />` in the layout |

## Common mistakes

| Problem                                   | Fix                                                 |
| ----------------------------------------- | --------------------------------------------------- |
| Component doesn't show                    | Close `<load>` with `/>`, not `</load>`             |
| "File not found" error                    | Path starts at the root: `src/...`, not `./src/...` |
| `{=$title}` appears on the page           | Add `title="..."` to the `<layout>` tag             |
| Changed `vite.config.js`, nothing happens | Restart `npm run dev`                               |
| Two `<layout>` tags on one page           | Use only one per page                               |
| New page missing from `dist/`             | Put it in `src/pages/`, not the project root        |
| Layout not found from a page              | Use `src/layouts/...`, not `../layouts/...`         |
