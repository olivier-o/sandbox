//-----------------------------------------------------------------------------
// LocalFsAdapter
//-----------------------------------------------------------------------------
define('localFSAdapter',[
    'underscore',
    'fileDescriptor'

    ], function(_,FileDescriptor) {
  
  var LocalFsAdapter = function() {
  /* High level implementation of a localFs client wrapper */
      console.log('LocalFsAdapter');
      };
/* 
 LocalFsAdapter.prototype.initialize = function(host, port, protocol) {
   this.fs = new Davlib.DavFs();
   this.fs.initialize(host, port, protocol);
//   this._cache = new davlib.ResourceCache();
//   this._cache.initialize();
 };
*/
  _.extend(LocalFsAdapter.prototype,
  {
    initialize: function(baseDir) {
      this.enabled = ( typeof Titanium !== 'undefined');
      if(!this.enabled) { console.log('error: Titanium is not enabled');return; }
      
      // filesystem paths
      this.baseDir=baseDir ||'';
      this.homeDir = this.getHomeDir();
      this.workingDir = Titanium.Filesystem.getFile(this.homeDir,this.baseDir);
      this.sep = Titanium.Filesystem.getSeparator();
      if(!this.workingDir.exists()) {
        this.workingDir.createDirectory();
      }
    },
   
    getHomeDir:function(){
      if (Titanium.Platform.getName()=="Darwin") {
       return   Titanium.Filesystem.getDocumentsDirectory();
      }
      //patch for windows bug
      else
      {
        var tmp =  Titanium.Filesystem.getDocumentsDirectory();
        tmp = tmp.nativePath();
        //tmp =tmp.replace("Documents","My Documents");
        return Titanium.Filesystem.getFile(tmp);
      }
    },

    getFullPath: function(path)
    {
      return (path);//this.workingDir.nativePath() + this.sep + path; 
    },
    
    isDir: function(path,callback)
    {
         path=this._extractDir(this._normalizePath(path));
         var dir = Titanium.Filesystem.getFile(this.workingDir,path);
         callback(dir.isDirectory()); 
    },

    readdir : function(path,callback){
      this.callback=callback;
      this.queryPath=this._normalizePath(path);
      this.treeContent=[];
      this.recursionDepth=-1;
      readpath = Titanium.Filesystem.getFile(this.homeDir,path|| this.baseDir);
      if (!readpath.isDirectory){console.log(readpath.toString() + " not a directory");this.callback("Not Found");return;}
      this._readdir(path);
    },
   
    copy : function(path,topath,callback){
      this.callback=callback;
      try
      { 
        this.callback=callback;
        var src= Titanium.Filesystem.getFile(this.workingDir,path);
        var dest= Titanium.Filesystem.getFile(this.workingDir,topath);
        src.copy(dest);
        this._actionCallback();
      }
      catch(err)
      {
        this._actionCallback("cannot copy " + path +  "to " + topath + ". err: " +  err);
      }
    },

    append: function(path,content,callback)
    {
      this._write(path,content,callback,Titanium.Filesystem.MODE_APPEND);
    },

    write: function(path,content,callback)
    {
      this._write(path,content,callback,Titanium.Filesystem.MODE_WRITE);
    },

    _extractDir: function(path)
    {
      var lastSep = path.lastIndexOf(this.sep);
      if (lastSep < path.length) {
        path = path.substr(0,lastSep+1); //path end with "/"  
      }
      return path;
    },


    _write : function(path,content,callback,mode){
      this.callback=callback;
      try
      {
        var file = Titanium.Filesystem.getFile(this.workingDir,path);
         if(!file.parent().isDirectory()){
           var self=this;
           this.mkdir(this._extractDir(path),function(){
             self.callback=callback;//reset callback => mkdir override it
             return;});
         }

        var fileStream = file.open(mode);
        fileStream.write(content);
        fileStream.close();
        this._actionCallback();
      }
      catch(err)
      {
        this._actionCallback("cannot write. err: " +  err);
      }
    },

    read: function(path,callback){
      this.callback=callback;
      try
      {
        var fileStream = Titanium.Filesystem.getFileStream(this.workingDir,path);
        fileStream.open(Titanium.Filesystem.MODE_READ);
        var content = fileStream.read();
        fileStream.close();
        this.callback(null,content);
      }
      catch(err)
      {
        this._actionCallback("cannot read " + path +  ". err: " +  err.message);
      }
    },

    _normalizePath:function(path){
     if (Titanium.Platform.getName()!=="Darwin") {
        path=path.replace(/\//g,Titanium.Filesystem.getSeparator());
      }
     return path;
                  
    },


    mkdir : function(path,callback){
      this.callback=callback;
      path=this._extractDir(this._normalizePath(path));
      try
      { 
        var dir = Titanium.Filesystem.getFile(this.workingDir, path);
        if(!dir.exists())  {
          var dir_path = this.workingDir.toString();
          var path_arr = _.compact(path.toString().split(this.sep));
          var sep=this.sep;
          _.each(path_arr, function(p) {
            var d = Titanium.Filesystem.getFile(dir_path + sep + p);
            if(!d.exists()) {
              d.createDirectory();
            }
            dir_path = d.toString();
          });
        }
        this._actionCallback();
      }
      catch(err)
      {
        this._actionCallback("cannot create " + path +  ". err: " +  err.message);
      }
    },

    rm: function(path,callback){
      this.callback=callback;
      try
      {
        var file = Titanium.Filesystem.getFile(this.workingDir,path);
        var result=file.deleteFile(); 
        return result? this._actionCallback():this._actionCallback("cannot delete " + path);
      }
      catch(err)
      {
        this._actionCallback("cannot delete " + path +  ". err: " +  err.message);
      }
    },
    
    rmdir: function(path,callback){
      this.callback=callback;
      try
      {
        var file = Titanium.Filesystem.getFile(this.workingDir,path);
        var result=file.deleteDirectory(true);// true = recursive 
        return result? this._actionCallback():this._actionCallback("cannot delete " + path);
      }
      catch(err)
      {
        this._actionCallback("cannot delete " + path +  ". err: " +  err.message);
      }
    },

    _actionCallback:function(err) {
     if(err){this.callback(err);}
     else{this.callback(null,"OK");}
    },

    _readdir : function(path){
      this.recursionDepth++;
      path = Titanium.Filesystem.getFile(this.homeDir,path|| this.baseDir);
      var content=path.getDirectoryListing();
      this._explore(content);
    },

    _explore:function(content)
    {
       if (!content) {this.callback("Not Found");return; }
       var self=this;
       _.each(content,function(data){
         var info=self._parse(data);
         if(!self._filter(info.name)){
           self.treeContent.push(info);
           if(info.isDir){self._readdir(info.path);}
         }
       });
       if (this.recursionDepth--===0){ 
         this.callback(null,this.treeContent);
       }
    },
    _filter:function(name)
    {
      return (name ===".DS_Store" || name ===".Thumbs.db" || name ===".ignore"); 
    },
    _parse: function(data)
    {
       var fd= new FileDescriptor();
       fd.name = data.name();
       fd.path = data.nativePath().replace(this.homeDir.nativePath(),""); 
       fd.createTimestamp =this._parseTimestamp(data.createTimestamp()); 
       fd.lastTimestamp =this._parseTimestamp(data.modificationTimestamp());
       fd.isDir =data.isDirectory();
       fd.size= !fd.isDir? data.size():null;// null the size when dir as webdav doesn't give size info for folder;
       if (fd.isDir){fd.path+=this.sep;}
       fd.relativePath = fd.path.replace(this.queryPath,""); 
       return fd;
     },

    _parseTimestamp:function(timestamp)
    {
      //titanium return timestamp at the microsecond in localtime. we compare at the millisecond in UTC time
     return new Date((timestamp/1000 +(new Date().getTimezoneOffset())*60000)).getTime();
    }

  });

  return LocalFsAdapter;
});

