import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import analyze from 'rollup-plugin-analyzer';
import replace from '@rollup/plugin-replace';
import babel from 'rollup-plugin-babel';

const production = process.env.BUILD === 'production';

export default [
    {
        input: [
            'src/pb-components-bundle.js',
            'src/pb-leaflet-map.js',
            'src/pb-odd-editor.js',
            'src/pb-edit-app.js'
        ],
        output: {
            dir: 'dist',
            format: 'es',
            sourcemap: !production
        },
        plugins: [
            replace({
                'process.env.NODE_ENV': JSON.stringify('production')
            }),
            babel(),
            resolve(),
            production && terser({
                compress: {
                    reduce_vars: false
                }
            }),
            analyze({
                summaryOnly: true
            }),
            copy({
                targets: [
                    {
                        src: './node_modules/leaflet/dist/leaflet.css',
                        dest: './css/leaflet'
                    },
                    {
                        src: './node_modules/leaflet/dist/images/*',
                        dest: './images/leaflet'
                    },
                    {
                        src: './node_modules/openseadragon/build/openseadragon/openseadragon.min.js',
                        dest: './lib'
                    },
                    {
                        src: './node_modules/openseadragon/build/openseadragon/images/*',
                        dest: './images/openseadragon'
                    },
                    {
                        src: './node_modules/prismjs/themes/*',
                        dest: './css/prismjs'
                    }
                ]
            })
        ]
    },
    {
        input: 'src/docs/pb-component-docs.js',
        output: {
            file: 'dist/pb-component-docs.js',
            format: 'es',
            sourcemap: !production
        },
        plugins: [
            resolve(),
            production && terser({
                compress: {
                    reduce_vars: false
                }
            }),
            copy({
                targets: [
                    {
                        src: ['demo/*.html', '!**/pb-odd-editor.html', '!**/pb-leaflet-map.html'],
                        dest: 'dist/demo',
                        transform: (contents) =>
                            contents.toString().replace(/<!--scripts-->.*\/scripts-->/sg, '<script type="module" src="../pb-components-bundle.js"></script>')
                    },
                    {
                        src: 'demo/pb-odd-editor.html',
                        dest: 'dist/demo',
                        transform: (contents) =>
                            contents.toString().replace(/<!--scripts-->.*\/scripts-->/sg, '<script type="module" src="../pb-components-bundle.js"></script><script type="module" src="../pb-odd-editor.js"></script>')
                    },
                    {
                        src: 'demo/pb-leaflet-map.html',
                        dest: 'dist/demo',
                        transform: (contents) =>
                            contents.toString().replace(/<!--scripts-->.*\/scripts-->/sg, '<script type="module" src="../pb-components-bundle.js"></script><script type="module" src="../pb-leaflet-map.js"></script>')
                    },
                    {
                        src: 'api.html',
                        dest: 'dist',
                        transform: (contents) =>
                            contents.toString().replace(/<!--scripts-->.*\/scripts-->/sg, '<script type="module" src="pb-component-docs.js"></script>')
                    },
                    {
                        src: ['demo/*.json', 'demo/*.css'],
                        dest: 'dist/demo'
                    },
                    {
                        src: 'pb-elements.json',
                        dest: 'dist'
                    },
                    {
                        src: ['images/*.png', 'images/*.ico', 'images/*.svg'],
                        dest: 'dist/images'
                    }
                ]
            })
        ]
    },
    {
        input: 'src/pb-components-all.js',
        output: {
            file: 'dist/pb-components-all.js',
            format: 'iife',
            sourcemap: !production
        },
        plugins: [
            resolve(),
            production && terser()
        ]
    }
]