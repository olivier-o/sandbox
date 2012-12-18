define(["davFSAdapter"], function(DavFSAdapter) {
  var davFsAdapter=null;
  describe("davFSAdapter", function() {
    beforeEach(function(){
      davFSAdapter = new DavFSAdapter();
      davFSAdapter.initialize('webdav.dev', 80, 'http');
   });
  
  it('should return an error when path to read does not exist =>read sandbox/notExistingFolder/ ', function(done){
      davFSAdapter.readdir('/sandbox/notExistingFolder/', function(err, res){
        if (err){ 
           expect(err).to.equal("Not Found");
        done();
        }
        else{
        done("error");
        }
      });
    });

  it('should return false when path to check does not exist =>isDir sandbox/notExistingFolder/ ', function(done){
      davFSAdapter.isDir('/sandbox/notExistingFolder/', function(result){
           expect(result).to.equal(false);
           done();
      });
    });
  
  it('should return false when url to check does not exist =>isDir http://webdav.dev/sandbox/notExistingFolder/ ', function(done){
      davFSAdapter.isDir('http://webdav.dev/sandbox/notExistingFolder/', function(result){
           expect(result).to.equal(false);
           done();
      });
    });

   it('should make dir  /sandbox/level1/level2/level3/ ', function(done){
     davFSAdapter.mkdir('/sandbox/level1/level2/level3/', function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
     });
    });
   
 it('should return true when path to check exists =>isDir /sandbox/level1/ ', function(done){
      davFSAdapter.isDir('/sandbox/level1/', function(result){
           expect(result).to.equal(true);
           done();
      });
    });

   it('should create a file in sandbox/level1/ ', function(done){
      davFSAdapter.write('/sandbox/level1/file1.txt','content in sandbox/level1 file1', function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });

   it('should create a file in sandbox/level1/level2/level3 ', function(done){
      davFSAdapter.write('/sandbox/level1/level2/level3/file3.txt','content in level3 file3', function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });

   
    it('should read a file in sandbox/level1/level2/level3 ', function(done){
      davFSAdapter.read('/sandbox/level1/level2/level3/file3.txt', function(err, res){
        if (err) {return done(err);}
        expect(res.toString()).to.equal('content in level3 file3');
        done();
      });
    });
   
    it('should copy file file3.txt to file3(copy).txt ', function(done){
      davFSAdapter.copy('/sandbox/level1/level2/level3/file3.txt','/sandbox/level1/level2/level3/file3(copy).txt', function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });
/* 
 * === NOT required as webdav library seems not to handle the creation of binary file. Creation is handed over to shipper object 
 it('should create a file in an non existing path in sandbox/level1/level2/level3/level4 ', function(done){
      davFSAdapter.write('/sandbox/level1/level2/level3/level4/file4.txt','content in level4 file4', function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });
*/

  it('should read dir in sandbox and find 6 elements ', function(done){
      davFSAdapter.readdir('/sandbox/', function(err, res){
        if (err) {return done(err);}
        res.should.have.length(6);
        done();
      });
    });
    
    it('should remove level1/ in sandbox ', function(done){

      davFSAdapter.rmdir('/sandbox/level1/', function(err, res){
        if (err) {return done(err);}
        expect(res).to.equal("OK");
        done();
      });
    });

  it('should read dir in sandbox and find 0 element ', function(done){
      davFSAdapter.readdir('/sandbox/', function(err, res){
        if (err) {return done(err);}
        res.should.have.length(0);
        done();
      });
    });
  
  });
   return { name: "davFSAdapter" };
});
