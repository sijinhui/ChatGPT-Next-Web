// noinspection ES6UnusedImports

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