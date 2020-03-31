import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import analyze from 'rollup-plugin-analyzer';
import replace from '@rollup/plugin-replace';

const production = process.env.BUILD === 'production';

export default [
    {
        input: 'node_modules/tippy.js/dist/tippy.esm.js',
        output: {
            dir: 'lib',
            format: 'es',
            sourcemap: false
        },
        plugins: [
            resolve(),
            replace({
                'process.env.NODE_ENV': JSON.stringify('production')
            })
        ]
    },
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
            resolve(),
            production && terser(),
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
        input: '@polymer/iron-component-page/iron-component-page.js',
        output: {
            file: 'dist/iron-component-page.js',
            format: 'es',
            sourcemap: !production
        },
        plugins: [
            resolve(),
            production && terser()
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