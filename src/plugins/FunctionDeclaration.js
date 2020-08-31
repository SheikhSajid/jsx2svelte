const t = require('@babel/types');

module.exports = function (path) {
  const funcName = path.node.id.name;

  const programPath = path.findParent(t.isProgram);
  const exportNode = programPath.node.body.find(
    (code) => code.type === 'ExportDefaultDeclaration'
  );

  if (exportNode.declaration.name !== funcName) {
    return;
  }

  console.log('found exported component: ' + funcName);
};
