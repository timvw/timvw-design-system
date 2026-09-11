/* Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
const dictionaries = {
  en: {
    working: 'Working…', field: 'Field', correct: 'Please correct {count} field(s).', formError: 'Please review the following errors.', validationFailed: 'Validation is unavailable. Please try again.',
    showPassword: 'Show password', hidePassword: 'Hide password', notifications: 'Notifications', dismissNotification: 'Dismiss notification',
    searchAdd: 'Search and add…', searchOptions: 'Search options…', options: 'Options', choose: 'Choose an option from the list.', available: '{count} options available.', noOptions: 'No options available. Try another search.',
    remove: 'Remove', removeName: 'Remove {name}', removed: '{name} removed. {count} selected.', selected: '{name} selected.', selectedCount: '{count} selected',
    results: '{start}–{end} of {count} results', noResults: 'No results', page: 'Page {page}', previous: 'Previous', next: 'Next', search: 'Search', clear: 'Clear {name}: {value}',
    ready: 'Content loaded.', loading: 'Loading…', empty: 'No content available.', error: 'Content could not be loaded.',
    fileReady: 'Ready', fileUploading: 'Uploading', fileComplete: 'Complete', fileFailed: 'Failed', fileCancelled: 'Cancelled', uploading: 'Uploading {name}', filesSelected: '{count} files selected.', fileRemoved: '{name} removed. {count} files selected.',
    fileType: '{name}: file type is not accepted.', fileSize: '{name}: exceeds the {size} MB limit.', fileCount: 'Select at most {count} files.', filesCleared: 'Files cleared.', uploadFailed: 'Upload failed', uploadSummary: '{completed} completed, {failed} failed.', retryFiles: 'Retry to send unfinished files again.', uploadCancelled: 'Upload cancelled. You can retry unfinished files.',
    remoteFailed: 'Options could not be loaded. Try again.', retry: 'Retry', saved: 'Changes saved.', saveFailed: 'Changes could not be saved. Please try again.', commands: '{count} commands available.'
  },
  nl: {
    working: 'Bezig…', field: 'Veld', correct: 'Corrigeer {count} veld(en).', formError: 'Controleer de volgende fouten.', validationFailed: 'Validatie is niet beschikbaar. Probeer opnieuw.',
    showPassword: 'Wachtwoord tonen', hidePassword: 'Wachtwoord verbergen', notifications: 'Meldingen', dismissNotification: 'Melding sluiten',
    searchAdd: 'Zoeken en toevoegen…', searchOptions: 'Opties zoeken…', options: 'Opties', choose: 'Kies een optie uit de lijst.', available: '{count} opties beschikbaar.', noOptions: 'Geen opties beschikbaar. Probeer een andere zoekterm.',
    remove: 'Verwijderen', removeName: '{name} verwijderen', removed: '{name} verwijderd. {count} geselecteerd.', selected: '{name} geselecteerd.', selectedCount: '{count} geselecteerd',
    results: '{start}–{end} van {count} resultaten', noResults: 'Geen resultaten', page: 'Pagina {page}', previous: 'Vorige', next: 'Volgende', search: 'Zoeken', clear: '{name}: {value} wissen',
    ready: 'Inhoud geladen.', loading: 'Laden…', empty: 'Geen inhoud beschikbaar.', error: 'De inhoud kon niet worden geladen.',
    fileReady: 'Gereed', fileUploading: 'Uploaden', fileComplete: 'Voltooid', fileFailed: 'Mislukt', fileCancelled: 'Geannuleerd', uploading: '{name} uploaden', filesSelected: '{count} bestanden geselecteerd.', fileRemoved: '{name} verwijderd. {count} bestanden geselecteerd.',
    fileType: '{name}: dit bestandstype is niet toegestaan.', fileSize: '{name}: overschrijdt de limiet van {size} MB.', fileCount: 'Selecteer maximaal {count} bestanden.', filesCleared: 'Bestanden gewist.', uploadFailed: 'Upload mislukt', uploadSummary: '{completed} voltooid, {failed} mislukt.', retryFiles: 'Probeer de onvoltooide bestanden opnieuw.', uploadCancelled: 'Upload geannuleerd. Je kunt onvoltooide bestanden opnieuw proberen.',
    remoteFailed: 'Opties konden niet worden geladen. Probeer opnieuw.', retry: 'Opnieuw proberen', saved: 'Wijzigingen opgeslagen.', saveFailed: 'Opslaan is mislukt. Probeer opnieuw.', commands: '{count} opdrachten beschikbaar.'
  }
};
export function getLocale(element = document.documentElement) { return element.closest?.('[lang]')?.lang || document.documentElement.lang || 'en'; }
export function addMessages(locale, messages) {
  const key = Intl.getCanonicalLocales(locale)[0];
  if (!messages || Object.values(messages).some(value => typeof value !== 'string')) throw new TypeError('Messages must be strings');
  dictionaries[key] = { ...dictionaries[key], ...messages };
}
export function setLocale(locale, { messages, direction } = {}) {
  const key = Intl.getCanonicalLocales(locale)[0];
  if (direction && !['ltr', 'rtl'].includes(direction)) throw new TypeError('Direction must be ltr or rtl');
  if (messages) addMessages(key, messages);
  document.documentElement.lang = key;
  document.documentElement.dir = direction || (/^(ar|fa|he|ur)(-|$)/.test(key) ? 'rtl' : 'ltr');
  document.dispatchEvent(new CustomEvent('tvw:localechange', { detail: { locale: key } }));
}
export function translate(key, values = {}, element) {
  const locale = getLocale(element), language = locale.split('-')[0];
  const message = dictionaries[locale]?.[key] ?? dictionaries[language]?.[key] ?? dictionaries.en[key] ?? key;
  return message.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}
export const formatNumber = (value, options = {}, element) => new Intl.NumberFormat(getLocale(element), options).format(value);
export const formatDate = (value, options = {}, element) => new Intl.DateTimeFormat(getLocale(element), options).format(value);
