const jsx2svelte = require('../../refactor');
const utils = require('../utils');

describe('calls to useEffect are compiled properly', () => {
  describe('empty array as second argument (onMount)', () => {
    const jsx = `
      import React from 'react';
  
      export default ({ prop }) => {
        useEffect(() => { doSomething(); }, []);
  
        return <div>testing props</div>;
      };
    `;

    const compiledCode = jsx2svelte.compile(jsx);
    test('imports onMount from svelte', () => {
      expect(compiledCode).toContain('import { onMount } from "svelte"');
    });

    test('replaces useEffect with onMount', () => {
      expect(utils.removeWhiteSpace(compiledCode)).toContain(
        utils.removeWhiteSpace('onMount(() => { doSomething(); })')
      );
    });
  });

  describe('non-empty array as second argument or no second argument (afterUpdate)', () => {
    const jsx = `
      import React from 'react';
  
      export default ({ prop }) => {
        useEffect(() => { doSomething(); }, [prop]);
        useEffect(() => { doSomethingElse(); });
  
        return <div>testing afterUpdate</div>;
      };
    `;

    const compiledCode = jsx2svelte.compile(jsx);
    test('imports afterUpdate from svelte', () => {
      expect(compiledCode).toContain('import { afterUpdate } from "svelte"');
    });

    test('non-empty array', () => {
      expect(utils.removeWhiteSpace(compiledCode)).toContain(
        utils.removeWhiteSpace('afterUpdate(() => { doSomething(); })')
      );

      expect(utils.removeWhiteSpace(compiledCode)).not.toContain(
        utils.removeWhiteSpace('useEffect(() => { doSomething(); }, [prop])')
      );
    });

    test.skip('no second argument', () => {
      expect(utils.removeWhiteSpace(compiledCode)).toContain(
        utils.removeWhiteSpace('afterUpdate(() => { doSomethingElse(); })')
      );

      expect(utils.removeWhiteSpace(compiledCode)).not.toContain(
        utils.removeWhiteSpace('useEffect(() => { doSomethingElse(); })')
      );
    });
  });
});
