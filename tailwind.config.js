const colors = require("./tailwind.colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./app/**/*.tsx", "./components/**/*.tsx"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors,
			fontFamily: {
				sans: ["Inter-Regular", "system-ui" , "sans-serif"],
				'inter-bold': ["Inter-Bold", "sans-serif"],
			},
		},
	},
	plugins: [],
};
