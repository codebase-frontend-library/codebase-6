# codebase-6

Version 6.0.0
Filesize: 31 kb
Docs: https://codebase-frontend-library.github.io/codebase-6/

Codebase 6 is a _non-backwards compatible_ update for the Codebase project.

* Based on side-project [Baselayer 3](https://github.com/SimonPadbury/baselayer-3), but without dark theme capability, using media queries not container queries, and reverting to some “traditional” styles.
* CSS variables are more similar to [Codebase 5](https://github.com/codebase-frontend-library/codebase-5).
* Stylesheet is much smaller than Codebase 5, less than one third size.
* No Sass pre-processor required. Just modern CSS, partials combined by PostCSS, and minified by CSSNANO.
* Built using the static site generator [minjucks](https://github.com/SimonPadbury/minjucks).
  * `yarn istall` will brings in all the `node_modules/` required.
  * `yarn dev` for development with Browser-Sync.
  * `yarn clean` empties the `docs/` folder.
  * `yarn build` just builds.