import * as core from '@actions/core'

/**
 * Returns a function that allows to perform an action to given appName
 * @param {string} appName - Heroku App Name
 * @param formation
 * @returns {function}
 */
export function herokuActionSetUp(appName: string, formation: string) {
  /**
   * @typedef {'push' | 'release'} Actions
   * @param {Actions} action - Action to be performed
   * @returns {string}
   */
  return function herokuAction(action: string, options?: string) {
    const HEROKU_API_KEY = core.getInput('heroku_api_key')
    const exportKey = `HEROKU_API_KEY=${HEROKU_API_KEY}`
    let cmd = `${exportKey} heroku container:${action} ${formation} --app ${appName}`
    if (options) {
      cmd += ` ${options}`
    }
    core.info(`[Heroku Action] - ${cmd}`)
    return cmd
  }
}
