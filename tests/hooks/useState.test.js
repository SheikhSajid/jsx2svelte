const jsx2svelte = require('../../index');

describe('calls to useState hooks compiles properly', () => {
  const jsx = /* jsx */ `
    import React, { useState } from 'react';

    export default () => {
      const [state1, setState1] = useState('gears of war 4');
      const [state2, setState2] = useState(null);

      const dependentOnState1 = state1 + 'bla';
      const dependentOnBoth = state1 + 'bla' + state2;
      const anotherVar = 'bla bla';

      return <div>testing useState</div>;
    };
  `;

  const compiledCode = jsx2svelte.compile(jsx);
  test('each call to useState creates a seperate variable declaration', () => {
    expect(compiledCode).toContain("let state1 = 'gears of war 4'");
    expect(compiledCode).toContain('let state2 = null');
  });

  test('calls to useState should be removed', () => {
    expect(compiledCode).not.toContain(
      "const [state1, setState1] = useState('gears of war 4')'"
    );
    expect(compiledCode).not.toContain(
      'const [state2, setState2] = useState(null)'
    );
  });

  test('variables declations that depend on state(s) should be replaced with reactive declarations', () => {
    expect(compiledCode).toContain("$: dependentOnState1 = state1 + 'bla'");
    expect(compiledCode).toContain(
      "$: dependentOnBoth = state1 + 'bla' + state2"
    );

    expect(compiledCode).not.toContain(
      "const dependentOnState1 = state1 + 'bla'"
    );
    expect(compiledCode).not.toContain(
      "const dependentOnBoth = state1 + 'bla' + state2"
    );
  });

  test('variables declations that do not depend on state(s) should be left intact', () => {
    expect(compiledCode).toContain("const anotherVar = 'bla bla'");
    expect(compiledCode).not.toContain("$: anotherVar = 'bla bla'");
  });
});

describe('setter functions returned from useState', () => {
  const jsx = /* jsx */ `
    import React, { useState, Fragment } from 'react';

    export default () => {
      const [state1, setState1] = useState('gears of war 4');
      const [state2, setState2] = useState(null);

      function handleClick(e) {
        setState2('hello');
      }

      return (
        <Fragment>
          <button onClick={handleClick}>set value</button>;
          <button onClick={() => setState1('world')}>set value</button>;
          <button onClick={setState1}>set value</button>;
        </Fragment>
      )
    };
  `;

  const setterDeclaration = `
    function setState1(value) {
      state1 = value;
    }
  `;

  const compiledCode = jsx2svelte.compile(jsx);
  test('calls to setter should be replaced with assignment expression', () => {
    expect(compiledCode).toContain("state2 = 'hello'");
    expect(compiledCode).not.toContain("setState2('hello')");

    expect(compiledCode).toContain("() => state1 = 'world'");
    expect(compiledCode).not.toContain("() => setState1('world')");
  });

  test('a seperate function with the same name as the setter should be declared if references to it are found', () => {
    expect(compiledCode.replace(/\s/g, '')).toContain(
      setterDeclaration.replace(/\s/g, '')
    );
  });
});
