# creative-react

Small sketches built with React, Vite and p5.js.

`main` is the starting point. Each sketch lives on its own branch, so this one stays
generic.

```sh
npm install
npm run dev
```

`npm run build` typechecks before it bundles, so run that before pushing.

## Layout

```
src/
  App.tsx            wires a sketch into the page
  main.tsx           React entry
  styles.css         tailwind import and the theme colours
  p5/
    createSketch.ts  canvas setup, sizing, teardown
    useP5Sketch.ts   keeps a sketch in step with React
  demo/
    flowField.ts     the example sketch, replace this
  components/        whatever the sketch needs, starts with ErrorBoundary
  lib/               hooks that are not p5 specific
```

## How the canvas works

p5 runs in instance mode, so there is no global `p5`. Your sketch is a plain object
with a size and a setup function. Setup draws nothing itself; it returns the function
p5 calls every frame.

The sketch never hardcodes a canvas size. It asks for the size of the element it is
mounted in, so the canvas fills whatever box you put it in and follows the element when
that box changes.

```ts
// src/demo/acme.ts
import type p5 from 'p5';
import type { SketchDefinition } from '../p5/createSketch';

export function acme(readSize: () => { width: number; height: number }): SketchDefinition {
  return {
    readSize,
    setup: (p: p5) => {
      const { width, height } = readSize();
      p.createCanvas(width, height);
      return () => {
        p.background(12, 12, 14);
        p.circle(p.width / 2, p.height / 2, 80);
      };
    },
  };
}
```

`useP5Sketch` mounts it. `useElementSize` measures the element, and the dependency
array asks for another frame whenever that measurement changes:

```tsx
const stage = useElementSize<HTMLDivElement>();
const host = useRef<HTMLDivElement | null>(null);

useP5Sketch(host, acme(() => stage.size), [stage.size.width, stage.size.height]);

return (
  <div ref={stage.ref} className="h-dvh w-screen">
    <div ref={host} className="h-full w-full" />
  </div>
);
```

Four things worth knowing:

- `readSize()` is checked every frame, and `resizeCanvas` runs whenever the answer
  changes. It is what keeps the canvas the same size as its container.
- The dependency array asks for another frame. That is how a control reaches the
  sketch.
- A `resetKey` tears the sketch down and builds it again, for when the thing being
  drawn is replaced rather than adjusted.
- Sketches that hold still can call `p.noLoop()` in setup and `p.redraw()` when
  something changes, instead of painting sixty times a second. There is a note about
  it in `createSketch.ts`.

## Starting a sketch

```sh
git switch -c my-sketch
```

Replace the sketch, point `App.tsx` at it, and delete `demo/` once you have. Add
components under `src/components` as it grows.

## Where it runs

Each branch is built and published to its own directory:

| Branch | URL |
| --- | --- |
| `main` | https://madebyoutside.github.io/creative-react/ |

That is what the workflow does: it builds the branch it is running on and pushes the
result into a `gh-pages` branch, into a folder named after the branch. Sibling folders
are left alone, so the projects do not overwrite each other.

To add a sketch, put its branch in the `branches` list in
`.github/workflows/pages.yml`. It is a list rather than a wildcard because a wildcard
would also fire on `gh-pages` and delete the site.

`vite.config.ts` sets `base: './'` so a build works at the repo root and in a
subdirectory. Leave it relative.
