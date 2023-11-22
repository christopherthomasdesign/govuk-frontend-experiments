import { getSupportedLevelMessage } from './common/index.mjs'
import { SupportError } from './errors/index.mjs'

/**
 * Base Component class
 *
 * Centralises the behaviours shared by our components
 *
 * @internal
 * @abstract
 */
export class GOVUKFrontendComponent {
  /**
   * Constructs a new component, validating that GOV.UK Frontend is supported
   *
   * @internal
   */
  constructor() {
    this.checkSupport()
  }

  /**
   * Validates whether GOV.UK Frontend is supported
   *
   * @private
   */
  checkSupport() {
    const supportLevelMessage = getSupportedLevelMessage()
    if (supportLevelMessage !== 'OK') {
      throw new SupportError(supportLevelMessage)
    }
  }
}
