const jsx2svelte = require('../index');
const utils = require('./utils');

describe('jsx should be compiled properly', () => {
  describe('variables with jsx values inside component body', () => {
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

  describe('variables with jsx values outside component body', () => {
    const jsx = /* jsx */ `
      import React from 'react';
      
      const jsxVar = <div>Hello</div>
      export default () => {
        return (
          <div>
            {jsxVar}
            <div>Hi again!</div>
          </div>
        );
      };
    `;

    const compiledCode = jsx2svelte.compile(jsx);
    test.skip('variable should be removed', () => {
      expect(compiledCode).not.toContain('jsxVar');
    });

    test('jsx value assigned to the variable should be inlined to the HTMLx code', () => {
      expect(compiledCode).not.toContain('{jsxVar}');
      expect(compiledCode).toContain('<div>Hello</div>');
    });
  });

  describe('jsx value assignments inside conditional/loops should throw', () => {
    describe('jsx inside if statement', () => {
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

      test('if statement inside component function throws', () => {
        expect(() => jsx2svelte.compile(jsx)).toThrow();
      });

      const jsx2 = /* jsx */ `
        import React from 'react';

        if (age > maxAge) {
          allowed = <h3>NOT ALLOWED</h3>;
        } else {
          allowed = <h3>ALLOWED</h3>;
        }
    
        export default ({ age, maxAge }) => {
          let allowed;

          return (
            <div>
              {allowed}
            </div>
          );
        };
      `;

      it('if statement outside component function throws', () => {
        expect(() => jsx2svelte.compile(jsx2)).toThrow();
      });
    });

    describe('jsx inside loop', () => {
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

      it('loop inside component function throws', () => {
        expect(() => jsx2svelte.compile(jsx)).toThrow();
      });

      const jsx2 = /* jsx */ `
        import React from 'react';
    
        for (let i = 0; i <= 100; i++) {
          // throws
          jsxElements.push(<div>{i}</div>);
        }
        
        export default () => {
          let jsxElements = [];
          

  
          return (
            <div>
              {jsxElements}
            </div>
          );
        };
      `;

      it('loop outside component function throws', () => {
        expect(() => jsx2svelte.compile(jsx2)).toThrow();
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

          const msgTag = <p>Older than 5</p>
          const msgTag2 = <p>Younger than 5</p>
  
          return (
            <div>
              {(age > 50) ? <h1>{name}</h1> : <h1>{son}</h1>}
              {(age < 30) && <h1>{son}</h1>}
              
              {(age > 5) ? msgTag : msgTag2}
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

        expect(utils.removeWhiteSpace(compiledCode)).toContain(
          utils.removeWhiteSpace(`
            {#if age > 5}
              <p>Older than 5</p>
            {:else}
              <p>Younger than 5</p>
            {/if}
          `)
        );

        expect(utils.removeWhiteSpace(compiledCode)).not.toContain(
          utils.removeWhiteSpace(`
            (age > 50) ? <h1>{name}</h1> : <h1>{son}</h1>
          `)
        );

        expect(utils.removeWhiteSpace(compiledCode)).not.toContain(
          utils.removeWhiteSpace(`
            (age > 5) ? msgTag : msgTag2
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

  describe('Fragment tag should be removed', () => {
    const jsx = /* jsx */ `
        import React from 'react';
    
        export default () => {
          
          return (
            <Fragment>
              <div>testing fragments</div>
              <div>hello world</div>
            </Fragment>
          );
        };
      `;

    const compiledCode = jsx2svelte.compile(jsx);
    expect(compiledCode).not.toContain('Fragment');
  });
});
