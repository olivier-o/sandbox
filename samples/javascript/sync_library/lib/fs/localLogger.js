//-----------------------------------------------------------------------------
// LocalLogger
//-----------------------------------------------------------------------------
define('localLogger',[
    'underscore'
    ], function(_) {
      
  var LocalLogger=function(options){
    this._configure(options || {});
    this.options = options;
  };
  _.extend(LocalLogger.prototype,
    {
    _configure: function(options) {
      this.options={local:null,path:null};
      if (this.options) options = _.extend({}, this.options, options);
            this.options = options;
            this.local = this.options.local;
            this.path = this.options.path;
            this.local.initialize();
            this.writeln("/************** " + new Date() + " *********/");
    },
  write: function(content){
    this.local.append(this.path,content,function(){return;});       
  }, 
  writeln: function(content){
    this.write(content +  Titanium.Filesystem.getLineEnding());       
  } 
     });
    return LocalLogger;
});
