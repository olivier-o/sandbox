define(["davFSAdapter","localFSAdapter","localLogger","shipper"], function (DavFSAdapter,LocalFSAdapter,LocalLogger,Shipper) {
  var shipper=null;
  var davFSAdapter=null;
  var localFSAdapter=null;
  var localLogger=null;
  var testOnComplete= function(){};//function(item){alert (item +":is being processed");};
  var testOnProgress= function(){};//function(item){alert (item +":is being processed");};
  var testOnError= function(){return;};//function(item){alert ("Error on processing: " + item);};
   
  var UPLOAD_SUCCESS='upload done';
  var DOWNLOAD_SUCCESS='download done';


  var getDavFSAdapter = function() {
    var adapter= new DavFSAdapter();
    adapter.initialize('webdav.dev', 80, 'http');
    //adapter.initialize('cfs-demo.studiocap.net', 80, 'http');
    return adapter;
  };
  var initDavRepo= function(done){
      davFSAdapter = getDavFSAdapter();
      
      var repoBuilder = getDavFSAdapter();
      var objHolder= repoBuilder;

    
      repoBuilder.mkdir('/sandbox/binaries/',
             function(error,content){
               if (error){alert(error);}
               initLocalRepo();
               logger = new LocalLogger({local:new LocalFSAdapter(),path:'/sandbox/.ignore/fileSyncLogger.txt'});
               shipper = new Shipper("",logger);
               done();
              });
   };
   
   var initLocalRepo= function(){
      localFSAdapter= new LocalFSAdapter();
      localFSAdapter.initialize();
      //localFSAdapter.initialize('sandbox');
   }; 


  describe("shipper", function() {
    before(function(done){
      initDavRepo(done);
     // localFSAdapter.rmdir("/sandbox/binaries/",function(){return;});
     // davFSAdapter.rmdir("/sandbox/binaries/", function(err, res){
     //   if (err) {alert(err +" (folder may have been deleted by previous test...no worries!)");}
     // });
    //});

          });
 
    //cleanup!
    after(function(){
      localFSAdapter.rm("/sandbox/binaries/test3.pdf",function(){return;});
      localFSAdapter.rm("/sandbox/binaries/test5.pdf",function(){return;});

      davFSAdapter.rmdir("/sandbox/binaries/", function(err, res){
        if (err) {alert(err +" (folder may have been deleted by previous test...no worries!)");}
      });
    });
    
    it('should be initialized ', function() {
      expect(shipper).to.be.instanceof(Object);
    });

      it('should have empty.txt file with size=0 uploaded as empty.txt', function(done){
     shipper.upload("/sandbox/binaries/empty.txt","http://webdav.dev/sandbox/binaries/empty.txt",{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
                                     if (res !=UPLOAD_SUCCESS) {return done(res);}
                                     davFSAdapter.readdir('/sandbox/binaries/', function(err, res){
                                       if (err) {return done(err);}
                                     res.should.have.length(1);
                                     });
                                     done();
                                     }});
    });



    it('should have test.pdf file uploaded as test2.pdf', function(done){
     shipper.upload("/sandbox/binaries/test.pdf","http://webdav.dev/sandbox/binaries/test2.pdf",{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
                                     if (res !=UPLOAD_SUCCESS) {return done(res);}
                                     davFSAdapter.readdir('/sandbox/binaries/', function(err, res){
                                       if (err) {return done(err);}
                                     res.should.have.length(1);
                                     });
                                     done();
                                     }});
    });
   it('should have test2.pdf download as test3.pdf', function(done){
     shipper.download("http://webdav.dev/sandbox/binaries/test2.pdf","/sandbox/binaries/test3.pdf",{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
                                     if (res !=DOWNLOAD_SUCCESS) {return done(res);}
                                     localFSAdapter.readdir('/sandbox/binaries/', function(err, res){
                                       if (err) {return done(err);}
                                     res.should.have.length(2);
                                     });
                                     done();
     }});
    });


     
    it('should have test3.pdf uploaded as test4.pdf when using transfer method', function(done){
     shipper.transfer({origin:"/sandbox/binaries/test3.pdf",destination:"http://webdav.dev/sandbox/binaries/test4.pdf"},{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
                                     if (res !=UPLOAD_SUCCESS) {return done(res);}
                                     davFSAdapter.readdir('/sandbox/binaries/', function(err, res){
                                       if (err) {return done(err);}
                                     res.should.have.length(2);
                                     });
                                     done();
     }});
    });

 it('should have test4.pdf downloaded as test5.pdf  when using transfer method', function(done){
     shipper.transfer({origin:"http://webdav.dev/sandbox/binaries/test4.pdf",destination:"/sandbox/binaries/test5.pdf"},{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
                                     if (res !=DOWNLOAD_SUCCESS) {return done(res);}
                                     localFSAdapter.readdir('/sandbox/binaries/', function(err, res){
                                       if (err) {return done(err);}
                                     res.should.have.length(3);
                                     });
                                     done();
     }});
    });
  return { name: "shipper" };
});
});
