define('diffScanner',[
    'underscore'
    ], function(_) {

  var DiffScanner=function(options){
    this._configure(options || {});
   this.options = options;
  };
  _.extend(DiffScanner.prototype,
    {
    _configure: function(options) {
      this.options={leftSide:[],rightSide:[]};
      if (this.options) options = _.extend({}, this.options, options);
            this.options = options;
            this.leftSide = this.options.leftSide;
            this.rightSide = this.options.rightSide;

    },

  process: function() {
      var errors=[];
      var writables=[];
      var removables=[];
      var ignored=[];
      var self=this;
      _.each(self.leftSide,function(lfile){
        var found=null;
        _.each(self.rightSide,function(rfile){
          if (self._sanitize(lfile.relativePath) === self._sanitize(rfile.relativePath))
          {
            found=rfile;
            if(lfile.size===0 ){ignored.push(rfile); return; }


            if (lfile.lastTimestamp > rfile.lastTimestamp) //source is newer => to be act on
            {
              if(lfile.isDir){ignored.push(rfile);}
              else if (lfile.size === rfile.size && lfile.createTimestamp === lfile.lastTimestamp){ignored.push(rfile);} // never modified since check out as copy doesn't preserve timestamp.
              else{writables.push(lfile);}
              return;
            }
            if (lfile.lastTimestamp === rfile.lastTimestamp) // source is same => to be ignored
            {
              if (lfile.size === rfile.size){ignored.push(rfile); return;}
              else{errors.push({ref:rfile.name, msg:"size differ for same timestamp",right: rfile,left:lfile});return;} // size differ. it shouldn't!
            }
            if (lfile.lastTimestamp < rfile.lastTimestamp )
            {
              if (lfile.size === rfile.size){ignored.push(rfile); return;} // never modified since check out.
              else{errors.push({ref:rfile.name, msg:"destination newer",right: rfile,left:lfile});return;}// source is older => dest as been modified already.
            }
          }
        });

        if(!found){writables.push(lfile);}
        else{
          // found from the list is removed (splice) so iteration get quicker
          var index=self.rightSide.indexOf(found);
          self.rightSide.splice(index,1);
          found=null; //reset for next iteration;
        }
      });
      removables=this._reduceRemovables(this.rightSide);

      return {writables:writables,removables:removables,ignored:ignored,errors:errors};
    },

    _sanitize:function(path){
      return  path.replace(/\//g,Titanium.Filesystem.getSeparator());
    },

     // when removables contains [{path:level1/level2/},{path:level1/level2/level3/}
     // it should contains only  [{path:level1/level2/}] when return from this method
     // because remove is recursive and removing level1/level2 will remove in the same time level1/level2/level3
    _reduceRemovables:function(allRemovables){
      var removables=[];
      _.each(allRemovables,function(item){
        var isFound=false;
        //if item.path is contained in any of the previously parsed and it's longer then it should not be added, if it's shorter, it should replace the current item
        var i=0;
        for ( i; i < removables.length; i++) {
          // item is a parent element of an already present element, so it should replace it!
          if (removables[i].path.indexOf(item.path) ===0) {
            removables.splice(i,1,item);
            isFound=true;
            break;
          }
          // item is a child element of an already present element, so nothing to do
          if (item.path.indexOf(removables[i].path) ===0) {
            isFound=true;
            break;
          }
        }
        //not already present so it can be added
        if(!isFound){removables.push(item);}
      });
      return removables;
    }
  });
  return DiffScanner;
});
