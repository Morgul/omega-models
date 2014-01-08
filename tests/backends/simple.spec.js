// ---------------------------------------------------------------------------------------------------------------------
// Unit Tests for the 'simple' backend.
//
// @module tests/backends/simple.spec.js
// ---------------------------------------------------------------------------------------------------------------------

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var zlib = require("zlib");

var _ = require('lodash');
var async = require("async");

var om = require('../../omega-models');
var SimpleBackend = require('../../lib/backends/simple');
var fields = require('../../lib/fields');

var sampleNS = require('../../examples/sample');

// ---------------------------------------------------------------------------------------------------------------------

describe('SimpleBackend', function()
{

    describe('instantiation', function()
    {
        // Config:
        //  - writeToDisk: Whether or not we should save to disk on writes. Defaults to true.
        //  - gzip: Whether or not we should gzip our on-disk files. Defaults to false.
        //  - root: The path we should store our on-disk files. Defaults to './db'.

        var something;
        function testOptions(description, config, before, after)
        {
            if(before && !after)
            {
                after = before;
                before = undefined;
            } // end if

            var testFunc = function(done)
            {
                var backend = new SimpleBackend(config);
                sampleNS.backend(backend);

                something = new sampleNS.Something({name: 'something'});

                async.series([
                        backend.connect.bind(backend),
                        something.save.bind(something),
                        something.remove.bind(something),
                        after.bind(backend, backend)
                    ],
                    done);
            }; // end testFunc

            if(before && after)
            {
                it(description, function(done)
                    {
                        before(function(err)
                        {
                            assert.ifError(err);
                            testFunc(done);
                        });
                    });
            }
            else
            {
                it(description, testFunc);
            } // end if
        } // end testOptions

        testOptions('can create a basic database', {}, function(backend, done) { done(); });

        var altDBRoot = '/tmp/omega-models-test-simple';
        testOptions('can write the database to an alternate root path',
            {root: altDBRoot},
            function before(done)
            {
                rmRFSync(altDBRoot);
                done();
            },
            function(backend, done)
            {
                // Check whether the DB root path has been created.
                fs.exists(altDBRoot, function(exists)
                {
                    assert(exists);

                    // Check whether the collection was written to the correct path.
                    fs.exists(path.join(altDBRoot, 'Something.sdb'), function(exists)
                    {
                        assert(exists);
                        done();
                    });
                });
            });

        var gzipDBRoot = '/tmp/omega-models-test-gzip';
        testOptions('can gzip the on-disk database',
            {gzip: true, root: gzipDBRoot},
            function before(done)
            {
                rmRFSync(gzipDBRoot);
                done();
            },
            function(backend, done)
            {
                setTimeout(function()
                {
                    // Check whether the DB has been gzipped?
                    var dataStr = fs.readFileSync(path.join(gzipDBRoot, 'Something.sdb'));

                    zlib.gunzip(dataStr, function(err, buffer)
                    {
                        assert.ifError(err);
                        assert.deepEqual(JSON.parse(buffer.toString()), {});

                        done();
                    });
                }.bind(this), 100);
            });

        testOptions('can create a memory-only store',
            {writeToDisk: false},
            function before(done)
            {
                rmRFSync('./db');
                done();
            },
            function after(backend, done)
            {
                // Check that the DB was NOT written to disk.
                fs.exists('./db', function(exists)
                {
                    assert(!exists);
                    done();
                });
            });

    });

    describe('Basic storage API', function()
    {
        var backend;
        var something = new sampleNS.Something({name: 'something'});

        before(function(done)
        {
            backend = new SimpleBackend({writeToDisk: false});
            backend.connect(function(err)
            {
                assert.ifError(err);

                sampleNS.backend(backend);

                done();
            });
        });

        it('can save models', something.save.bind(something));
        it('can remove models', something.remove.bind(something));
    });

    describe('Query API', function()
    {

        var backend;
        var something1 = new sampleNS.Something({name: 'something'});
        var something2 = new sampleNS.Something({name: 'something 2'});
        var somethingElse = new sampleNS.SomethingElse({name: 'somethingElse'});
        var group = new sampleNS.Group({name: 'Test Group'});

        before(function(done)
        {
            backend = new SimpleBackend({writeToDisk: false});
            backend.connect(function(err)
            {
                assert.ifError(err);

                sampleNS.backend(backend);

                somethingElse.group = group;

                async.eachSeries(
                    [something1, something2, somethingElse, group],
                    function(item, callback) { item.save(callback); },
                    done
                    );
            });
        });

        it('can query models using find', function(done)
        {
            backend.find(
                sampleNS.Something,
                {name: 'something'},
                function(err, docs)
                {
                    assert.ifError(err);

                    assert.equal(docs.length, 1);
                    assert.deepEqual(docs[0], something1.$values);

                    done();
                });
        });

        it('can query models using findOne', function(done)
        {
            backend.findOne(
                sampleNS.Something,
                {name: 'something 2'},
                function(err, doc)
                {
                    assert.ifError(err);

                    assert.deepEqual(doc, something2.$values);

                    done();
                });
        });

        it('can update models using findOneAndUpdate', function(done)
        {
            backend.findOneAndUpdate(
                sampleNS.SomethingElse,
                {name: 'somethingElse'},
                {name: 'something squiggly'},
                function(err, doc)
                {
                    assert.ifError(err);

                    assert.deepEqual(_.omit(doc, 'name'), _.omit(somethingElse.$values, 'name'));
                    assert.equal(doc.name, 'something squiggly');

                    done();
                });
        });

        it('can update models using update', function(done)
        {
            backend.update(
                sampleNS.Group,
                {name: 'Test Group'},
                {name: 'some strange group thingy'},
                function(err, doc)
                {
                    assert.ifError(err);

                    backend.findOne(
                        sampleNS.Group,
                        {name: 'some strange group thingy'},
                        function(err, doc)
                        {
                            assert.ifError(err);

                            assert.deepEqual(_.omit(doc, 'name'), _.omit(group.$values, 'name'));
                            assert.equal(doc.name, 'some strange group thingy');

                            done();
                        });
                });
        });

        it('can perform map/reduce queries', function(done)
        {
            backend.mapReduce(
                sampleNS.Something,
                function map(doc)
                {
                    return {fez: doc.name};
                },
                function reduce(accum, item)
                {
                    if(_.isPlainObject(accum))
                    {
                        accum = [accum.fez];
                    } // end if

                    accum.push(item.fez);

                    return accum;
                },
                function(err, results)
                {
                    assert.ifError(err);

                    results.sort();

                    assert.deepEqual(results, [
                        'something',
                        'something 2',
                        ]);

                    done();
                });
        });

    });

});

// ---------------------------------------------------------------------------------------------------------------------

// Recursively remove the given file or directory.
function rmRFSync(pathname)
{
    var stats;
    try
    {
        stats = fs.statSync(pathname);
    }
    catch(exc)
    {
        if(exc.code == 'ENOENT')
        {
            return;
        }
        else
        {
            throw exc;
        } // end if
    } // end try

    if(stats.isDirectory())
    {
        _.each(fs.readdirSync(pathname), function(childName)
        {
            rmRFSync(path.join(pathname, childName));
        });
        fs.rmdirSync(pathname);
    }
    else
    {
        fs.unlinkSync(pathname);
    } // end if
} // rmRFSync
