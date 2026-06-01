import { Injectable, Logger } from '@nestjs/common';
import { ITemplateService } from '../../../domain/contracts/template.service.interface';
import * as fs from 'fs';
import * as path from 'path';

/**
 * HtmlTemplateService — Infrastructure implementation of ITemplateService.
 *
 * Uses a zero-dependency approach: reads plain HTML files and replaces
 * {{variable}} placeholders with the provided values.
 *
 * Why no Handlebars / MJML dependency?
 *   — Keeps the Docker image lean (no extra compilation step at runtime).
 *   — The HTML templates already contain all styling inlined.
 *   — Can be upgraded to Handlebars by swapping this class without touching callers (OCP).
 *
 * SOLID:
 *  SRP  — only responsible for loading and interpolating templates
 *  OCP  — swap this class for HandlebarsTemplateService without breaking callers
 *  DIP  — callers inject ITemplateService, not this concrete class
 */
@Injectable()
export class HtmlTemplateService implements ITemplateService {
  private readonly logger   = new Logger(HtmlTemplateService.name);
  private readonly templatesDir: string;

  constructor() {
    // Templates directory lives next to this file at runtime
    this.templatesDir = path.join(__dirname, '../../templates');
  }

  async render(templateName: string, variables: Record<string, any>): Promise<string> {
    const filePath = path.join(this.templatesDir, `${templateName}.html`);

    if (!fs.existsSync(filePath)) {
      this.logger.error(`[TEMPLATE] Template not found: ${filePath}`);
      throw new Error(`Email template "${templateName}" not found at ${filePath}`);
    }

    let html = fs.readFileSync(filePath, 'utf-8');

    // Replace every {{key}} occurrence with its value
    for (const [key, value] of Object.entries(variables)) {
      const escaped = String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex   = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      html = html.replace(regex, String(value ?? ''));
    }

    this.logger.log(`[TEMPLATE] Rendered template: ${templateName}`);
    return html;
  }
}
