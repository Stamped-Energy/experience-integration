import Module from "node:module";

// tsx compiles client components to CJS, which require()'s .css — stub it.
// ponytail: ceiling = Next/bundler still owns real CSS; unit tests only need import side-effects to no-op
Module._extensions[".css"] = (mod) => {
  mod.exports = {};
};
