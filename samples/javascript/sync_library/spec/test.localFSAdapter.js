define(["localFSAdapter"], function(LocalFSAdapter) {
  var localFSAdapter;
  describe("localFSAdapter", function() {
    beforeEach(function(){
      localFSAdapter = new LocalFSAdapter();
      localFSAdapter.initialize('sandbox');
   });

   it('should initialize baseDir ', function(){
       expect(localFSAdapter.baseDir).to.equal("sandbox");
    });


    it('should return false when path to check does not exist =>isDir /notExistingFolder/ ', function(done){
      localFSAdapter.isDir('/notExistingFolder/', function(result){
           expect(result).to.equal(false);
           done();
      });
    });


  //------------------------ action  ----------------------------------------------//
   it('should make dir level1/level2/level3 ', function(done){
        localFSAdapter.mkdir('/level1/level2/level3/', function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        //res.should.equal.to("OK");
        done();
      });
    });

 it('should return true when path to check exists =>isDir /sandbox/level1/ ', function(done){
      localFSAdapter.isDir('/level1/', function(result){
           expect(result).to.equal(true);
           done();
      });
    });




 //------------------------ ----------------------------------------------//
    it('should create a file in level1/ ', function(done){
        localFSAdapter.write('/level1/file1.txt','content in level1 file1', function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });

    it('should create a file in level1/level2/level3 ', function(done){
      localFSAdapter.write('/level1/level2/level3/file3.txt','content in level3 file3', function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });

    it('should read a file in level1/level2/level3 ', function(done){
      localFSAdapter.read('/level1/level2/level3/file3.txt', function(err, res){
        if (err) {return done(err);}
        expect(res.toString()).to.equal('content in level3 file3');
        done();
      });
    });

    it('should create a file in level1/level2/level3/level4 ', function(done){
      localFSAdapter.write('/level1/level2/level3/level4/file4.txt','content in level4 file4', function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });

    it('should read dir in sandbox/level1 and find 6 elements ', function(done){
      localFSAdapter.readdir('/sandbox/level1/', function(err, res){
        if (err) {return done(err);}
        res.should.have.length(6);
        done();
      });
    });
   
   it('should copy file level1/file1.txt to level1/file1(copy).txt ', function(done){
      localFSAdapter.copy('/level1/file1.txt','/level1/file1(copy).txt',function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });


    it('should delete file level1/file1.txt ', function(done){
      localFSAdapter.rm('/level1/file1(copy).txt',function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });
    
    it('should read dir in sandbox/level1/ and find 6 elements ', function(done){
      localFSAdapter.readdir('/sandbox/level1/', function(err, res){
        if (err) {return done(err);}
        res.should.have.length(6);
        done();
      });
    });
    
    it('should delete folder level1 ', function(done){
      localFSAdapter.rmdir('/level1/',function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });

    it('should check level1 and not found it', function(done){
      localFSAdapter.isDir('/level1/', function(result){
        expect(result).to.equal(false);
        done();
      });
    });
  
  });
   return { name: "localFSAdapter" };
});
