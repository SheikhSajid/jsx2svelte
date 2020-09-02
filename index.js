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
     * Process Function Body (script tags)
     */

    //== process props ==//
    const params = exportedComponentPath.node.params;
    const hasProps = !!params.length;
    console.log('hasProps: ', hasProps);

    const propsObject = params[0];

    function compileIdToReactive(idPath) {
      propUsed = true;
      const $ = t.identifier('$'); // label
      // Not reactive if passed as initial value to useState
      const callExpr = idPath.findParent(t.isCallExpression);
      if (callExpr && callExpr.node.callee.name === 'useState') {
        return;
      }

      // Probable parent types:
      // i. VariableDeclarator
      const vDeclarator = idPath.findParent(t.isVariableDeclarator);
      if (vDeclarator && vDeclarator.node.init) {
        const asnExp = t.assignmentExpression(
          '=',
          vDeclarator.node.id,
          vDeclarator.node.init
        );
        const exprStmnt = t.expressionStatement(asnExp);
        const reactiveLabel = t.labeledStatement($, exprStmnt);
        // toBeCompiledBlock.push(reactiveLabel);
        // codeSegment.isJSX = true;
        return reactiveLabel;
      }

      // ii. ExpressionStatement
      const exprStmntPath = idPath.findParent(t.isExpressionStatement);

      if (exprStmntPath) {
        const reactiveLabel = t.labeledStatement($, exprStmntPath.node);
        // toBeCompiledBlock.push(reactiveLabel);
        // codeSegment.isJSX = true;
        return reactiveLabel;
      }
    }

    // get prop names
    // * i. destructured props
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
        // detect if the prop is being used to declare other variable(s)
        funcCodeBlock.forEach((codeSegment, i) => {
          let propUsed = false;
          const codeSegmentPath = exportedComponentPath.get(`body.body.${i}`);

          codeSegmentPath.traverse({
            Identifier(idPath) {
              if (idPath.node.name === propName) {
                toBeCompiledBlock.push(compileIdToReactive(idPath));
                codeSegment.isJSX = true;
              }
            },
          });
        });
      });
    }

    // * ii. argument props
    // TODO

    //== process state ==//
    /* 
     * hooks:
     *  i. useState
     *  ii. useReducer
      ? iii. Custom Hooks
      ? iv. aliases
    */

    /*
     * useState
     *  i. array destructured
     *  ii. not destructured
     */
    const useState = 'useState';
    const stateVariableNames = [];
    const setterFunctionNames = [];
    const initialValues = [];

    // TODO: Detect alias (if exists) and set useState

    // * useState
    funcCodeBlock.forEach((codeSegment, i) => {
      const codeSegmentPath = exportedComponentPath.get(`body.body.${i}`);

      codeSegmentPath.traverse({
        Identifier(stateIdPath) {
          if (stateVariableNames.includes(stateIdPath.node.name)) {
            toBeCompiledBlock.push(compileIdToReactive(stateIdPath));
            codeSegment.isJSX = true;
            return;
          } else if (
            stateIdPath.node.name !== useState ||
            stateIdPath.container.type !== 'CallExpression'
          ) {
            return;
          }

          const callExprPath = stateIdPath.parentPath;
          const lVal = callExprPath.container.id;

          if (lVal.type === 'ArrayPattern') {
            // array destructured form
            const stateVariableName = lVal.elements[0].name;
            const setterFunctionName = lVal.elements[1].name;

            const argNode = callExprPath.node.arguments[0];
            // const { value, name } = argNode;
            // const initialValue = value || name;

            stateVariableNames.push(stateVariableName);
            setterFunctionNames.push(setterFunctionName);

            // useStateInstances.push([
            //   stateVariableName,
            //   setterFunctionName,
            //   initialValue,
            // ]);

            const vDectr = t.variableDeclarator(
              t.identifier(stateVariableName),
              argNode
            );
            const vDeclaration = t.variableDeclaration('let', [vDectr]);
            toBeCompiledBlock.push(vDeclaration);
          } else if (lVal.type === 'Identifier') {
            // TODO: not destructured
            const idName = lVal.name;
            stateVariableNames.push(idName + '[0]');
            setterFunctionNames.push(idName + '[1]');
          }

          // TODO: find and convert all reactive uses of state

          console.log('useState use found');
          codeSegment.isJSX = true;
        },
      });
    });

    // include rest of the code in the function body
    funcCodeBlock.forEach((codeBlock) => {
      if (codeBlock.type === 'ReturnStatement') return;
      else if (codeBlock.isJSX) return;

      toBeCompiledBlock.push(codeBlock);
    });

    /*
     * HTMLx
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
