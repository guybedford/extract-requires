var cjsRequireRegEx = /(?:^\uFEFF?|[^$_a-zA-Z\xA0-\uFFFF."'])require\s*\(\s*("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')\s*\)/g;

var newLineRegEx = /\n|\r/g;
var blockCommentEndRegEx = /\*\//g;

// find characters that change state
var stateRegEx = /"|'|\/\/|\/\*|\//g;
var endWhiteStateRegEx = /\S/g;

var regExEndRegEx = /\/|\n|\r/g;

// walk functions assume a mode, and return the index at the end of that mode
function walkString(str, doubleQuote, index) {
  var backtrack;
  while (index = str.indexOf(doubleQuote ? '"' : "'", index + 1)) {
    // check even number of \\ to know its the right string end
    backtrack = index;
    while (str.charAt(--backtrack) == '\\');
    if ((index - backtrack) % 2)
      return index + 1;
  }
  return str.length - 1;
}
function walkRegEx(str, index) {
  var backtrack, match;
  regExEndRegEx.lastIndex = index + 1;
  while (match = regExEndRegEx.exec(str)) {
    // newline terminates regex, may have been confused for division
    if (match[0] !== '/')
      return regExEndRegEx.lastIndex;

    backtrack = regExEndRegEx.lastIndex;
    while (str.charAt(--backtrack) == '\\');
    if ((regExEndRegEx.lastIndex - backtrack) % 2)
      return regExEndRegEx.lastIndex;
  }
  return str.length - 1;
}
function walkBlockComment(str, index) {
  blockCommentEndRegEx.lastIndex = index;
  blockCommentEndRegEx.exec(str);
  return blockCommentEndRegEx.lastIndex || str.length - 1;
}
function walkLineComment(str, index) {
  newLineRegEx.lastIndex = index;
  newLineRegEx.exec(str);
  return newLineRegEx.lastIndex || str.length - 1;
}

module.exports = function(str) {
  // an array of alternating string/comment start/end points in str
  // note regular expressions are not added as ignore zones as they are confusable with division
  var stringsAndCommentIndexes = [];

  stateRegEx.lastIndex = 0;

  // work out these alternative points by seeking ahead to the next state change
  while (match = stateRegEx.exec(str)) {
    var newState = match[0];

    stringsAndCommentIndexes.push(stateRegEx.lastIndex - 1);

    stateRegEx.lastIndex = (newState === '"' || newState === "'") && walkString(str, newState === '"', stateRegEx.lastIndex)
        || newState === '/' && walkRegEx(str, stateRegEx.lastIndex)
        || newState === '//' && walkLineComment(str, stateRegEx.lastIndex)
        || newState === '/*' && walkBlockComment(str, stateRegEx.lastIndex);

    stringsAndCommentIndexes.push(stateRegEx.lastIndex - 1);
  }

  // now run require regex
  var requires = [];
  var lastIndex = 0;
  var l = stringsAndCommentIndexes.length;
  cjsRequireRegEx.lastIndex = 0;
  while (match = cjsRequireRegEx.exec(str)) {
    // if it started in a dead zone, ignore
    var startIndex = cjsRequireRegEx.lastIndex - match[0].length;
    while (lastIndex <= l && stringsAndCommentIndexes[lastIndex++] < startIndex);
    if (lastIndex % 2)
      requires.push(match[1].substr(1, match[1].length - 2));
  }

  return requires;
}