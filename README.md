# jsx2svelte

jsx2svelte is a Compiler that compiles React JSX components to svelte components.

Uses [@babel/parser](https://babeljs.io/docs/en/babel-parser), [@babel/traverse](https://babeljs.io/docs/en/babel-traverse) and [@babel/generator](https://babeljs.io/docs/en/babel-generator) to parse, traverse JSX ASTs and generate code.

## Installation

`npm i jsx2svelte --save`

## Usage

```
import { compile } from 'jsx2svelte'

const jsxCode = `
  import React from 'react';

  export default ({ prop }) => {
    useEffect(() => { doSomething(); }, []);

    return <div>testing props</div>;
  };
`

const svelteCode = compile(jsxCode)
```
