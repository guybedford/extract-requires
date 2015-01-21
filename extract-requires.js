module.exports = function(src, requireName) {
  var requires = [];

  // mode variables
  var singleQuote = false,
    doubleQuote = false,
    regex = false,
    blockComment = false,
    lineComment = false;

  // character buffer
  var lastChar, curChar, 
    nextChar = src.charAt(0);

  // require statement detection state
  // states are cumulative, one leads to the other
  // if one fails, all reset
  var checkingRequire,
    readingCall,
    callRequireMatchLength,
    seekOpenBracket,
    seekRequireString,
    inRequireString,
    requireString,
    seekCloseBracket;

  notRequire();

  function notRequire() {
    checkingRequire = false;
    readingCall = false;
    seekOpenBracket = false;
    seekRequireString = false;
    inRequireString = false;
    seekCloseBracket = false;
  }

  for (var i = src.substr(0, 1) == '\uFEFF' ? 1 : 0, l = src.length; i < l; i++) {
    lastChar = curChar;
    curChar = nextChar;
    nextChar = src.charAt(i + 1);

    if (singleQuote || doubleQuote) {
      if (singleQuote && curChar === "'" && lastChar !== '\\'
        || doubleQuote && curChar === '"' && lastChar !== '\\') {
      
        singleQuote = doubleQuote = false;
      
        if (inRequireString) {
          inRequireString = false;
          seekCloseBracket = true;
        }
      }
      else {
        if (inRequireString)
          requireString += curChar;
      }
    }

    else if (regex) {
      if (curChar === '/'  && lastChar !== '\\')
        regex = false;
    }

    else if (blockComment) {
      if (curChar === '/' && lastChar === '*')
        blockComment = false;
    }
    
    else if (lineComment) {
      if (nextChar === '\n' || nextChar === '\r' || nextChar == '')
        lineComment = false;
    }

    else {
      doubleQuote = curChar === '"';
      singleQuote = curChar === "'";

      if (checkingRequire) {
        if (readingCall) {
          if (curChar !== requireName.substr(callRequireMatchLength++, 1))
            notRequire();

          if (callRequireMatchLength == requireName.length) {
            seekOpenBracket = true;
            readingCall = false;
          }
        }
        else if (seekOpenBracket || seekRequireString || seekCloseBracket) {
          if (seekOpenBracket && curChar === '(') {
            seekOpenBracket = false;
            seekRequireString = true;
          }
          else if (seekRequireString && (singleQuote || doubleQuote)) {
            inRequireString = true;
            requireString = '';
            seekRequireString = false;
          }
          else if (seekCloseBracket && curChar === ')') {
            checkingRequire = false;
            requires.push(requireString);
            seekCloseBracket = false;
          }
          else if (curChar !== ' ')
            notRequire();
        }
      }

      // new check
      if (!checkingRequire && curChar === requireName.substr(0, 1) && !lastChar.match(/$_a-zA-Z\xA0-\uFFFF/)) {
        checkingRequire = true;
        readingCall = true;
        callRequireMatchLength = 1;
      }

      if (curChar !== '/')
        continue;
      
      if (nextChar === '*') {
        blockComment = true;
      }
      else if (nextChar === '/') {
        lineComment = true;
        if (checkingRequire)
          notRequire();
      }
      else {
        regex = true;
        if (checkingRequire)
          notRequire();
      }
    }
  }
  return requires;
}