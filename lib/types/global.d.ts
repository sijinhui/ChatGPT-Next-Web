// noinspection ES6UnusedImports

// eslint-disable-next-line unused-imports/no-unused-imports
import React from 'react';

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "my-element": {
                myElementProps: string;
            };
        }
    }
}