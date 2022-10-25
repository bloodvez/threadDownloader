import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default  {
    entry: './dist/index.js',
    output: {
        path: path.resolve(__dirname, './packed'),
        filename: 'threadDownloader.cjs',
    },
    experiments: {
        outputModule: true,
    },
    plugins: [
       //empty pluggins array
    ],
    module: {
         // https://webpack.js.org/loaders/babel-loader/#root
        rules: [
            {
                test: /.m?js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            }
        ],
    },
    mode:'production'
}
