const { blue, yellow, red } = require('kleur');
const { statSync, existsSync } = require('fs');

exports.trim = function(str) {
	return str.trim().replace(/^\t+/gm, '');
};

exports.isDir = function(str) {
	return existsSync(str) && statSync(str).isDirectory();
};

exports.info = function(text, code) {
	process.stderr.write(blue(' INFO ') + text + '\n');
	code && process.exit(code);
};

exports.warn = function(text, code) {
	process.stdout.write(yellow(' WARN ') + text + '\n');
	code && process.exit(code);
};

exports.error = function(text, code) {
	process.stderr.write(red(' ERROR ') + text + '\n');
	code && process.exit(code);
};