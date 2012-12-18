//-----------------------------------------------------------------------------
// FileDescriptor
//-----------------------------------------------------------------------------
define([

    ], function() {
  
  var FileDescriptor = function() {
     this.name =  null;
     this.path = null; 
     this.relativePath = null; 
     this.createTimestamp=null;  
     this.lastTimestamp = null;
     this.size= 0; 
     this.isDir = false;
     var self=this;
     this.readSize = function(size) {
      
       var info= size || self.size;
       info = info || 0; 
       var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
       var i = 0;
         while(info >= 1024) {
          info /= 1024;
          ++i;
       }
       return info.toFixed(1) + ' ' + units[i];
     };
  };
  
  return FileDescriptor;
});

