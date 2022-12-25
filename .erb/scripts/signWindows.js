require('dotenv').config();
const childProcess = require('child_process');
const path = require('path');

exports.default = function sign(configuration) {
    const USER_NAME = process.env.SSL_USERNAME;
    const USER_PASSWORD = process.env.SSL_PASSWORD;
    const USER_TOTP = process.env.SSL_TOTP_SECRET;

    if (USER_NAME && USER_PASSWORD && USER_TOTP) {
        console.log(`Signing ${configuration.path}`);
        const { base, dir } = path.parse(configuration.path);

        const createTmpDir = `mkdir -p tmp`;
        const signFile = `cd 3rdparty/CodeSignTool && sh CodeSignTool.sh sign -input_file_path="${configuration.path}" -output_dir_path="../../tmp" -username="${USER_NAME}" -password="${USER_PASSWORD}" -totp_secret="${USER_TOTP}"`;
        const moveFile = `cd ../.. && mv "${path.join('tmp', base)}" "${dir}" && rm -rf tmp`;
        childProcess.execSync(`${createTmpDir} && ${signFile} && ${moveFile}`, { stdio: 'inherit' });
    } else {
        console.warn(`sign.js - Can't sign file ${configuration.path}, missing value for:
${USER_NAME ? '' : 'SSL_USERNAME'}
${USER_PASSWORD ? '' : 'SSL_PASSWORD'}
${USER_TOTP ? '' : 'SSL_TOTP_SECRET'}
`);
    }
}
