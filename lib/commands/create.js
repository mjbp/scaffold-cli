const { info, warn, error, isDir, trim } = require('../utils');
const { green } = require('kleur');
const { resolve, join } = require('path');
const ora = require('ora');
const gittar = require('gittar');
const fs = require('fs-extra');
const isValidName = require('validate-npm-package-name');
const RGX = /\.(woff2?|ttf|eot|jpe?g|ico|png|gif|webp|mp4|mov|ogg|webm)(\?.*)?$/i;
const isMedia = str => RGX.test(str);
const REPO = 'mjbp/scaffold';

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
    
    let spinner = ora({
		text: 'Creating project',
		color: 'green',
    }).start();
    

	await gittar.extract(archive, target, {
		filter(path, obj) {
			if (!path.includes('.git')) return true;
		},
    });
    
    spinner.text = 'Parsing `package.json` file';

    let pkgData,
		pkgFile = resolve(target, 'package.json');

	if (pkgFile) {
		pkgData = JSON.parse(await fs.readFile(pkgFile));
		spinner.text = 'Updating `name` within `package.json` file';
        pkgData.name = argv.name.toLowerCase().replace(/\s+/g, '_');
        pkgData.description = "";
        pkgData.version = "0.1.0";
        await fs.writeFile(pkgFile, JSON.stringify(pkgData, null, 2));
	} else {
		warn('Could not locate `package.json` file');
	}

    // if (argv.install) {
	// 	spinner.text = 'Installing dependencies:\n';
	// 	spinner.stopAndPersist();
	// 	await install(target, isYarn);
	// }

	spinner.succeed('All done\n');
    info(trim(`
        To get started, cd into the new directory:
            ${green('cd ' + dest)}
        To start a development live-reload server:
            ${green('npm start')}
        To create a production build (in ./build):
            ${green('npm build')}
    `) + '\n');
	// if (argv.git) {
	// 	await initGit(target);
	// }

	return true
};
