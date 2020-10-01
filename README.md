# jsx2svelte

jsx2svelte is a Compiler that compiles React JSX components to svelte components.

[Web Demo](https://sheikhsajid.github.io/react2svelte-visualizer/index.html)

[Web Demo Repo](https://github.com/SheikhSajid/react2svelte-visualizer)

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
