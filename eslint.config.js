const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
            "semi": ["error", "always"],
            "quotes": ["error", "double"]
        },
        languageOptions: {
            globals: {
                // Node.js globals
                console: "readonly",
                process: "readonly",
                __dirname: "readonly",
                require: "readonly",
                module: "readonly",
                exports: "readonly",
                // Common browser globals (used in Puppeteer/frontend)
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                fetch: "readonly",
                window: "readonly",
                document: "readonly",
                URLSearchParams: "readonly",
                // Jest globals
                describe: "readonly",
                test: "readonly",
                expect: "readonly",
                it: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
                jest: "readonly"
            }
        }
    }
];
