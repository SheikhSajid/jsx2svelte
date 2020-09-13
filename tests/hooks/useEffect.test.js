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
    });

    test.skip('no second argument', () => {
      expect(utils.removeWhiteSpace(compiledCode)).toContain(
        utils.removeWhiteSpace('afterUpdate(() => { doSomethingElse(); })')
      );
    });

    test.skip('useEffect should be removed', () => {
      expect(compiledCode).not.toContain('useEffect');
    });
  });

  describe('useEffect callbacks with return values (onDestroy)', () => {
    const jsx = `
      import React from 'react';
  
      export default ({ prop }) => {
        useEffect(() => { work(); return () => cleanup() }, [prop]);
        useEffect(() => { mountWork(); return () => moreCleanup() }, []);
        useEffect(() => () => extremelyClean());
        
        // empty callback bodies
        useEffect(() => { return () => cleanup() }, [prop]);
        useEffect(() => { return () => moreCleanup() }, []);

  
        return <div>testing afterUpdate</div>;
      };
    `;

    const compiledCode = jsx2svelte.compile(jsx);
    test('imports afterUpdate from svelte', () => {
      expect(compiledCode).toContain(
        'import { onDestroy, afterUpdate, onMount } from "svelte"'
      );
    });

    const codeWithoutSpace = utils.removeWhiteSpace(compiledCode);
    test('non-empty array, with return statement', () => {
      expect(codeWithoutSpace).toContain(
        utils.removeWhiteSpace('onDestroy(() => cleanup())')
      );

      expect(codeWithoutSpace).toContain(
        utils.removeWhiteSpace('afterUpdate(() => { work(); })')
      );
    });

    test('empty array, with return statement', () => {
      expect(codeWithoutSpace).toContain(
        utils.removeWhiteSpace('onDestroy(() => moreCleanup())')
      );
      expect(codeWithoutSpace).toContain(
        utils.removeWhiteSpace('onMount(() => { mountWork(); })')
      );
    });

    test('no array, no body', () => {
      expect(codeWithoutSpace).toContain(
        utils.removeWhiteSpace('onDestroy(() => extremelyClean())')
      );
    });

    test.skip('lifecycle calls should not have no-op callbacks', () => {
      expect(codeWithoutSpace).not.toContain(
        utils.removeWhiteSpace('afterUpdate(() => {})')
      );
      expect(codeWithoutSpace).not.toContain(
        utils.removeWhiteSpace('onDestroy(() => {})')
      );
      expect(codeWithoutSpace).not.toContain(
        utils.removeWhiteSpace('onMount(() => {})')
      );
    });

    test('the call to useEffect should be removed', () => {
      expect(compiledCode).not.toContain('useEffect');
    });
  });
});
