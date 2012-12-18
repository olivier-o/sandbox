define(["diffScanner"], function(DiffScanner) {
  describe("diffScanner", function() {
    it('should have a leftSide', function() {
      var diffScanner = new DiffScanner();
      expect(diffScanner.leftSide).to.be.instanceof(Array);
    });
    it('should have a rightSide', function() {
      var diffScanner = new DiffScanner();
      expect(diffScanner.rightSide).to.be.instanceof(Array);
    });

    it('should return 3 arrays when process is fired', function() {
      var diffScanner = new DiffScanner();
      var result = diffScanner.process();
      expect(result.writables).to.be.instanceof(Array);
      expect(result.ignored).to.be.instanceof(Array);
      expect(result.errors).to.be.instanceof(Array);

    });
   
    it('should return 1 ignored when file.size =0 ', function() {
      var diffScanner = new DiffScanner({leftSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:0,lastTimestamp:"20120615_204023" }],
                                         rightSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:0,lastTimestamp:"20120615_204023" }]
                                         });
      var result = diffScanner.process();
      expect(result.ignored.length).to.equal(1);
    });

    it('should return 0 error when only new files are in the leftSide', function() {
      var diffScanner = new DiffScanner({leftSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,lastTimestamp:"20120615_204023" }]});
      var result = diffScanner.process();
      expect(result.errors.length).to.equal(0);
    });
 
    it('should return 1 writables when only new files are in the leftSide and rightSide is empty ', function() {
      var diffScanner = new DiffScanner({leftSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,lastTimestamp:"20120615_204023" }],
                                         rightSide:[]});
      var result = diffScanner.process();
      expect(result.writables.length).to.equal(1);
    });

    it('should return 1 writables when only 1 new files is in the leftSide', function() {
      var diffScanner = new DiffScanner({
        leftSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,lastTimestamp:"20120615_204023" },
                  {relativePath:"/level1/level2/file2.txt",name:"file2.txt",size:1000,lastTimestamp:"20120615_204023" }],
        rightSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,lastTimestamp:"20120615_204023" }]
        });
      var result = diffScanner.process();
      expect(result.writables.length).to.equal(1);
      expect(result.writables[0].name).to.equal("file2.txt");

    });
    it('should return 1 ignored when 1 file is identical on both side', function() {
      var diffScanner = new DiffScanner({
        leftSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,lastTimestamp:"20120615_204023" },
                  {relativePath:"/level1/level2/file2.txt",name:"file2.txt",size:1000,lastTimestamp:"20120615_204023" }],
        rightSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,lastTimestamp:"20120615_204023" }]
        });
      var result = diffScanner.process();
      expect(result.ignored.length).to.equal(1);
      expect(result.ignored[0].name).to.equal("file1.txt");

    });
it('should return 1 error with rightSide newer when lastTimestamp is newer on the right side for the same file', function() {
      var diffScanner = new DiffScanner({
        leftSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,lastTimestamp:"20120615_204023" },
                  {relativePath:"/level1/level2/file2.txt",name:"file2.txt",size:1000,lastTimestamp:"20120615_204023" }],
        rightSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,lastTimestamp:"20120615_204025" }]
        });
      var result = diffScanner.process();
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0].ref).to.equal("file1.txt");
      expect(result.errors[0].msg).to.equal("destination newer");

    });

it('should return 1 error with size differ when size is != on the right side for the same file', function() {
      var diffScanner = new DiffScanner({
        leftSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,lastTimestamp:"20120615_204023" },
                  {relativePath:"/level1/level2/file2.txt",name:"file2.txt",size:1000,lastTimestamp:"20120615_204023" }],
        rightSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:999,lastTimestamp:"20120615_204023" }]
        });
      var result = diffScanner.process();
      expect(result.errors.length).to.equal(1);
      expect(result.errors[0].ref).to.equal("file1.txt");
      expect(result.errors[0].msg).to.equal("size differ for same timestamp");

    });

    it('should return 1 removable when right side contain 1 element that is not  present in leftSide', function() {
      var diffScanner = new DiffScanner({
        leftSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,lastTimestamp:"20120615_204023" },
                  {relativePath:"/level1/level2/file2.txt",name:"file2.txt",size:1000,lastTimestamp:"20120615_204023" }],
        rightSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:999,lastTimestamp:"20120615_204023" },
                   {relativePath:"/level1/level2/file3.txt",name:"file3.txt",size:999,lastTimestamp:"20120615_204023" }
                  ]});
      var result = diffScanner.process();
      expect(result.writables.length).to.equal(1);
      expect(result.errors.length).to.equal(1);
      expect(result.removables.length).to.equal(1);
      expect(result.removables[0].name).to.equal("file3.txt");
    });


    it('should return 0 writables when only timestamp changed', function() {
      var diffScanner = new DiffScanner({
        leftSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,createTimestamp:"20120615_222222" ,lastTimestamp:"20120615_222222" },
                  {relativePath:"/level1/level2/file2.txt",name:"file2.txt",size:1000,createTimestamp:"20120615_222222",lastTimestamp:"20120615_222222"  }],
        rightSide:[{relativePath:"/level1/level2/file1.txt",name:"file1.txt",size:1000,createTimestamp:"20120615_204023" ,lastTimestamp:"20120615_204023" },
                   {relativePath:"/level1/level2/file2.txt",name:"file2.txt",size:1000,createTimestamp:"20120615_204023",lastTimestamp:"20120615_204023"  }
                  ]});
      var result = diffScanner.process();
      expect(result.writables.length).to.equal(0);
      expect(result.ignored.length).to.equal(2);
      expect(result.errors.length).to.equal(0);
      expect(result.removables.length).to.equal(0);
    });


     });
  
   return { name: "diffScanner" };
});
