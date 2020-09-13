const jsx2svelte = require('../../refactor');

describe('calls to useCallback are compiled properly', () => {
  const jsx = `
    import React from 'react';

    export default ({ prop }) => {
      const randomCb = useCallback(() => 'hello', [prop]);
      const randomCb2 = useCallback(() => 'hello2', []);
      const randomCb3 = useCallback(() => 'hello3');

      return <div>testing props</div>;
    };
  `;

  const compiledCode = jsx2svelte.compile(jsx);
  test('works with non-empty array as second argument', () => {
    expect(compiledCode).toContain("const randomCb = () => 'hello'");
    expect(compiledCode).not.toContain(
      "const randomCb = useCallback(() => 'hello', [prop])"
    );
  });

  test('works with empty array as second argument', () => {
    expect(compiledCode).toContain("const randomCb2 = () => 'hello2'");
    expect(compiledCode).not.toContain(
      "const randomCb2 = useCallback(() => 'hello2', [])"
    );
  });

  test('works with no second argument', () => {
    expect(compiledCode).toContain("const randomCb3 = () => 'hello3'");
    expect(compiledCode).not.toContain(
      "const randomCb3 = useCallback(() => 'hello3')"
    );
  });
});
