import autoprefixer from "autoprefixer"
import postcss from "rollup-plugin-postcss"

import cssnano from "cssnano"
import typescript from "rollup-plugin-typescript2"
// import copy from "rollup-plugin-copy"
import path from "path"
import json from "@rollup/plugin-json"
import del from "rollup-plugin-delete"
import replace from "@rollup/plugin-replace"
import dts from "rollup-plugin-dts"
import { nodeResolve } from "@rollup/plugin-node-resolve"
// import { terser } from "rollup-plugin-terser"
import commonjs from "@rollup/plugin-commonjs"

const clientExternal = [
  "react",
  "react-dom",
  // "@codesandbox/sandpack-client",
  // "use-spring",
  // "diff",
]
const remarkExternal = [
  "react",
  "node-fetch",
  "is-plain-obj",
  "unified",
  "remark-rehype",
  "hast-util-to-estree",
  "unist-util-visit-parents",
  "unist-util-visit",
]

export default function makeConfig(commandOptions) {
  return [
    {
      input: "src/index.scss",
      output: {
        file: "dist/index.css",
        format: "es",
      },
      plugins: [
        del({ targets: "dist/*" }),
        postcss({
          extract: path.resolve("dist/index.css"),
          plugins: [autoprefixer(), cssnano()],
        }),
      ],
      onwarn(warning, warn) {
        if (warning.code === "FILE_NAME_CONFLICT") return
        warn(warning)
      },
    },
    {
      input: `src/index.tsx`,
      output: [
        {
          file: `./dist/index.esm.mjs`,
          format: "es",
        },
        {
          file: `./dist/index.cjs.js`,
          format: "cjs",
        },
      ],
      external: [...remarkExternal, "shiki"],
      plugins: [
        json({ compact: true }),
        typescript({
          tsconfigOverride: {
            compilerOptions: { jsx: "react" },
          },
        }),
      ],
    },
    {
      input: `src/index.tsx`,
      output: [{ file: `./dist/index.d.ts`, format: "es" }],
      external: [...remarkExternal, "shiki"],
      plugins: [dts()],
    },
    // for the browser esm we need to replace shiki with shiki/dist/index.browser.mjs
    // https://github.com/shikijs/shiki/issues/131#issuecomment-1094281851
    {
      input: `src/index.tsx`,
      output: [
        {
          file: `./dist/index.browser.mjs`,
          format: "es",
        },
      ],
      external: remarkExternal,
      plugins: [
        replace({
          delimiters: ["", ""],
          preventAssignment: true,
          values: {
            'from "shiki"':
              'from "shiki/dist/index.browser.mjs"',
          },
        }),
        json({ compact: true }),
        typescript({
          tsconfigOverride: {
            compilerOptions: { jsx: "react" },
          },
        }),
        // terser(),
      ],
    },
    {
      input: `src/components.tsx`,
      output: [
        {
          file: `./dist/components.cjs.js`,
          format: "cjs",
        },
        {
          file: `./dist/components.esm.mjs`,
          format: "es",
        },
      ],
      external: clientExternal,
      plugins: [
        nodeResolve(),
        commonjs(),
        json({ compact: true }),
        typescript({
          tsconfigOverride: {
            compilerOptions: { jsx: "react" },
          },
        }),
      ],
    },
    {
      input: `src/components.tsx`,
      output: [
        { file: `./dist/components.d.ts`, format: "es" },
      ],
      external: clientExternal,
      plugins: [dts()],
    },
  ]
}