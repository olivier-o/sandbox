//-----------------------------------------------------------------------------
// Shipper
//-----------------------------------------------------------------------------
define('shipper',["underscore"
    ], function(_) {

  var Shipper=function(baseDir,logger){
      this.baseDir=baseDir ||'';
      this.homeDir = Titanium.Filesystem.getDocumentsDirectory();
      this.workingDir = Titanium.Filesystem.getFile(this.homeDir,this.baseDir);
      this.logger=logger;
      };
  _.extend(Shipper.prototype,
  {

    transfer: function(paths,callbacks){
      this.origin= paths.origin;
      this.destination=paths.destination;
      this.callbacks=callbacks;
     /* this._checkDestinationPath();*/
      this._processTransfer();
    },

   _processTransfer:function(error)
   {
    //if (error){this._onError("_processTransfer","path cannot be validated:" + error);return;}
    if (this.origin.indexOf("http")===0) {
        this.download(this.origin,this.destination,this.callbacks);
      } else {
        this.upload(this.origin,this.destination,this.callbacks);
      }
  },

    download: function(src,dest,callbacks){
      this._initCallbacks(callbacks);
      var url=src;
      var filePath= this.workingDir + dest;
      if (Titanium.Platform.getName()!=="Darwin") {
        filePath=filePath.replace(/\//g,Titanium.Filesystem.getSeparator());
      }

      var httpClient = Titanium.Network.createHTTPClient();
      //  httpClient.xWorker = this;
      var self=this;
      //Check for d/l finished event
      httpClient.onreadystatechange = function(e) {
        if (e.readyState == 4) {
           self._onComplete("download","download done");
           //  this.xWorker.postMessage(-2);
           }
         };
      httpClient.ondatastream = function(e) {
        // read the content length
        length = e.getResponseHeader("Content-Length");
        // remove the callback... we'll reestablish it in a moment
        httpClient.ondatastream = null;
        if (length > 0) {
           // updateProgressWidth.call(this, evt);
           // httpClient.ondatastream = updateProgressWidth;
        }
        else {
            // tell the user we don't know the content length
        }


          console.log('#####ONRECEIVESTREAM - PROGRESS: ' + e.dataReceived);
      };

         httpClient.onerror = function(e) {
          self._onError(e);// this.xWorker.postMessage(-1);
         };

         if (httpClient.open('GET', url)) {
           //this.postMessage(0);
           var file = Titanium.Filesystem.createTempFile();
           //var filePath = dest;//  event.message.dir+event.message.filename;
           file.copy(filePath);

           httpClient.xFile = filePath;

           // Handle the received data (Titanium.Filesystem.File can also be used as a handler)
           httpClient.receive(function(data) {
             var file = Titanium.Filesystem.getFile(this.xFile);
             var fileStream = file.open(Titanium.Filesystem.MODE_APPEND);
             fileStream.write(data);
             fileStream.close();
             //this.xWorker.postMessage(data.length);
           });
         } else {
           self._onError(e);
         //  this.postMessage(-1);
         }

      },

      upload: function(src,dest,callbacks){
      this._initCallbacks(callbacks);
      console.log(src + "=>" + dest);
      var self = this;
      var file = Titanium.Filesystem.getFile(this.workingDir + src);

      if(!file.exists()) {
        this._onError("upload", "path not found" + file);
        console.log('path not found:' + file);
        return;
      }

      var content=Titanium.API.createBytes();
      if (file.size() >0){
        var uploadStream = Titanium.Filesystem.getFileStream(file);
        uploadStream.open(Titanium.Filesystem.MODE_READ);
        content = uploadStream.read();
        uploadStream.close();
      }
      //console.log(content);

      var xhr = Titanium.Network.createHTTPClient();
      xhr.addEventListener(Titanium.HTTP_DONE, function() {
        console.log("TI XHR DONE!");
        console.log(this.responseText);
        self._onComplete("upload","upload done");
      });
      xhr.addEventListener(Titanium.HTTP_STATE_CHANGED, function() {
        console.log("STATE CHANGED");
        console.log(this.responseText);
      });

      xhr.onsendstream = function(e) {
          console.log('#####ONSENDSTREAM - PROGRESS: ' + e.dataSent);//e.progress
      };
      xhr.setTimeout(-1); // no limit
      xhr.setRequestHeader("contentType", "multipart/form-data");
      xhr.open('PUT', dest);
      xhr.send(content);
    },

    _log: function(msg){
      this.logger.writeln(msg);
    },

    _initCallbacks:function(callbacks)
    {
      var onProgressCallback = callbacks.onProgress || function(){};
      var onErrorCallback = callbacks.onError || function(){};
      var onCompleteCallback = callbacks.onComplete || function(){};
      var self=this;
      this._onProgress= function(method,msg){self._onActionLog(method,msg); onProgressCallback(msg);};
      this._onError= function(method,msg){self._onActionLog(method,msg); onErrorCallback(msg);};
      this._onComplete= function(method,msg){self._onActionLog(method,msg); onCompleteCallback(msg);};
    },
    _onActionLog: function(method,msg)
    {
       this._log(method + ": " + msg);
    }
  });
    return Shipper;
});
