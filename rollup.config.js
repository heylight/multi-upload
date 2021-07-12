import babel from "@rollup/plugin-babel";
import { uglify } from "rollup-plugin-uglify";

export default {
  input: "src/main.js",
  output: {
    exports: "auto",
    file: "lib/multi-upload.min.js",
    format: "umd",
    name: "MultiUpload",
  },
  plugins: [babel({ babelHelpers: "bundled" }), uglify()],
};
