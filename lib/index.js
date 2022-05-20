#!/usr/bin/env node
const sade = require('sade');
const { error } = require('./utils');
const pkg = require('../package');

const ver = process.version;
const min = pkg.engines.node;
if (
	ver
		.substring(1)
		.localeCompare(min.match(/\d+/g).join('.'), 'en', { numeric: true }) === -1
) {
	return error(
		`You are using Node ${ver} but scaffold-cli requires Node ${min}. Please upgrade Node to continue.`,
		1
	);
}

process.on('unhandledRejection', err => {
	error(err.stack || err.message);
});

sade('scaffold [dest]', true)
    .version(pkg.version)
	.describe('Create a new application')
	.option('--name', 'The application name')
	.option('--cwd', 'A directory to use instead of $PWD', '.')
	.option('--install', 'Install dependencies', true)
	.option('-v, --verbose', 'Verbose output')
	.option('--umbraco', 'Include the Umbraco library')
    .action(require('./commands'))
    .parse(process.argv);