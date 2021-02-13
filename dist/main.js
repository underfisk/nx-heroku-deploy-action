"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const heroku_action_1 = require("./heroku-action");
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
let appName = '';
let herokuAppName = '';
let herokuEmail = '';
let herokuFormation = 'web';
function validateConfigFile(config, currentBranch) {
    //Ensure we have apps defined
    if (!config.apps || Object.keys(config.apps).length === 0) {
        throw new Error('Your CI configuration must have apps property defined and at least 1 application');
    }
    //Ensure that app exists
    for (const [key, value] of Object.entries(config.apps)) {
        const appPath = `./apps/${key}`;
        const pathExists = fs.existsSync(appPath);
        if (!pathExists) {
            throw new Error(`${appPath} does not exist, please ensure your application does exist`);
        }
        const hasBranches = value.branches !== undefined && Array.isArray(value.branches);
        if (!hasBranches) {
            throw new Error(`Please provide valid branches list for app ${key}`);
        }
        if (value.herokuAppName === undefined) {
            throw new Error(`Please provide a valid herokuAppName for app ${key}`);
        }
    }
    //Get the app that contains the currentBranch
    const row = Object.entries(config.apps)
        .map(([name, value]) => ({
        name,
        branches: value.branches,
        herokuAppName: value.herokuAppName,
        formation: value.formation
    }))
        .find(e => e.branches.includes(currentBranch));
    if (row === undefined) {
        throw new Error(`${currentBranch} is not supported by any application. Please make sure an application has this branch as its target`);
    }
    appName = row.name;
    herokuAppName = typeof row.herokuAppName === 'string' ? row.herokuAppName : row.herokuAppName[currentBranch];
    if (!herokuAppName) {
        throw new Error(`herokuAppName was not found, the given herokuAppName is of type ${typeof row.herokuAppName}. 
    If you are using a dictionary then ensure the branch ${currentBranch} is registered in there.`);
    }
    if (row.formation) {
        core.info(`Heroku formation was found with value: ${row.formation}`);
        herokuFormation = row.formation;
    }
}
function loadConfigFile() {
    return __awaiter(this, void 0, void 0, function* () {
        const filePath = core.getInput('ci_config_path');
        core.info(`Loading configuration file at path: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(content);
        core.info(`Ref: ${github.context.ref}`);
        const branch = String(github.context.ref).replace('refs/heads/', '').trim();
        core.info(`Branch: ${branch}`);
        const { email, name } = github.context.payload['pusher'];
        core.info(`Building is being created by ${name} with email ${email}`);
        validateConfigFile(json, branch);
        core.info(`App name is ${appName} located in ./apps/${appName}`);
        herokuEmail = email;
    });
}
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadConfigFile();
        yield loginHeroku();
        yield buildPushAndDeploy();
    });
}
function loginHeroku() {
    return __awaiter(this, void 0, void 0, function* () {
        const password = core.getInput('heroku_api_key');
        try {
            yield child_process_1.exec(`echo ${password} | docker login --username=${herokuEmail} registry.heroku.com --password-stdin`);
            core.info(`[${herokuEmail}] Logged in successfully ✅`);
        }
        catch (error) {
            core.setFailed(`Authentication process failed. Error: ${error.message}`);
        }
    });
}
function buildPushAndDeploy() {
    return __awaiter(this, void 0, void 0, function* () {
        //Dockerfile path needs to be a directory and by default we are giving the filename which is wrong
        const dockerFilePath = core.getInput('dockerfile_path');
        const herokuAction = heroku_action_1.herokuActionSetUp(herokuAppName, herokuFormation);
        const pushOptions = `--arg APP_NAME=${appName}`;
        try {
            const dockerFileExists = fs.existsSync(dockerFilePath);
            if (!dockerFileExists) {
                throw new Error(`Dockerfile path does not exist, given path = ${dockerFilePath}`);
            }
            //If the path is defined we need to go inside it
            /*if (dockerFilePath) {
              await exec(`cd ${dockerFilePath}`)
            }*/
            const { stdout } = yield child_process_1.exec(herokuAction(`push ${pushOptions}`));
            core.startGroup('Building docker image.. 🛠');
            stdout === null || stdout === void 0 ? void 0 : stdout.on('data', (data) => {
                core.info(data.toString());
            });
            core.endGroup();
            core.info('Container pushed to Heroku Container Registry ⏫');
            yield child_process_1.exec(herokuAction('release'));
            core.info('App Deployed successfully 🚀');
            /**
             * @todo Use like this https://github.com/AkhileshNS/heroku-deploy/blob/master/index.js
             * they do check heroku healthcheck and it might be good for us to determinate rollbacks
             */
            /**
             * @todo We need to use cache https://github.com/actions/cache
             * We need to cache docker layers/fragments to prevent a lot of execution time
             */
        }
        catch (error) {
            core.setFailed(`Error pushing/releasing your docker image to Heroku: ${error.message}`);
        }
    });
}
bootstrap().catch(error => {
    core.setFailed(error.message);
});
