const jsx2svelte = require('../../refactor');
const utils = require('../utils');

describe('calls to useEffect are compiled properly', () => {
  describe.skip('first argument is a reference to a function', () => {
    const jsx = /* jsx */ `
      import React from 'react';
      const didMount = () => { doSomething(); }
  
      export default ({ prop }) => {
        const didMount2 = () => { doSomething(); }
        useEffect(didMount, []);
        useEffect(didMount2, []);
  
        return <div>testing useEffect</div>;
      };
    `;

    it('should not throw', () => {
      expect(() => jsx2svelte.compile(jsx)).not.toThrow();
    });

    const compiledCode = jsx2svelte.compile(jsx);
    it('should compiles properly', () => {
      expect(utils.removeWhiteSpace(compiledCode)).toContain(
        utils.removeWhiteSpace('const didMount = () => { doSomething(); }')
      );
      expect(utils.removeWhiteSpace(compiledCode)).toContain(
        utils.removeWhiteSpace('onMount(didMount)')
      );
      expect(utils.removeWhiteSpace(compiledCode)).toContain(
        utils.removeWhiteSpace('const didMount2 = () => { doSomething(); }')
      );
      expect(utils.removeWhiteSpace(compiledCode)).toContain(
        utils.removeWhiteSpace('onMount(didMount2)')
      );
      expect(compiledCode).not.toContain(/useEffect\(.*\)/gi);
    });
  });

  describe('empty array as second argument (onMount)', () => {
    const jsx = /* jsx */ `
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

      expect(compiledCode).not.toContain(/useEffect\(.*\)/gi);
    });
  });

  describe('non-empty array as second argument or no second argument (afterUpdate)', () => {
    const jsx = /* jsx */ `
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
    describe('functional expression return values', () => {
      const jsx = /* jsx */ `
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

    describe.skip('non-functional return values', () => {
      const jsx = /* jsx */ `
        import React from 'react';
    
        export default () => {
          useEffect(() => 'non functional primitive val');
          return <div>testing invalid callback return type</div>;
        };
      `;

      it('primitive value should throw', () => {
        expect(() => jsx2svelte.compile(jsx)).toThrow();
      });

      const jsx2 = /* jsx */ `
        import React from 'react';
        const func = () => cleanup();
    
        export default () => {
          useEffect(() => func);
          return <div>testing non-functional return values</div>;
        };
      `;

      it('reference to function should not throw', () => {
        expect(() => jsx2svelte.compile(jsx2)).not.toThrow();
      });

      const compiledCode = jsx2svelte.compile(jsx2);

      it('replaces call to useEffect with onDestroy', () => {
        expect(compiledCode).toContain('onDestroy(func)');
        expect(compiledCode).not.toContain(/useEffect\(.*\)/gi);
        expect(compiledCode).toContain(/cleanup\(\)/gi);
      });

      const jsx3 = /* jsx */ `
        import React from 'react';
        const val = 5;
    
        export default () => {
          useEffect(() => val);
          return <div>testing non-functional return values</div>;
        };
      `;

      it('reference to primitive value should throw', () => {
        expect(() => jsx2svelte.compile(jsx3)).toThrow();
      });
    });
  });
});
