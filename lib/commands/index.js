const { info, warn, error, isDir, install, initGit, npmCheck } = require('../utils');
const { resolve } = require('path');
const figlet = require('figlet');
const gittar = require('gittar');
const fs = require('fs-extra');
const Table = require('cli-table');
const isValidName = require('validate-npm-package-name');
const REPO = 'stormid/scaffold';
const UMBRACO_LIBRARY = '@stormid/umbraco-library';

module.exports = async function(dest, argv) {
    if (!dest) {
        warn('You must specify a directory');
        return;
    }

    let cwd = resolve(argv.cwd);
	let target = resolve(cwd, dest);
    let exists = isDir(target);
    
    if (exists) {
		return error(
			`Refusing to overwrite directory. Please specify a different destination or the delete "${dest}" first`,
			1
		);
    }
    
    argv.name = argv.name || dest;

    let { errors } = isValidName(argv.name);
	if (errors) {
		errors.unshift(`Invalid package name: ${argv.name}`);
		return error(errors.map(capitalize).join('\n  ~ '), 1);
    }
    
    let archive = await gittar.fetch(REPO).catch(err => {
		err = err || { message: 'An error occured while fetching the scaffold from Github' };
		return error(
			err.code === 404
				? `Could not find repository: ${repo}`
				: (argv.verbose && err.stack) || err.message,
			1
		);
    });

    if (argv['umbraco']) {
        if (argv['umbraco'] === true) info(`-> Adding Umbraco Library`);
        else {
            const packageExists = await npmCheck('@stormid/umbraco-library', argv['umbraco']);
            if (packageExists) info(`-> Adding Umbraco Library version ${argv['umbraco']}`);
            else {
                return error(`-> Cannot find Umbraco Library version '${argv['umbraco']}'`);
            }
        }
    }
    
    info('-> Creating project');

	await gittar.extract(archive, target, {
		filter(path, obj) {
			if (!path.includes('.git') || path.includes('.gitignore')) return true;
		},
    });

    await fs.mkdir(`${target}/src/assets`);

    let pkgData,
		pkgFile = resolve(target, 'package.json');

	if (pkgFile) {
		pkgData = JSON.parse(await fs.readFile(pkgFile));
        pkgData.name = argv.name.toLowerCase().replace(/\s+/g, '_');
        pkgData.description = "";
        pkgData.version = "0.1.0";
        if (argv['umbraco']) pkgData.dependencies = Object.assign({}, pkgData.dependencies, { UMBRACO_LIBRARY: argv['umbraco'] === true ? "latest" : argv['umbraco'] });
        await fs.writeFile(pkgFile, JSON.stringify(pkgData, null, 2));
	} else {
		warn('Could not locate `package.json` file');
	}

    if (argv.install) {
        info('-> Installing dependencies');
		await install(target);
    }

    if (argv['umbraco']) {
        try {
            fs.copySync(`${target}/node_modules/${UMBRACO_LIBRARY}/src/css/import-template/index.scss`, `${target}/src/css/index.scss`);
        } catch(err){
            warn(err);
        }
    }
    
	// await initGit(target);

    process.stderr.write('\n');
    info(figlet.textSync('StormID'));
    process.stderr.write('\n');
    info(`All done. To get started, cd into ${dest}\n`);

    const table = new Table({
        head: ['Command', 'Description']
    });
    
    table.push(
	['npm start', 'alias for npm run dev'],
        ['npm run dev', 'start dev server with live reloading'],
        ['npm run build', 'write static site to disk'],
        ['npm run ci', 'write assets to disk in production/ci'],
        ['npm run watch-dev', 'watch and write assets to disk in production'],
        ['npm run storybook', 'start Storybook'],
        ['npm t', 'run tests']
    );

    info(table.toString());

	process.exit(1);
};
