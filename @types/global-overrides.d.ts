/**
 * The following two references ensure that dom types defined by TS override
 * the Node types. Was having issues with the return type of `setTimeout()` but
 * figured it would be ideal to override everything regardless. *
 */
/// <reference path="../node_modules/@types/node/globals.d.ts" />
/// <reference path="../node_modules/typescript/lib/lib.dom.d.ts" />
