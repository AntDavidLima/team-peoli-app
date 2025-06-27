module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{css,js,html,png,gif,jpg,ico,json}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};