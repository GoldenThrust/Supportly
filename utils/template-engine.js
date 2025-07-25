// utils/template-engine.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiUrl } from './constants.js';
import { redis } from '../config/redis.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class TemplateEngine {
  static async render(templateName, data = {}) {
    const template = await redis.get(`templateName:${templateName}`);
    // Check cache first
    if (template) {
      return this.interpolate(template, data);
    }

    // Load template file
    const templatePath = path.join(__dirname, `../templates/emails/${templateName}.html`);
    
    try {
      console.log(`Loading template from: ${templatePath}`);
      const template = await fs.readFile(templatePath, 'utf-8');
      // Cache the template
      await redis.set(`templateName:${templateName}`, template, 24 * 60 * 60); // Cache for 24 hours
      return this.interpolate(template, data);
    } catch (error) {
      throw new Error(`Template not found: ${templateName}`);
    }
  }

  static interpolate(template, data) {
    return template.replace(/\${([^}]+)}/g, (_, key) => {
      // Handle nested properties with dot notation (e.g., user.name)
      return key.split('.').reduce((obj, prop) => obj?.[prop], data) || '';
    });
  }
}