const core = require('@actions/core');
const github = require('@actions/github')
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const childExec = require('child_process').exec
const fs = require('fs')

function escapePath(path) {
  return path[0] === "." && path[1] === "/"
            ? path.slice(2)
            : path[0] === "/"
            ? path.slice(1)
            : path
}

let configFile = {}
let appName = ""
let herokuAppName = ""
let herokuEmail = ""
let herokuFormation = "web"

function validateConfigFile(config, currentBranch){
  //Ensure we have apps defined
  if (!config.apps || Object.keys(config.apps).length === 0) {
    throw new Error('Your CI configuration must have apps property defined and at least 1 application')
  }

  //Ensure that app exists
  for(const [key, value] of Object.entries(config.apps)) {
    const appPath = `./apps/${key}`
    const pathExists = fs.existsSync(appPath)
    if (!pathExists) {
      throw new Error(`${appPath} does not exist, please ensure your application does exist`)
    }

    const hasBranches = value.branches !== undefined && Array.isArray(value.branches)
    if (!hasBranches) {
      throw new Error(`Please provide valid branches list for app ${key}`)
    }

    if (value.herokuAppName === undefined) {
      throw new Error(`Please provide a valid herokuAppName for app ${key}`)
    }
  }

  //Get the app that contains the currentBranch
  const row = Object.entries(config.apps)
      .map(([name, value]) => ({ name, branches: value.branches, herokuAppName: value.herokuAppName, formation: value.formation }))
      .find(e => e.branches.includes(currentBranch))

  if (row === undefined) {
    throw new Error(`${currentBranch} is not supported by any application. Please make sure an application has this branch as its target`)
  }

  appName = row.name
  herokuAppName = row.herokuAppName
  if (row.formation) {
    console.log(`Heroku formation was found with value: ${row.formation}`)
    herokuFormation = row.formation
  }
}


async function loadConfigFile(){
  const filePath = core.getInput('ci_config_path')
  console.log("Loading configuration file at path: " + filePath)
  const content = fs.readFileSync(filePath, 'utf-8')
  const json = JSON.parse(content)
  console.log("Ref: " + github.context.ref)
  const branch = String(github.context.ref).replace('refs/heads/', '').trim()
  console.log("Branch: " + branch)
  const { email, name } = github.context.payload['pusher']
  console.log(`Building is being created by ${name} with email ${email}`)

  validateConfigFile(json, branch)
  console.log(`App name is ${appName} located in ./apps/${appName}`)
  configFile = json
  herokuEmail = email
}

async function bootstrap() {
  await loadConfigFile()
  await loginHeroku()
  await buildPushAndDeploy()
}

async function loginHeroku() {
  const password = core.getInput('heroku_api_key')

  try {	
    await exec(`echo ${password} | docker login --username=${herokuEmail} registry.heroku.com --password-stdin`);
    console.log(`[${herokuEmail}] Logged in successfully ✅`);
  } catch (error) {	
    core.setFailed(`Authentication process failed. Error: ${error.message}`);
  }	
}


/** @todo Create this CI in typescript **/
async function buildPushAndDeploy() {
  //Dockerfile path needs to be a directory and by defualt we are giving the filename which is wrong
  const dockerFilePath = core.getInput('dockerfile_path');
  //const buildOptions = core.getInput('options') || '';
  const herokuAction = herokuActionSetUp(herokuAppName);
  const buildOptions = `--build-arg APP_NAME=${appName}`
  const pushOptions = `--arg APP_NAME=${appName}`
  
  try {
    const dockerFileExists = fs.existsSync(dockerFilePath)
    if (!dockerFileExists) {
      throw new Error(`Dockerfile path does not exist, given path = ${dockerFilePath}`)
    }
    //await exec(`cd ${dockerFilePath}`);

    //const { stdout } = await exec(herokuAction('push ' + pushOptions));
    const { stdout } = await childExec(herokuAction(`push ${pushOptions}`))
    core.startGroup('Building docker image.. 🛠')
    stdout.on('data', data => {
      core.debug(data.toString())
    })

    core.endGroup()
    console.log('Container pushed to Heroku Container Registry ⏫');

    await exec(herokuAction('release'));
    console.log('App Deployed successfully 🚀');
    /**
     * @todo Use like this https://github.com/AkhileshNS/heroku-deploy/blob/master/index.js
     * they do check heroku healthcheck and it might be good for us to determinate rollbacks
     */
    /**
     * @todo We need to use cache https://github.com/actions/cache
     * We need to cache docker layers/fragments to prevent a lot of execution time
     */
  } catch (error) {
    core.setFailed(`Something went wrong building your image. Error: ${error.message}`);
  } 
}

/**
 * 
 * @param {string} appName - Heroku App Name
 * @returns {function}
 */
function herokuActionSetUp(appName) {
  /**
   * @typedef {'push' | 'release'} Actions
   * @param {Actions} action - Action to be performed
   * @returns {string}
   */
  return function herokuAction(action) {
    const HEROKU_API_KEY = core.getInput('heroku_api_key');
    const exportKey = `HEROKU_API_KEY=${HEROKU_API_KEY}`;
    const cmd = `${exportKey} heroku container:${action} ${herokuFormation} --app ${appName}`
    console.log(`[Heroku Action] - ${cmd}`)
    return cmd
  }
}


bootstrap()
    .catch((error) => {
      console.log({ message: error.message });
      core.setFailed(error.message);
    })
