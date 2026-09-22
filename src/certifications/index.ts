import { capm } from './capm';
import { iso27001 } from './iso27001';
import { itil4 } from './itil4';

export const certifications = [capm, iso27001, itil4] as const;

export function getCertification(id: string) {
  return certifications.find(certification => certification.id === id) ?? capm;
}
