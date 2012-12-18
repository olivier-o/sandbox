define(["davFSAdapter","localFSAdapter","shipper","localLogger","fileSync"], function(DavFSAdapter,LocalFSAdapter,Shipper,LocalLogger,FileSync) {
  var fileSync=null;
  var davFSAdapter=null;
  var localFSAdapter=null;
  var shipper=null;
  var localLogger=null;

  var testOnComplete= function(){};//function(item){alert (item +":is being processed");};
  var testOnProgress= function(){};//function(item){alert (item +":is being processed");};
  var testOnError= function(){return;};//function(item){alert ("Error on processing: " + item);};
  var forceSync=true;

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
     

      
       repoBuilder.mkdir('/sandbox/version1/level1/level2/level3/level4/level5',
             function(error,content){
               if (error){alert(error);}
               objHolder.write('/sandbox/version1/level1/file1.txt','content in sandbox/level1 file1',
                         function(){
                           objHolder.write('/sandbox/version1/level1/level2/level3/level4/file4.txt','content in level4 file4',function(){
                             initLocalRepo();
                             logger = new LocalLogger({local:new LocalFSAdapter(),path:'/sandbox/.ignore/fileSyncLogger.txt'});
                             shipper= new Shipper("",logger);
                             fileSync = new FileSync();
                             fileSync.initialize(localFSAdapter,davFSAdapter,shipper,logger);
                             done();
                           });});}); 
    
   };
   
   var initLocalRepo= function(){
      localFSAdapter= new LocalFSAdapter();
      localFSAdapter.initialize();
      //localFSAdapter.initialize('sandbox');
   }; 


  describe("fileSync", function() {
    before(function(done){
      initDavRepo(done);
          });
    
    //cleanup!
    after(function(){
      localFSAdapter.rmdir("/sandbox/level1/",function(){return;});
      davFSAdapter.rmdir("/sandbox/version1/", function(err, res){
        if (err) {alert(err +" (folder may have been deleted by previous test...no worries!)");}
      });
      
     });
    
    
    it('should be initialized ', function() {
      expect(fileSync).to.be.instanceof(Object);
    });
     
 it('should have 5 element when checkingOut sandbox/level1/ (server => local) ', function(done){
     fileSync.checkOut({source:"/sandbox/version1/level1/",destination:"/sandbox/level1/"},forceSync,{onProgress:testOnProgress, onError:testOnError, onComplete: function( res){
        if (res.errors>0) {return done(res.errors);}
        localFSAdapter.readdir('/sandbox/level1/', function(err, res){
          if (err) {return done(err);}
          res.should.have.length(5);
        });
        done();
     }});
    });
    


    it('should have pdf elements when checkingIn (local => server) ', function(done){
     var destinationPath="/sandbox/version1/binaries/";
     fileSync.checkIn({source:"/sandbox/binaries/",destination:destinationPath},forceSync,{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
                                    if (res.errors>0) {return done(res.errors);}
                                     davFSAdapter.readdir( destinationPath, function(err, res){
                                       if (err) {return done(err);}
                                     res.should.have.length(1);
                                     done();
                                     });
                                     }});
    });

  
    it('should report error when checkingOut path that does not exist on server ', function(done){
      var destinationPath="/sandbox/noneExistingFolder/";
      fileSync.checkOut({source:"/sandbox/noneExistingFolder/",destination:destinationPath},forceSync,{onProgress:testOnProgress, onComplete:testOnComplete, onError: function(err, res){
                                     if (err) {
                                        expect(err).to.equal("error reading source path: /sandbox/noneExistingFolder/ Not Found");
                                        done();
                                     } else {
                                       done("should haved report error");
                                     } 
                                     }});
    });

   it('should report error when checkingIn path that does not exist on local', function(done){
     var destinationPath="/sandbox/noneExistingFolder/";
     fileSync.checkIn({source:"/sandbox/noneExistingFolder/",destination:destinationPath},forceSync,{onProgress:testOnProgress, onComplete:testOnComplete, onError: function(err, res){
                                     if (err) {
                                        expect(err).to.equal("error reading source path: /sandbox/noneExistingFolder/ Not Found");
                                        done();
                                     } else {
                                       done("should haved report error");
                                     } 
                                     }});
    });

   it('should have 8 elements when checkingOut (server => local) ', function(done){
     var destinationPath="/sandbox/";
     fileSync.checkOut({source:"/sandbox/version1/",destination:destinationPath},forceSync,{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
                                     if (res.errors>0) {return done(res.errors);}
                                     localFSAdapter.readdir(destinationPath, function(err, res){
                                       if (err) {return done(err);}
                                     res.should.have.length(8);
                                     done();
                                     });
                                     }});
    });

   it('should have no new element when checkin out twice in a row', function(done){
     var destinationPath="/sandbox/";
     fileSync.checkOut({source:"/sandbox/version1/",destination:destinationPath},forceSync,{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
       expect(res.added).to.equal(0);                              
                                     done();
                       }});
    });


   it('should create  newfile.txt in /sandbox/level1/ ', function(done){
        localFSAdapter.write('/sandbox/level1/newfile.txt','newfile in file1', function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });

   it('should have 9 elements when checkingIn (local => server) ', function(done){
     var destinationPath="/sandbox/version1/";
     fileSync.checkIn({source:"/sandbox/",destination:destinationPath},forceSync,{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
       if (res.errors>0) {return done(res.errors);}

        davFSAdapter = getDavFSAdapter();
        davFSAdapter.readdir(destinationPath, function(err, res){
          if (err) {return done(err);}
          res.should.have.length(9);
        });
        done();
     }});
    });
    
    it('should modify newfile.txt in /sandbox/level1/ === PAUSE 1 sec to change time stamp === ', function(done){
        setTimeout(function(){
          localFSAdapter.write('/sandbox/level1/newfile.txt','content modified with an new content', function(err, res){
            if (err) {return done(err);}
            expect(res).to.equal("OK");
            done();
          });
      },1000);//put a delay to change timestamp and validate next test
    });
    
    it('should update the content of newfile.txt  to "content modified" on the server once checkIn (local => server) ', function(done){
     //   setTimeout(function(){
     var destinationPath="/sandbox/version1/";
     fileSync.checkIn({source:"/sandbox/",destination:destinationPath},forceSync,{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
        if (res.errors>0) {return done(res.errors);}
       
        davFSAdapter = getDavFSAdapter();
        davFSAdapter.read(destinationPath +'level1/newfile.txt', function(err, content){
          if (err) {return done(err);}
          expect(content).to.equal("content modified with an new content");
          done();
        });
     }});
   //   },1000);//put a delay to change timestamp and validate next test
    });

    
    it('should delete file level1/file1.txt in local repo', function(done){
      localFSAdapter.rm('/sandbox/level1/file1.txt',function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });

    it('should delete folder level4 in local repo', function(done){
      localFSAdapter.rmdir('/sandbox/level1/level2/level3/level4/',function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });
        
    it('should have 4 elements when checkingIn (local => server) ', function(done){
     var destinationPath="/sandbox/version1/";
      fileSync.checkIn({source:"/sandbox/",destination:destinationPath},forceSync,{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
        if (res.errors>0) {return done(res.errors);}
        davFSAdapter = getDavFSAdapter();
        davFSAdapter.readdir(destinationPath, function(err, res){
          if (err) {return done(err);}
          res.should.have.length(4);
        });
        done();
     }});
     });

  it('should delete folder level1 on the server ', function(done){
      davFSAdapter = getDavFSAdapter();
      davFSAdapter.rmdir('/sandbox/version1/level1/',function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });
   
  it('should have 4 elements when checkingIn (local => server) ', function(done){
    var destinationPath="/sandbox/version1/";
    fileSync.checkIn({source:"/sandbox/",destination:destinationPath},forceSync,{onProgress:testOnProgress, onError:testOnError, onComplete: function(res){
     if (res.errors>0) {return done(res.errors);}
       
        davFSAdapter = getDavFSAdapter();
        davFSAdapter.readdir(destinationPath, function(err, res){
          if (err) {return done(err);}
          res.should.have.length(0);
        });
        done();
     }});
    });
  /*
  it('should delete folder level1 on the server ', function(done){
      davFSAdapter = getDavFSAdapter();
      davFSAdapter.rmdir('/sandbox/level1/',function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });
   
    it('should have 0 element when checkingOut (server => local) ', function(done){
     fileSync.checkOut("/sandbox/",forceSync,{onProgress:testOnProgress, onError:testOnError, onComplete: function(err, res){
        if (err) {return done(err);}
       
        localFSAdapter.readdir('/sandbox/', function(err, res){
          if (err) {return done(err);}
          res.should.have.length(0);
        });
        done();
     }});
    });
   */
  });
  return { name: "fileSync" };
});
