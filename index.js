const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const fs = require('fs');

// plugins
// const FunctionDeclaration = require('./src/plugins/FunctionDeclaration');

const code = fs.readFileSync('./examples/simple/AstExplorerExample.jsx', {
  encoding: 'utf8',
});

const ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
const componentFuncBody = [];
let JSXCode = {};

const plugins = {
  FunctionDeclaration(path) {
    const funcName = path.node.id.name;

    const programPath = path.findParent(t.isProgram);
    const exportNode = programPath.node.body.find(
      (code) => code.type === 'ExportDefaultDeclaration'
    );

    if (exportNode.declaration.name !== funcName) {
      return;
    }

    // Remove ReturnStatement from BlockStatement
    const bodyLen = path.node.body.body.length;
    const lastElement = path.node.body.body[bodyLen - 1];

    if (lastElement.type !== 'ReturnStatement') {
      throw SyntaxError(
        'The return statement should be at the end of the function.'
      );
    } else if (lastElement.argument.type !== 'JSXElement') {
      throw SyntaxError(
        'The default exported function should return a JSX element.'
      );
    }

    path.node.body.body.forEach((codeBlock) => {
      if (codeBlock.type === 'ReturnStatement') return;

      componentFuncBody.push(codeBlock);
    });

    JSXCode = lastElement.argument;
  },
};

traverse(ast, plugins);

let out = '<script>\n';

componentFuncBody.forEach((block) => {
  out += '  ' + generate(block, {}).code + '\n\n';
});

out += '</script>\n\n';

out += generate(JSXCode, {}).code;

console.log(out);
fs.writeFileSync(`./out/out${Date.now()}.svelte`, out, { encoding: 'utf8' });
