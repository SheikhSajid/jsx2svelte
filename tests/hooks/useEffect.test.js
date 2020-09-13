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
});
