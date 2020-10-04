const jsx2svelte = require('../../index');
const utils = require('../utils');

describe('destructured props are compiled properly', () => {
  const jsx = /* jsx */ `
    import React from 'react';

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

describe('non-destructured props are compiled properly', () => {
  const jsx = /* jsx */ `
    import React from 'react';

    export default (props) => {
      const { comment, date } = props;
      const title = \`Title: \$\{comment\}\`;

      const randomVar = 'hello';
      const randomVar2 = 'hello' + props.comment;

      return <div>testing props {props}</div>;
    };
  `;

  const compiledCode = jsx2svelte.compile(jsx);
  test('an export statement is added for each prop', () => {
    expect(compiledCode).toContain('export let comment');
    expect(compiledCode).toContain('export let date');
  });

  test('prop container object should not have an export statement', () => {
    expect(compiledCode).not.toContain('export let props');
    expect(compiledCode).not.toContain('export let $$props');
  });

  test('variables declations that depend on prop(s) should be compiled to reactive declarations', () => {
    expect(compiledCode).toContain('$: title = `Title: ${comment}`');
    expect(compiledCode).toContain("$: randomVar2 = 'hello' + $$props.comment");
    expect(compiledCode).toContain('<div>testing props {$$props}</div>');
    expect(utils.removeWhiteSpace(compiledCode)).toContain(
      utils.removeWhiteSpace('$: ({ comment, date } = $$props)')
    );
  });

  test('variables declations that do not depend on prop(s) should be left intact', () => {
    expect(compiledCode).toContain("const randomVar = 'hello'");
  });
});

describe('no prop parameters', () => {
  const jsx = /* jsx */ `
    import React from 'react';

    export default () => {
      const randomVar = 'hello';

      return <div>no prop params</div>;
    };
  `;

  expect(() => jsx2svelte.compile(jsx)).not.toThrow();
});
