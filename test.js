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
    throw new Error("Test failure.");
}

checkSource([], 'test');
checkSource(['yay'], 'test\nrequire("yay")');
checkSource(['yay', 'yay2'], 'test"this is a require(\'string\')"\nrequire("yay"),require("yay2")');

console.log('All tests passed');