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
Object.defineProperty(exports, "__esModule", { value: true });
exports.herokuActionSetUp = void 0;
const core = __importStar(require("@actions/core"));
/**
 * Returns a function that allows to perform an action to given appName
 * @param {string} appName - Heroku App Name
 * @returns {function}
 */
function herokuActionSetUp(appName, formation) {
    /**
     * @typedef {'push' | 'release'} Actions
     * @param {Actions} action - Action to be performed
     * @returns {string}
     */
    return function herokuAction(action, options) {
        const HEROKU_API_KEY = core.getInput('heroku_api_key');
        const exportKey = `HEROKU_API_KEY=${HEROKU_API_KEY}`;
        let cmd = `${exportKey} heroku container:${action} ${formation} --app ${appName}`;
        if (options) {
            cmd += ` ${options}`;
        }
        core.info(`[Heroku Action] - ${cmd}`);
        return cmd;
    };
}
exports.herokuActionSetUp = herokuActionSetUp;
