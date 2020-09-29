#! /usr/bin/env node

const fs = require("fs");
const path = require("path");
const MarkdownIt = require("markdown-it")();

const __CWD = process.cwd();

const args = process.argv.slice(2);

if (args.length < 3) {
  throw new Error(
    "Not enough command line options.  Arguments must include source, destination, and templates folders in that order"
  );
}

const [source, destination, templates] = args;
const sourceDir = path.resolve(__CWD, source);
const destinationDir = path.resolve(__CWD, destination);
const templatesDir = path.resolve(__CWD, templates);

// get file list
const filesToRender = fs.readdirSync(sourceDir);
console.log("Files to render:", filesToRender);

// Make sure destination folder exists
if (!fs.existsSync(destination)) {
  fs.mkdirSync(destination);
}

function makeItem(dir, item) {
  const file = item;
  const slug = item.split(".md").join("");
  const itemPath = path.resolve(dir, item);
  const itemContent = fs.readFileSync(itemPath, "utf8");

  return {
    file,
    slug,
    itemPath,
    itemContent,
  };
}

function renderItem(itemContent) {
  return MarkdownIt.render(itemContent);
}

function writeItem(content, slug, destinationPath) {
  const newFile = slug + ".html";
  fs.writeFileSync(path.resolve(destinationPath, newFile), content);
}

async function applyTemplate(content) {
  const renderFunction = await require(path.resolve(templates, "site.js"));
  return await renderFunction(content);
}

filesToRender.forEach(async (file) => {
  // would be nice to have the pipeline operator :D
  const item = makeItem(sourceDir, file);
  const rendered = renderItem(item.itemContent);
  const renderedWithTemplate = await applyTemplate(rendered);
  writeItem(renderedWithTemplate, item.slug, destinationDir);
});
