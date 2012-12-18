//-----------------------------------------------------------------------------
// FileSync
//-----------------------------------------------------------------------------
define('fileSync',[
    'underscore',
    'diffScanner'

    ], function(_,DiffScanner) {
  
  var FileSync = function() {
  /* High level implementation of a DavFs client wrapper */
    console.log('FileSync');
  };
 _.extend(FileSync.prototype,
  {
    initialize:function(local,remote,shipper,logger) {
      this.local = local;
      this.remote= remote;
      this.shipper= shipper;
      this.logger=logger;
      this.forceSync=false;//if destination is newer than source sync stop, if set to true sync continue no matter what.
    },
    
    //from server to localfile 
    checkOut: function(paths,forceSync,callbacks){  //source = remote; destination= local
      this._log("checkOut in: " + paths.source);
      this._prepareSync(paths,true,forceSync,callbacks);
    },
    //from localfile to server  
    checkIn: function(paths,forceSync,callbacks){  //source = remote; destination= local
      this._log("checkIn in: " + paths.destination);
      this._prepareSync(paths,false,forceSync,callbacks);
    },

    _log: function(msg){
      this.logger.writeln(msg);
    },

    _prepareSync:function(paths,toLocal,forceSync,callbacks) {
      this.forceSync=forceSync;
      this.syncPaths=paths;
      this.source= (toLocal)?this.remote:this.local;
      this.destination=(toLocal)?this.local:this.remote;
      this._initCallbacks(callbacks);
      var self=this;
      this.source.readdir(paths.source,
           function(error,content){
             if (error){
               self._onError("fileSync._prepareSync","error reading source path: " + paths.source + " " +  error);
               return;
             }
             self.sourceTree= content;
             self.destination.readdir(paths.destination,
                  function(error,content){
                    // Not found is ok -- path may not exist on destination
                    if (error && error !=="Not Found"){self._onError("fileSync._prepareSync","error reading local path: " + paths.destination +" " + error);return;}
                    self.destinationTree= content ||[];
                    self.diffFileSet=self._scan(self.sourceTree,self.destinationTree);
                    self._sync(self.diffFileSet,self._syncCallback);
                  });
           });
    },
    _scan: function(leftSide,rightSide){
      var diffScanner = new DiffScanner({leftSide:leftSide,rightSide:rightSide});
      return diffScanner.process();
     },
  
    _sync: function(syncReports,callback) {
      //this.read_errors=[];
      //this.write_errors=[];
      this.transfer_errors=[];
      this.remove_errors=[];
      this.addedCount=0;
      this.removedCount=0;
      if (syncReports.errors.length >0){
        if(this.forceSync) {
          this._onError('sync forced',this._scanErrorToString(syncReports.errors));
          var toAdd= _.pluck(syncReports.errors, 'left');
          syncReports.writables=syncReports.writables.concat(toAdd);
        }
        else{
           this._onError('sync aborted',this._scanErrorToString(syncReports.errors));
           this._onComplete('_sync','sync aborted on scan error see log for details');
           return; // sync is aborted 
        }
      }
      this.actions=[{run:this._syncWriteNext,items:syncReports.writables},{run:this._syncRemoveNext,items:syncReports.removables}];
      
      this._syncActionNext();
     },
    _syncActionNext:function() {
      if (this.actions.length===0){this._syncCallback();return;}
      var current = this.actions.shift();
      this.actionables=current.items;
      current.run.apply(this);
    },

    _syncWriteNext: function() {
       if (this.actionables.length===0){this._syncActionNext();return;}
       var item= this.actionables.shift();
       var self=this;
       this._onProgress('write',item.path + "(" + item.readSize() + ")");
       if (item.isDir){
         var destinationDir=(self.syncPaths.destination +item.relativePath);
         self.destination.mkdir(destinationDir,
              function(error){
                if (error){ self.transfer_errors.push({item:destinationDir,msg:error});}
                self._syncWriteNext();
              });
       } else {
        
         var destinationPath= this.destination.getFullPath(self.syncPaths.destination +item.relativePath);
         this._checkDestinationPath(destinationPath, function(error){
              if(error){self.transfer_errors.push({item:item.path,msg:error});self._syncWriteNext();return;}
              self.shipper.transfer({origin:self.source.getFullPath(item.path),destination: destinationPath},
                                    {onError:function(error){self.transfer_errors.push({item:item.path,msg:error});self._syncWriteNext();},
                                     onComplete:function(){self.addedCount++;self._syncWriteNext();}                 
             });
         });
        //
        /* 
        self.source.read(item.path,
              function(error, content){
                if (error){self.read_errors.push(error);}
                else{
                  self.destination.write(item.path,content,
                       function(error, content){
                         if (error){self.write_errors.push(error);}
                         self._syncWriteNext();
                       }
                    );
                }
              });
        */
       }
    },
    _checkDestinationPath: function(path,callback){
      var self=this;
      this.destination.isDir(path,function(result){
        if(!result){
          self.destination.mkdir(path,function(error){
            callback(error);});
        }
        else{callback();}
      });
    },

    _syncRemoveNext: function() {
       if (this.actionables.length===0){this._syncActionNext();return;}
       var item= this.actionables.shift();
       var self=this;
       this._onProgress("remove" , item.path);
       if (item.isDir){
         self.destination.rmdir(item.path,
              function(error){
                if (error){ self.remove_errors.push({item:item.path,msg:error});}
                self._syncRemoveNext();
              });
       }
       else{
         self.destination.rm(item.path,
              function(error){
                if (error){ self.remove_errors.push({item:item.path,msg:error});}
                else{self.removedCount++;}
                self._syncRemoveNext();
              });
       }
    },

   _syncCallback:function() {
      var errors=[];
      var errorCount=0;
      //if (this.read_errors.length >0){errors.push(this.read_errors); alert(this.read_errors.length + " reading errors, check logs");}
      //if (this.write_errors.length >0){errors.push(this.write_errors); alert(this.write_errors.length + " writing errors, check logs");}
      if (this.transfer_errors.length >0){this._log(this._writeErrorToString(this.transfer_errors)); errorCount+= this.transfer_errors.length;}
      if (this.remove_errors.length >0){this._log(this._removeErrorToString(this.remove_errors)); errorCount+=this.remove_errors.length;}
      //if (errors.length===0){errors=null;}
      
      this._onComplete('complete',"added: "+ this.addedCount+ ", removed: " +  this.removedCount + ", errors: " + errorCount ,{added:this.addedCount,removed:this.removedCount,errors:errorCount});//callback(errors);
    },
   
    _initCallbacks:function(callbacks) {
      var onProgressCallback = callbacks.onProgress || function(){};
      var onErrorCallback = callbacks.onError || function(){};
      var onCompleteCallback = callbacks.onComplete || function(){};
      var self=this;
      this._onProgress= function(method,msg){self._onActionLog(method,msg); onProgressCallback(msg);}; 
      this._onError= function(method,msg){self._onActionLog(method,msg); onErrorCallback(msg);}; 
      this._onComplete= function(method,msg,info){self._onActionLog(method,msg); onCompleteCallback(info);}; 
    },


    _scanErrorToString:function(errors) {
      var report="SCAN ERROR BEGIN ===\n";
      _.each(errors, function(error){
        report+="  " + error.ref +": " + error.msg +"\n";// + "(" + error.right.lastTimestamp + ") :" + error.right.size + " != " + error.left.size +"\n"; 
      });
      report +="=== SCAN ERROR END ===\n";
      return report;
    },

    _writeErrorToString:function(errors) {
      var report="WRITE ERROR BEGIN ===\n";
      _.each(errors, function(error){
        report+="  " + error.item +": " + error.msg  +"\n"; 
      });
      report +="=== WRITE ERROR END ===\n";
      return report;
    },

  _removeErrorToString:function(errors) {
      var report="REMOVE ERROR BEGIN ===\n";
      _.each(errors, function(error){
        report+="  " + error.item +": " + error.msg  +"\n"; 
      });
      report +="=== REMOVE ERROR END ===\n";
      return report;
    },

    _onActionLog: function(method,msg) {
       this._log(method + ": " + msg);
    }

  });

  return FileSync;
});

