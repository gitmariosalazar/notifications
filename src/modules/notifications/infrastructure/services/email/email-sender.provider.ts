import { Provider } from '@nestjs/common';
import { ConsoleEmailSender } from './console-email.sender';
import { SmtpEmailSender } from './smtp-email.sender';

/**
 * Factory dinámica para IEmailSender.
 * Resuelve la clase concreta en base a variables de entorno.
 * Permite cambiar de proveedor (SMTP a Console o SES) sin tocar un solo archivo de negocio/Use Case.
 */
export const EmailSenderProvider: Provider = {
  provide: 'IEmailSender',
  useFactory: () => {
    const provider = process.env.EMAIL_PROVIDER || 'console';
    
    switch (provider.toLowerCase()) {
      case 'smtp':
        return new SmtpEmailSender();
      case 'console':
      default:
        return new ConsoleEmailSender();
    }
  },
};
