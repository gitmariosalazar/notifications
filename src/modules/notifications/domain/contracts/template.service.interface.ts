/**
 * ITemplateService — Domain contract (DIP)
 * 
 * Any template engine (Handlebars, EJS, MJML, etc.) must implement this interface.
 * This ensures the application layer never depends on a concrete templating library.
 * 
 * SOLID adherence:
 *  OCP — new template engines can be added without modifying callers
 *  DIP — callers depend on this abstraction, not on `fs` or `Handlebars`
 */
export interface ITemplateService {
  /**
   * Renders a named HTML template with the given variables.
   * @param templateName — filename without extension (e.g. 'verification-code')
   * @param variables    — key-value map of variables to interpolate
   * @returns            — compiled HTML string ready to send
   */
  render(templateName: string, variables: Record<string, any>): Promise<string>;
}
