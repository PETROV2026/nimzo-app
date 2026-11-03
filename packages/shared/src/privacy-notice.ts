import { supportEmail } from './support';

export type PrivacyNoticeSection = { title: string; paragraphs: string[] };

export const privacyNoticeUpdatedAt = '2026-11-03';

export const privacyNoticeController = {
  legalName: 'Petrov',
  address: 'Calz. Cetys 1590-1, Vista Hermosa, 21240 Mexicali, B.C.',
};

export const privacyNotice: PrivacyNoticeSection[] = [
  {
    title: 'Quién es responsable de tus datos',
    paragraphs: [
      `${privacyNoticeController.legalName}, con domicilio en ${privacyNoticeController.address}, es responsable del tratamiento de tus datos personales en Nimzo, de acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.`,
    ],
  },
  {
    title: 'Qué datos tuyos usamos',
    paragraphs: [
      'Datos de identificación y contacto: nombre completo, correo electrónico, teléfono, estado y ciudad.',
      'Tu firma autógrafa digitalizada, que dibujas en la app.',
      'La información de tu trabajo que capturas en la app: tus clientes, sus sucursales y sistemas, tus servicios y los reportes que envías, incluidas las fotos que tomas.',
      'Datos técnicos para darte soporte cuando nos escribes: versión de la app y versión de Android.',
      'Tus notas se guardan solo en tu tablet; no las recibimos.',
      'No usamos datos personales sensibles.',
    ],
  },
  {
    title: 'Para qué los usamos',
    paragraphs: [
      'Crear y administrar tu cuenta y permitirte entrar a la app.',
      'Generar los reportes de servicio con tus datos de contacto y tu firma, guardarlos y entregarlos a tus clientes.',
      'Respaldar y sincronizar tu información entre la tablet y la nube.',
      'Atender tus solicitudes de ayuda y soporte.',
      'Cumplir obligaciones legales.',
      'No usamos tus datos para publicidad ni para fines distintos a los de este aviso.',
    ],
  },
  {
    title: 'Datos de tus clientes',
    paragraphs: [
      'Los datos de tus clientes que capturas en la app (nombres, contactos y domicilios de sus sucursales) se tratan por cuenta tuya y solo para generar tus reportes. Tú eres responsable de contar con su autorización para capturarlos.',
    ],
  },
  {
    title: 'Con quién los compartimos',
    paragraphs: [
      'Tus reportes, con tus datos de contacto y tu firma, los reciben los clientes a los que les das el servicio.',
      'Usamos proveedores de hospedaje y almacenamiento en la nube que tratan los datos solo por cuenta nuestra y bajo obligaciones de confidencialidad.',
      'No vendemos ni compartimos tus datos con terceros para otros fines, salvo cuando una autoridad competente lo requiera conforme a la ley.',
    ],
  },
  {
    title: 'Tus derechos',
    paragraphs: [
      `Puedes acceder a tus datos, rectificarlos, cancelarlos u oponerte a su uso (derechos ARCO), así como revocar tu consentimiento o limitar su uso, escribiendo a ${supportEmail}.`,
      'En tu solicitud indica tu nombre, el correo de tu cuenta, qué derecho quieres ejercer y, en su caso, los datos a corregir. Te responderemos en un máximo de 20 días hábiles.',
      'Tu nombre, teléfono, estado, ciudad y firma también los puedes corregir tú mismo en la sección Perfil de la app.',
    ],
  },
  {
    title: 'Cómo protegemos tus datos',
    paragraphs: [
      'Tu información viaja cifrada, solo tú puedes ver tus clientes, servicios y reportes, y tu firma y tus fotos se guardan en almacenamiento privado.',
    ],
  },
  {
    title: 'Cambios a este aviso',
    paragraphs: [
      'Si este aviso cambia, lo verás actualizado en la sección Perfil de la app, con su fecha de última actualización.',
    ],
  },
];
