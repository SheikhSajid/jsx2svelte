const jsx2svelte = require('../../refactor');

describe('destructured props are compiled properly', () => {
  const jsx = `
    import React, { useState } from 'react';

    export default ({ comment, date }) => {
      const title = \`Title: \$\{comment\}\`;

      const randomVar = 'hello';

      return <div>testing props</div>;
    };
  `;

  const compiledCode = jsx2svelte.compile(jsx);
  test('an export statement is added for each prop', () => {
    expect(compiledCode).toContain('export let comment');
    expect(compiledCode).toContain('export let date');
  });

  test('variables declations that depend on prop(s) should be compiled to reactive declarations', () => {
    expect(compiledCode).toContain('$: title = `Title: ${comment}`');
  });

  test('variables declations that do not depend on prop(s) should be left intact', () => {
    expect(compiledCode).toContain("const randomVar = 'hello'");
  });
});
