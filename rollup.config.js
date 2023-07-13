const babel = require("rollup-plugin-babel");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const proxyDirectories = require("rollup-plugin-proxy-directories");
const { terser } = require("rollup-plugin-terser");

const pkg = require("./package.json");

const extensions = [".js", ".jsx", ".json"];

const makeExternalPredicate = externalArr => {
  if (!externalArr.length) {
    return () => false;
  }
  const pattern = new RegExp(`^(${externalArr.join("|")})($|/)`);
  return id => pattern.test(id);
};

const getExternal = (umd, pkg) => {
  const external = [...Object.keys(pkg.peerDependencies), "prop-types"];
  const allExternal = [...external, ...Object.keys(pkg.dependencies)];
  return makeExternalPredicate(umd ? external : allExternal);
};

const commonPlugins = [
  babel({
    extensions,
    exclude: ["node_modules/**"]
  }),
  resolve({ extensions, preferBuiltins: false })
];

const getPlugins = umd =>
  umd
    ? [
        ...commonPlugins,
        commonjs({
          include: /node_modules/
        }),
        terser()
      ]
    : commonPlugins;

const getOutput = (umd, pkg) =>
  umd
    ? {
        name: "ReactPaymentInputs",
        file: pkg.unpkg,
        format: "umd",
        exports: "named",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "prop-types": "PropTypes"
        }
      }
    : [
        {
          file: pkg.main,
          format: "cjs",
          exports: "named"
        },
        {
          file: pkg.module,
          format: "es"
        }
      ];

const createConfig = ({ umd, pkg, plugins = [], ...config }) => ({
  external: getExternal(umd, pkg),
  plugins: [...getPlugins(umd), ...plugins],
  output: getOutput(umd, pkg),
  ...config
});

export default [
  createConfig({
    pkg,
    input: [],
    output: [
      {
        format: "es",
        dir: "es"
      },
      {
        format: "cjs",
        dir: "lib",
        exports: "named"
      }
    ],
    plugins: [proxyDirectories()]
  }),
  createConfig({ pkg, input: "src/index.js", umd: true })
];
