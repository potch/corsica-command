function parseCommand(command) {

  /* Parse space separated tokens, allowing for both quotes and escaping quotes. */
  function parser(str) {
    var tokens = [];
    var quotes = false;
    var curToken = '';

    function _push() {
      if (curToken) {
        tokens.push(curToken);
      }
      curToken = '';
    }

    for (var i = 0; i < str.length; i++) {
      if (str[i] === '\\') {
        i++;
        curToken += str[i];
      } else {
        if (quotes) {
          if (str[i] === '"') {
            quotes = false;
            _push();
          } else {
            curToken += str[i];
          }
        } else {
          if (str[i] === '"') {
            quotes = true;
          } else if (str[i] === ' ') {
            _push();
          } else {
            curToken += str[i];
          }
        }
      }
    }

    _push();

    return tokens;
  }

  var msg = {};

  var tokens = parser(command);
  var msgType = tokens[0];
  var parsedUrl;
  try {
    parsedUrl = new URL(tokens[0]);
    msgType = 'url'
  } catch (e) {
  }

  msg._args = [];
  msg.raw = command;
  tokens.slice(1).forEach(function(token) {
    if (token.indexOf('=') > -1) {
      var parts = token.split('=');
      msg[parts[0]] = parts.slice(1).join('=');
    } else {
      msg._args.push(token);
    }
  });

  if (msgType === 'url') {
    // Found a url, special case.
    msg.url = tokens[0];
  }
  msg.type = msgType;

  return msg;

}
