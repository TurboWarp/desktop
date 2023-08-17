import {protocol} from 'electron';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tw-extensions',
    privileges: {
      supportFetchAPI: true
    }
  },
  {
    scheme: 'tw-library-files',
    privileges: {
      supportFetchAPI: true
    }
  }
]);
