var getRequires = require('./extract-requires');

var run = 0;
function checkSource(requires, src) {
  run++;
  var reqs = getRequires(src, 'require');

  var passed = true;
  if (reqs.length != requires.length)
    passed = false;
  for (var i = 0; i < requires.length; i++) {
    if (requires[i] != reqs[i])
      passed = false;
  }
  if (!passed)
    throw new Error("Test failure: " + reqs.join(', '));
}

checkSource([], 'test');
checkSource(['yay'], 'test\nrequire("yay")');
checkSource(['yay', 'yay2'], 'test"this is a require(\'string\')"\nrequire("yay"),require("yay2")');
checkSource(['d1', 'd2require("d3")'], "exports.d1 = require(\n  'd1'\n);\n\nexports.d2 = (require\n('d2require(\"d3\")'));");
checkSource([], 'exports.d4 = "text require(\'still not a dep\') text";');
checkSource([], "exports.d5 = 'text \'quote\' require(\"yet still not a dep\")'");
checkSource([], '/* require(  "dep"  )*/');
checkSource(['dep'], 'require("dep")');
checkSource(['./map-test-dep'], 'exports.maptest = require(\'./map-test-dep\').dep;\n');

console.log('All tests passed');