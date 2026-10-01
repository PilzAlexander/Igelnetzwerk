// Lädt die editierbaren Konfigurationsdateien aus /config für die App.
import plz from '../../config/region10-plz.json';
import stichworte from '../../config/stichworte.json';
import push from '../../config/push.json';
import andereStationen from '../../config/andere-stationen.json';
import { LABELS } from '../data/schema.js';

export const regelConfig = { plz, stichworte, push, merkmalLabels: LABELS.merkmale };
export { andereStationen };
