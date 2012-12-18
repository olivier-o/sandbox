 requirejs.config({
   baseUrl: 'lib',
   paths: {
     underscore: 'vendor/underscore/underscore',
     fileDescriptor: 'fs/descriptor',
     davFSAdapter: 'fs/davFSAdapter',
     localFSAdapter: 'fs/localFSAdapter',
     fileSync: 'fs/fileSync',
     localLogger: 'fs/localLogger',
     diffScanner: 'fs/diffScanner',
     shipper: 'fs/shipper',
     davException: 'vendor/davclient/jsbase/exception',
     davString: 'vendor/davclient/jsbase/string',
     davArray: 'vendor/davclient/jsbase/array',
     davMinisax: 'vendor/davclient/minisax',
     davDommer: 'vendor/davclient/dommer',
     davClient: 'vendor/davclient/davclient',
     davlib: 'vendor/davclient/davfs'
   },
   shim: {
     'davlib': {
       //These script dependencies should be loaded before loading davlib.js
       deps: ['davException', 'davString', 'davArray', 'davMinisax', 'davDommer', 'davClient'],
       //Once loaded, use the global 'Davlib' as the module value.
       exports: 'Davlib'
     }
   }
 });
