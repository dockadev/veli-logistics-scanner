/**
 * Uygulama sürümü.
 *
 * `package.json` içindeki `version` alanından gelir; Vite bunu build
 * anında sabit metne çevirir. Sürümü burada elle yazmamak, iki yerde
 * farklı değer kalmamasını sağlar.
 */
import { version } from '../../package.json'

export const APP_VERSION: string = version