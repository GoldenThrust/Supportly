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
      const template = await fs.readFile(templaftePath, 'utf-8');
      // Cache the template
      await redis.set(`templateName:${templateName}`, template, 24 * 60 * 60); // Cache for 24 hours
      return this.interpolate(template, data);
    } catch (error) {
      throw new Error(`Template not found: ${templateName}`);
    }
  }

  static interpolate(template, data) {
    // First handle conditional blocks
    template = this.handleConditionals(template, data);
    
    // Then handle variable interpolation
    return template.replace(/\${([^}]+)}/g, (_, key) => {
      // Handle nested properties with dot notation (e.g., user.name)
      return key.split('.').reduce((obj, prop) => obj?.[prop], data) || '';
    });
  }

  static handleConditionals(template, data) {
    // Handle conditional blocks like ${condition ? `content` : 'alternate'}
    return template.replace(/\$\{([^}]*?)\s*\?\s*`([^`]*?)`\s*(?::\s*['"`]([^'"`]*?)['"`])?\s*\}/gs, (match, condition, ifContent, elseContent = '') => {
      try {
        // Create a safe evaluation context
        const context = { ...data };
        
        // Simple condition evaluation for common cases
        const isTrue = this.evaluateCondition(condition.trim(), context);
        
        if (isTrue) {
          // Recursively process the content inside the conditional
          return this.interpolate(ifContent, data);
        } else {
          return elseContent;
        }
      } catch (error) {
        console.warn('Error processing conditional:', error);
        return '';
      }
    });
  }

  static evaluateCondition(condition, data) {
    // Handle simple truthiness checks
    const value = condition.split('.').reduce((obj, prop) => obj?.[prop], data);
    return Boolean(value);
  }
}