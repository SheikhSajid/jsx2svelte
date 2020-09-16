const jsx2svelte = require('../refactor');
const utils = require('./utils');

describe('code outside of the component should be included', () => {
  const jsx = /* jsx */ `
      import React from 'react';
      import has from 'lodash/has';

      let dfg;
      export function ufuf() {}
      
      export default () => {
        const jsxVar = <div>Hello</div>
  
        return (
          <div>
            {jsxVar}
            <div>Hi again!</div>
          </div>
        );
      };
    `;

  const compiledCode = jsx2svelte.compile(jsx);

  test('export keyword should be removed from named exports', () => {
    expect(compiledCode).not.toContain('export function ufuf() {}');
    expect(compiledCode).toContain('function ufuf() {}');
  });

  test('import statements should not be removed', () => {
    expect(compiledCode).toContain("import has from 'lodash/has'");
  });

  test('other statements should be copied', () => {
    expect(compiledCode).toContain('let dfg');
  });
});
