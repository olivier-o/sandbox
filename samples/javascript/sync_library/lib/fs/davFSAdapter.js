//-----------------------------------------------------------------------------
// DavFSAdapter
//-----------------------------------------------------------------------------
define('davFSAdapter',[
    'underscore',
    'davlib',
    'fileDescriptor'

    ], function(_,Davlib,FileDescriptor) {

  var DavFSAdapter = function() {
  /* High level implementation of a DavFs client wrapper */
    console.log('DavFSAdapter');
  };
  _.extend(DavFSAdapter.prototype,
  {
    initialize: function(host, port, protocol) {
       this.fs = new davlib.DavFS();
       this.fs.initialize(host, port, protocol);
       this.basePath= protocol + "://" + host + ":" + port;
       this.sep="/";
    },

    getFullPath: function(path)
    {
      return this.basePath + path;
    },

    readdir : function(path,callback){
      this.recursionDepth=-1;
      this.treeContent=[];
      this.callback=callback;
      this.queryPath=path;
      this._readdir(path);
    },

    copy : function(path,topath,callback){
      this.callback=callback;
      this.fs.copy(path,topath,this._actionCallback,this);
    },

    write : function(path,content,callback){
      this.callback=callback;

      this.fs.write(path,content,this._actionCallback,this);
    },

    read : function(path,callback){
      this.callback=callback;
      this.fs.read(path,this._actionCallback,this);
    },


    mkdir: function(path,callback){
      this.callback=callback;
      path = this._extractDir(path);
      this.pathToBuild=path;
      this.fs.listDir(path,this._createDir,this);
    },

    isDir:function(path,callback){
     path =this._extractDir(path);
     this.callback=callback;
     this.fs.listDir(path,this._isDirCallback,this);
    },

    _isDirCallback:function(error,content)
    {
      this.callback(!error);
    },

    _extractDir: function(path)
    {
      var lastSep = path.lastIndexOf(this.sep);
      if (lastSep < path.length) {
        path = path.substr(0,lastSep+1); //path end with "/"
      }
      path = path.replace(this.basePath,"");
      return path;
    },


    _createDir:function(error,content){
      if (!error){ this._actionCallback();return;}
      //split in segment
      //
      this.pathSegments = this.pathToBuild.split(this.sep);
      console.log("Path to build: " + this.pathSegments.join());
      this.currentSegment=this.sep;
      this._checkNextSegment();

    },

    _checkNextSegment: function(error,content){
       if (error){
         console.log("ERROR creating " + this.currentSegment);
       }
       else if (this.currentSegment)
       {
         console.log("SUCCESS creating " + this.currentSegment);
       }
       if (this.pathSegments.length===0){this._actionCallback(arguments[0]);return;}
       this.currentSegment+=this.pathSegments.shift()+this.sep;
       console.log("segment to check:" + this.currentSegment);
       this.fs.listDir(this.currentSegment,this._createNextSegment,this);
    },

    _createNextSegment:function(error,content){
       if(error){
         console.log("segment check error: " + this.currentSegment + " =>" + error);
       }
       if(!error){this._checkNextSegment();return;}
       console.log("segment to build:" + this.currentSegment);
       var self=this;

       this.fs.mkDir(this.currentSegment,this._checkNextSegment,this);
        },

    rm : function(path, callback){
         this.rmdir(path,callback);
    },

    rmdir : function(path,callback){
      this.callback=callback;
      this.fs.remove(path,this._rmdirCallback,this);
    },
    _rmdirCallback:function(err) {
     if(err){this.callback(err);}
     else{this.callback(null,"OK");}
    },

    _actionCallback:function(err,content) {
     if(err){this.callback(err);}
     else{
       var success =(content)?content:"OK";
       this.callback(null,success);
     }
    },

    _readdir : function(path){
      this.recursionDepth++;
      this.fs.listDir(path, this._explore,this);
    },

    _explore:function(error, content)
    {
       if (error) {this.callback(error);return;}
       var self=this;
      _.each(content.items,function(data){
          var info =self._parse(data);
          if(!self._filter(info.name)){
            self.treeContent.push(info);
            if(info.isDir) {self._readdir(info.path);}
          }
      });
      if (this.recursionDepth--===0){
        this.callback(null,this.treeContent);
      }
    },

    _filter:function(name)
    {
      return (name ===".DS_Store"  || name ===".Thumbs.db");
    },


    _parse: function(data)
    {
       var davInfo = data.properties['DAV:'];
       var fd= new FileDescriptor();
       fd.name = data.path.pop();
       fd.path = data.href;
       fd.relativePath= fd.path.replace(this.queryPath,"");
       fd.createTimestamp = this._parseCreationDate(davInfo.creationdate.childNodes[0].childNodes[0].nodeValue);
       fd.lastTimestamp = this._parseLastModified(davInfo.getlastmodified.childNodes[0].childNodes[0].nodeValue);
       fd.size=(davInfo.getcontentlength)?  Number(davInfo.getcontentlength.childNodes[0].childNodes[0].nodeValue):null;
       fd.isDir = (davInfo.resourcetype.childNodes[0].childNodes.length!==0)?true:false;
       return fd;
    },

    _parseCreationDate: function(creationDate)
    {
      var d=creationDate.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z/);
      // d[2] -1 => month in javascript start at 0 to 11 instead of 1 to 12
      var timestamp= new Date(d[1], d[2] - 1, d[3], d[4], d[5], d[6]).getTime();
      return timestamp;
    },

    //Fri, 22 Jun 2012 16:45:26 GMT
    _parseLastModified: function(lastModified)
    {
      var month=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      var d=lastModified.match(/.+(\d{2}) (\w{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT/);
      var timestamp= new Date(d[3], month.indexOf(d[2]), d[1], d[4], d[5], d[6]).getTime();
      return timestamp;
    }
  });

  return DavFSAdapter;
});
