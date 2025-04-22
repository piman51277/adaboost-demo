const nunjucks = require("nunjucks");
const { minify } = require("html-minifier");
const { writeFileSync } = require("fs");

nunjucks.configure("njk");
const output = nunjucks.render("index.html");
writeFileSync(
  "dist/index.html",
  minify(output, {
    collapseWhitespace: true,
    removeComments: true,
  })
);
