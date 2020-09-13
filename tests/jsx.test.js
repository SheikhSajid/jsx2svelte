const jsx2svelte = require('../refactor');
const utils = require('./utils');

describe('jsx should be compiled properly', () => {
  describe('variables with jsx values assigned to them', () => {
    const jsx = /* jsx */ `
      import React from 'react';
  
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
    test('variable should be removed', () => {
      expect(compiledCode).not.toContain('jsxVar');
    });

    test('jsx value assigned to the variable should be inlined to the HTMLx code', () => {
      expect(compiledCode).not.toContain('{jsxVar}');
      expect(compiledCode).toContain('<div>Hello</div>');
    });
  });

  describe('jsx value assignments inside conditional/loops should throw', () => {
    describe('inside if statement', () => {
      const jsx = /* jsx */ `
        import React from 'react';
    
        export default ({ age, maxAge }) => {
          let allowed;
          
          if (age > maxAge) {
            allowed = <h3>NOT ALLOWED</h3>;
          } else {
            allowed = <h3>ALLOWED</h3>;
          }
  
          return (
            <div>
              {allowed}
            </div>
          );
        };
      `;

      it('should throw', () => {
        expect(() => jsx2svelte.compile(jsx)).toThrow();
      });
    });

    describe('inside loop', () => {
      const jsx = /* jsx */ `
        import React from 'react';
    
        export default () => {
          let jsxElements = [];
          

          for (let i = 0; i <= 100; i++) {
            // throws
            jsxElements.push(<div>{i}</div>);
          }
  
          return (
            <div>
              {jsxElements}
            </div>
          );
        };
      `;

      it('should throw', () => {
        expect(() => jsx2svelte.compile(jsx)).toThrow();
      });
    });
  });

  describe('inline conditionals inside JSX expressions should not throw', () => {
    describe('inline conditionals', () => {
      const jsx = /* jsx */ `
        import React from 'react';
    
        export default ({ age }) => {
          let name = 'Marcus Fenix';
          let son = 'JD Fenix';
  
          return (
            <div>
              {(age > 50) ? <h1>{name}</h1> : <h1>{son}</h1>}
              {(age < 30) && <h1>{son}</h1>}
            </div>
          );
        };
      `;

      it('should not throw', () => {
        expect(() => jsx2svelte.compile(jsx)).not.toThrow();
      });

      const compiledCode = jsx2svelte.compile(jsx);

      it('should compile to HTMLx if-else statement', () => {
        expect(utils.removeWhiteSpace(compiledCode)).toContain(
          utils.removeWhiteSpace(`
            {#if age > 50}
              <h1>{name}</h1>
            {:else}
              <h1>{son}</h1>
            {/if}
          `)
        );

        expect(utils.removeWhiteSpace(compiledCode)).not.toContain(
          utils.removeWhiteSpace(`
            (age > 50) ? <h1>{name}</h1> : <h1>{son}</h1>
          `)
        );
      });

      it('should compile to HTMLx if statement', () => {
        expect(utils.removeWhiteSpace(compiledCode)).toContain(
          utils.removeWhiteSpace(`
            {#if age < 30}
              <h1>{son}</h1>
            {/if}
          `)
        );

        expect(utils.removeWhiteSpace(compiledCode)).not.toContain(
          utils.removeWhiteSpace(`
            (age < 30) && <h1>{son}</h1>
          `)
        );
      });
    });
  });

  describe('lists should compile to HTMLx keyed each blocks', () => {
    const jsx = /* jsx */ `
      import React from 'react';
  
      export default ({ prop }) => {
        useEffect(() => { doSomething(); }, []);
  
        return (
          <div>
            {numbers.map((number) =>
              <li key={number}>{number}</li>
            )}
          </div>
        );
      };
    `;

    const compiledCode = jsx2svelte.compile(jsx);
    it('should have keyed block', () => {
      expect(utils.removeWhiteSpace(compiledCode)).toContain(
        utils.removeWhiteSpace(/* js */ `
          {#each numbers as number (number)}
            <li>{number}</li>
          {/each}
        `)
      );
    });

    it('should remove the jsx .map code', () => {
      expect(utils.removeWhiteSpace(compiledCode)).not.toContain(
        utils.removeWhiteSpace(/* jsx */ `
          {numbers.map((number) =>
            <li key={number}>{number}</li>
          )}
        `)
      );
    });
  });
});
