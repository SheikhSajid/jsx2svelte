const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const fs = require('fs');

const code = fs.readFileSync('./examples/simple/AstExplorerExample.jsx', {
  encoding: 'utf8',
});

const ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });

// * helper functions
function checkIfTargetJSXComponent(functionPath) {
  const funcName = functionPath.node.id.name;

  const programPath = functionPath.findParent(t.isProgram);
  const exportNode = programPath.node.body.find(
    (code) => code.type === 'ExportDefaultDeclaration'
  );

  if (exportNode.declaration.name !== funcName) {
    return false;
  }

  // Remove ReturnStatement from BlockStatement
  const funcCodeBlock = functionPath.node.body.body;
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

  return true;
}

function getComponentBodyPath(path, componentFuncPath) {
  const bodyNodePath = path.findParent(
    (currPath) => currPath.parentPath.parentPath === componentFuncPath
  );

  return bodyNodePath;
}

function getReactiveNodeForIdentifier(
  identifierPath,
  componentFuncPath,
  isSetter
) {
  // propUsed = true;
  const $ = t.identifier('$'); // label

  // Not reactive if passed as initial value to useState
  const callExpr = identifierPath.findParent(t.isCallExpression);
  if (callExpr && callExpr.node.callee.name === 'useState') {
    return { parentToBeReplaced: null, reactiveLabel: null };
  }

  const alreadyReactive = identifierPath.findParent(t.isLabeledStatement);
  if (alreadyReactive) {
    return { parentToBeReplaced: null, reactiveLabel: null };
  }

  const parentFunctionPath = identifierPath.getFunctionParent();
  const isNestedFunction = parentFunctionPath !== componentFuncPath;
  if (isNestedFunction) {
    console.log('inside a function! oh no!');
    return { parentToBeReplaced: null, reactiveLabel: null };
  }

  // TODO: handle conditional rendering
  const isReturn = identifierPath.findParent(t.isReturnStatement);
  if (isReturn) {
    return { parentToBeReplaced: null, reactiveLabel: null };
  }

  let componentBodyPath = getComponentBodyPath(
    identifierPath,
    componentFuncPath
  );

  let reactiveLabel = null;
  const bodyNode = componentBodyPath.node;

  if (bodyNode) {
    if (bodyNode.type === 'VariableDeclaration') {
      const asnExp = t.assignmentExpression(
        '=',
        bodyNode.declarations[0].id,
        bodyNode.declarations[0].init
      );
      const exprStmnt = t.expressionStatement(asnExp);
      reactiveLabel = t.labeledStatement($, exprStmnt);
    } else if (t.isStatement(bodyNode)) {
      reactiveLabel = t.labeledStatement($, bodyNode);
    } else {
      componentBodyPath = null;
    }
  }

  return { parentToBeReplaced: componentBodyPath, reactiveLabel };
}

function getExportNodeForProp(propName) {
  const identifier = t.identifier(propName);
  const vDeclarator = t.variableDeclarator(identifier);
  const vDeclaration = t.variableDeclaration('let', [vDeclarator]);
  const namedExport = t.exportNamedDeclaration(vDeclaration, [], null);

  return namedExport;
}

function getPropNames(funcPath) {
  const params = funcPath.node.params;
  const hasProps = !!params.length;
  const propsObject = params[0];
  let props = [];

  if (!hasProps) {
    return null;
  }

  if (propsObject.type === 'ObjectPattern') {
    props = propsObject.properties.map((objProp) => objProp.value.name);
  }

  return props;
}

function getDeclarationForUseState(idPath) {
  const callExprPath = idPath.parentPath;
  const lVal = callExprPath.container.id;
  let vDeclaration = null;
  let setterFunctionName = null;
  let stateVariableName = null;

  if (lVal.type === 'ArrayPattern') {
    // array destructured form
    stateVariableName = lVal.elements[0].name;
    setterFunctionName = lVal.elements[1].name;

    const argNode = callExprPath.node.arguments[0];

    const vDectr = t.variableDeclarator(
      t.identifier(stateVariableName),
      argNode
    );

    vDeclaration = t.variableDeclaration('let', [vDectr]);
  }

  return { vDeclaration, stateVariableName, setterFunctionName };
}

function getreactiveNodeForSetter(params) {}

// * processing functions
function processProps(idPath, funcPath) {
  const propsNames = getPropNames(funcPath);

  const identifierName = idPath.node.name;
  // console.log('id: ' + identifierName);

  // compile props
  if (propsNames.includes(identifierName)) {
    console.log('prop used: ' + identifierName);
    const { parentToBeReplaced, reactiveLabel } = getReactiveNodeForIdentifier(
      idPath,
      funcPath,
      false
    );

    if (parentToBeReplaced) {
      if (reactiveLabel) parentToBeReplaced.replaceWith(reactiveLabel);
      else {
        parentToBeReplaced.remove();
      }
    }

    return true;
  }

  return false;
}

let useState = 'useState';
const stateVariables = {
  /* setterFunctionName, decNode */
};
const setterFunctions = {};
function processState(idPath, funcPath) {
  // TODO: detect aliases
  const isStateVariable = stateVariables[idPath.node.name] !== undefined;
  if (isStateVariable) {
    let parentDec = idPath.findParent(t.isVariableDeclaration);
    let isStateDeclaration =
      parentDec && stateVariables[idPath.node.name].decNode === parentDec.node;
    if (isStateDeclaration) {
      // Don't replace state declaration. After useState is replaced with VariableDeclaration,
      // it is immediately revisited, we do not want to replace it
      return false;
    }

    const { parentToBeReplaced, reactiveLabel } = getReactiveNodeForIdentifier(
      idPath,
      funcPath,
      false
    );
    if (parentToBeReplaced) parentToBeReplaced.replaceWith(reactiveLabel);
    return true;
  }

  // TODO: setter functions

  if (
    idPath.node.name === useState &&
    idPath.container.type === 'CallExpression'
  ) {
    const {
      vDeclaration,
      stateVariableName,
      setterFunctionName,
    } = getDeclarationForUseState(idPath);

    if (vDeclaration) {
      const bodyNode = getComponentBodyPath(idPath, funcPath);
      bodyNode.replaceWith(vDeclaration);

      stateVariables[stateVariableName] = {
        setterFunctionName,
        decNode: vDeclaration,
      };
      setterFunctions[setterFunctionName] = stateVariableName;
      return true;
    }

    // TODO: non-destructured pattern
  }

  return false;
}

// * main
const scriptNodes = [];
const jsxElements = { mainJSXElementPath: {}, others: {} };
const allJSXReturns = [];

const plugins = {
  FunctionDeclaration(funcPath) {
    // ! might throw exception
    const isExportedJSXComponent = checkIfTargetJSXComponent(funcPath);

    if (!isExportedJSXComponent) {
      return;
    }

    //== prop export statements ==//
    const propsNames = getPropNames(funcPath);

    // * add export statement for each prop
    propsNames.forEach((propName) => {
      scriptNodes.push(getExportNodeForProp(propName));
    });

    //== traverse function body ==//
    funcPath.get('body').traverse({
      Identifier(idPath) {
        const propsProcessed = processProps(idPath, funcPath); // ! Side Effect: modifies AST
        if (propsProcessed) return;

        // ! modifies AST: replace `useState` call with declarations
        // ! Replace state access and setterfunc call with reactive variables
        let useStateReplaced = processState(idPath, funcPath);
        if (useStateReplaced) return;
      },
      // ! Side Effects: changes allJSXReturns, jsxElements
      ReturnStatement(returnPath) {
        const containingFunction = returnPath.getFunctionParent();

        if (returnPath.node.argument.type === 'JSXElement') {
          allJSXReturns.push(returnPath);
          const jsxElement = returnPath.get('argument');
          const containingFunctionName = containingFunction.node.id.name;

          if (containingFunction === funcPath) {
            // main return statement of the component
            jsxElements.mainJSXElementPath = jsxElement;
          } else {
            // function in the body that returns JSX
            others[containingFunctionName] = {
              jsxElement,
              containingFunctionPath: containingFunction,
            };
          }
        } else {
          // ? Identify and remember any variables that store JSX (using Identifier visitor)
          // TODO: 1. Detect if returned Identifier resolves to JSX
          // TODO: 2. Replace the function calls with JSX element
        }
      },
    });

    //== traverse JSX ==//
    // jsxElements.mainJSXElementPath.traverse({
    //   // traverse JSX
    // });

    allJSXReturns.forEach((retPath) => retPath.remove());

    //== push the processed function body for code generation ==//
    funcPath.node.body.body.forEach((bodyNode) => scriptNodes.push(bodyNode));
  },
};

traverse(ast, plugins);

let out = '<script>\n';

scriptNodes.forEach((node) => {
  out += '  ' + generate(node, {}).code + '\n\n';
});

out += '</script>\n\n';

out += generate(jsxElements.mainJSXElementPath.node, {}).code;

// console.log(out);

fs.writeFileSync(`./out/out${Date.now()}.svelte`, out, { encoding: 'utf8' });
