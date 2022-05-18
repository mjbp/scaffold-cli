const { blue, yellow, red } = require('kleur');
const { statSync, existsSync } = require('fs');
const which = require('which');
const spawn = require('cross-spawn-promise');
const npmName = require('npm-name');
const fetch = require('node-fetch');

const hasCommand = function(str) {
	return !!which.sync(str, { nothrow: true });
};

exports.trim = function(str) {
	return str.trim().replace(/^\t+/gm, '');
};

exports.isDir = function(str) {
	return existsSync(str) && statSync(str).isDirectory();
};


exports.info = function(text, code) {
	process.stderr.write( text + '\n');
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

exports.install = function(cwd) {
	// let cmd = isYarn ? 'yarn' : 'npm';
	return spawn('npm', ['install'], { cwd, stdio: 'inherit' });
};

exports.initGit = async function(target) {
	let git = hasCommand('git');
    console.log('has git: ', git);
	if (git) {
		const cwd = target;

		await spawn('git', ['init'], { cwd });
		await spawn('git', ['add', '-A'], { cwd });

		let gitUser, gitEmail;
		const defaultGitUser = 'stormid';
		const defaultGitEmail = 'info@stormid.com';

		try {
			gitEmail = (await spawn('git', ['config', 'user.email'])).toString();
		} catch (e) {
			gitEmail = defaultGitEmail;
		}

		try {
			gitUser = (await spawn('git', ['config', 'user.name'])).toString();
		} catch (e) {
			gitUser = defaultGitUser;
		}

		await spawn('git', ['commit', '-m', 'initial commit'], {
			cwd,
			env: {
				GIT_COMMITTER_NAME: gitUser,
				GIT_COMMITTER_EMAIL: gitEmail,
				GIT_AUTHOR_NAME: defaultGitUser,
				GIT_AUTHOR_EMAIL: defaultGitEmail,
			},
		});
        console.log('initialised git');
	} else {
		warn('Could not locate `git` binary in `$PATH`. Skipping...');
	}
};

exports.npmCheck = (module, version) =>
  new Promise((resolve, reject) => {
    return npmName(module)
      .then(isNoValid => {
        if (isNoValid)
          throw new Error(`Error > Cannot find ${module} in the NPM registry`)

        fetch(`http://registry.npmjs.org/${module}`)
          .then(res => res.json())
          .then(body => {
            return resolve({}.hasOwnProperty.call(body.time, version))
          })
      })
      .catch(err => reject(err.message))
  })