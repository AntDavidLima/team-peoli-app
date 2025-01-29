const colors = require("./tailwind.colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./app/**/*.tsx", "./components/**/*.tsx"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors,
		},
	},
	plugins: [],
};
