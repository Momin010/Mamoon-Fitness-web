/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                zinc: {
                    950: '#09090b',
                }
            }
        },
    },
    plugins: [
        // Custom scrollbar plugin
        function({ addUtilities }) {
            addUtilities({
                '.scrollbar-thin': {
                    'scrollbar-width': 'thin',
                    '&::-webkit-scrollbar': {
                        width: '6px',
                        height: '6px',
                    },
                },
                '.scrollbar-none': {
                    'scrollbar-width': 'none',
                    '-ms-overflow-style': 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                },
                '.scrollbar-track-transparent': {
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                },
                '.scrollbar-thumb-zinc-700': {
                    '&::-webkit-scrollbar-thumb': {
                        background: '#3f3f46',
                        borderRadius: '9999px',
                    },
                },
                '.scrollbar-thumb-zinc-600': {
                    '&::-webkit-scrollbar-thumb': {
                        background: '#52525b',
                        borderRadius: '9999px',
                    },
                },
                '.scrollbar-thumb-green-500': {
                    '&::-webkit-scrollbar-thumb': {
                        background: '#22c55e',
                        borderRadius: '9999px',
                    },
                },
            })
        }
    ],
}
