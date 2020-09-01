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
const toBeCompiledBlock = [];
let JSXCode = {};

const plugins = {
  FunctionDeclaration(exportedComponentPath) {
    const funcName = exportedComponentPath.node.id.name;

    const programPath = exportedComponentPath.findParent(t.isProgram);
    const exportNode = programPath.node.body.find(
      (code) => code.type === 'ExportDefaultDeclaration'
    );

    if (exportNode.declaration.name !== funcName) {
      return;
    }

    // Remove ReturnStatement from BlockStatement
    const funcCodeBlock = exportedComponentPath.node.body.body;
    const blockLen = funcCodeBlock.length;
    const lastElement = funcCodeBlock[blockLen - 1];

    if (lastElement.type !== 'ReturnStatement') {
      throw SyntaxError(
        'The return statement should be at the end of the function.'
      );
    } else if (lastElement.argument.type !== 'JSXElement') {
      throw SyntaxError(
        'The default exported function should return a JSX element.'
      );
    }

    /* 
      Process Function Body (script tags) 
    */

    // process props
    const params = exportedComponentPath.node.params;
    const hasProps = !!params.length;
    console.log('hasProps: ', hasProps);

    const propsObject = params[0];

    // get prop names
    // i. destructured props
    if (hasProps && propsObject.type === 'ObjectPattern') {
      const props = propsObject.properties.map((objProp) => objProp.value.name);

      // add `export let <propName>` statements
      props.forEach((propName) => {
        const identifier = t.identifier(propName);
        const vDeclarator = t.variableDeclarator(identifier);
        const vDeclaration = t.variableDeclaration('let', [vDeclarator]);
        const namedExport = t.exportNamedDeclaration(vDeclaration, [], null);
        toBeCompiledBlock.push(namedExport);
      });

      // TODO: detect and replace prop uses
      // case 1: destructured if it is an object
      // case 2: used to define other variables
      // case 3: nested stuff, prop used inside a callback
      // case 4: what to do if reassigned?

      props.forEach((propName) => {
        // reactive label identifier
        const $ = t.identifier('$'); // label

        // detect if any of the prop is destructured
        // funcCodeBlock.forEach((codeSegment) => {
        //   if (
        //     codeSegment.type === 'VariableDeclaration' &&
        //     codeSegment.declarations[0].id.type === 'ObjectPattern' &&
        //     propName === codeSegment.declarations[0].init.name
        //   ) {
        //     // this props was destructured!
        //     console.log(`prop ${propName} destructured!`);

        //     // Add LabeledStatement

        //     // expressionStatement <-- assignmentExpression <-- operator, left, right
        //     const asnExp = t.assignmentExpression(
        //       '=',
        //       codeSegment.declarations[0].id, // ObjectPattern
        //       codeSegment.declarations[0].init // prop Identifier
        //     );
        //     const exprStmnt = t.expressionStatement(asnExp);
        //     const reactiveLabel = t.labeledStatement($, exprStmnt);
        //     toBeCompiledBlock.push(reactiveLabel);

        //     // Don't add this segment to `toBeCompiledBlock`
        //     codeSegment.isJSX = true;
        //   }
        // });

        // detect if the prop is being used to declare other variable(s)
        funcCodeBlock.forEach((codeSegment, i) => {
          let propUsed = false;
          const codeSegmentPath = exportedComponentPath.get(`body.body.${i}`);

          codeSegmentPath.traverse({
            Identifier(idPath) {
              const idNode = idPath.node;
              if (idNode.name === propName) {
                propUsed = true;
                console.log('prop used: ' + propName);

                // Probable parent types:
                // i. VariableDeclarator
                // ii. ExpressionStatement
                const vDeclarator = idPath.findParent(t.isVariableDeclarator);
                if (vDeclarator && vDeclarator.node.init) {
                  const asnExp = t.assignmentExpression(
                    '=',
                    vDeclarator.node.id, // ObjectPattern
                    vDeclarator.node.init // prop Identifier
                  );
                  const exprStmnt = t.expressionStatement(asnExp);
                  const reactiveLabel = t.labeledStatement($, exprStmnt);
                  toBeCompiledBlock.push(reactiveLabel);
                  codeSegment.isJSX = true;
                  return;
                }
              }
            },
          });
        });
      });
    }

    funcCodeBlock.forEach((codeBlock) => {
      if (codeBlock.type === 'ReturnStatement') return;
      else if (codeBlock.isJSX) return;

      toBeCompiledBlock.push(codeBlock);
    });

    /* 
      HTMLx
    */
    JSXCode = lastElement.argument;
  },
};

traverse(ast, plugins);

let out = '<script>\n';

toBeCompiledBlock.forEach((block) => {
  out += '  ' + generate(block, {}).code + '\n\n';
});

out += '</script>\n\n';

out += generate(JSXCode, {}).code;

// console.log(out);
fs.writeFileSync(`./out/out${Date.now()}.svelte`, out, { encoding: 'utf8' });
