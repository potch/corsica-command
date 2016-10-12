var server = 'http://corsica.mozilla.io/';
var defaultScreen = 'ambient3';

function sendCommand(command, screen) {
  command += ' screen=' + (screen || defaultScreen);

  var xhr = new XMLHttpRequest();
  xhr.open('POST', server + 'api/command', true);

  xhr.send(
    new Blob(
      [JSON.stringify({
        raw:command
      })],
      {'type': 'application/json'}
    )
  );
}

function api(path, body) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', server + 'api/' + path, true);
	xhr.onload = function () {
      resolve(JSON.parse(xhr.response))
    };
    xhr.onerror = function (...args) {
      console.log('oh dear, there seems to have been an error');
      reject(...args);
    };
    if (body) {
      xhr.send(
        new Blob(
          [JSON.stringify(body)],
          {'type': 'application/json'}
        )
      );
    } else {
      xhr.send();
    }
  });
}

function handler(e) {
  var tgt = e.target;
  var command = tgt.getAttribute('data-command');
  if (command) {
    sendCommand(command);
    if (command === 'http://openpuppies.com/') {
      console.log(puppies);
      puppies++;
      localStorage.setItem('puppies', puppies);
      if (puppies % 50 === 0) {
        var pEl = document.querySelector('.count');
        pEl.innerHTML = puppies + ' puppies served!';
        pEl.classList.add('show');
        setTimeout(function () {
          pEl.classList.remove('show');
        }, 3000);
      }
    }
  }
}

function queryParams (url) {
  // Isolate the querystring.
  if (url.indexOf('?') >= 0) {
    url = url.split('?')[1];
  }
  var obj = {};
  var pairs = url.split('&');

  pairs.forEach(function(p) {
    p = p.split('=');
    obj[p[0]] = typeof p[1] === 'undefined' ? true: p[1];
  });

  return obj;
}

function isObject(o) {
  return o && Object.getPrototypeOf(o) === Object.prototype;
}

function text(s) {
  return document.createTextNode(s);
}

function dom(tag, ...els) {
  var el = document.createElement(tag);
  els.forEach(function (o) {
    if (isObject(o)) {
      for (var prop in o) {
        el.setAttribute(prop, o[prop]);
      }
    }
    if (o instanceof Array) {
      o.forEach(el.appendChild.bind(el));
    }
    if (o instanceof Node) {
      el.appendChild(o);
    }
  });
  return el;
}

function wrap(tag) {
  return function (el) {
    if (typeof el === 'string') {
      el = document.createTextNode(el);
    }
    return dom(tag, el);
  };
}

function tagsToObj({settings}) {
  return settings.tags.reduce(function (obj, curr) {
    obj[curr.name] = curr.commands
    return obj;
  }, {});
}

function parse(command) {
  var obj = parseCommand(command);
  obj.toString = function () {
    return this.comment || this.url || this.raw;
  };
  return obj;
}

document.body.addEventListener('click', function (e) {
  if (e.target.getAttribute('data-command')) {
    sendCommand(
      e.target.getAttribute('data-command'),
      e.target.getAttribute('data-screen')
    );
  }
});

Promise.all([
  api('settings.get', {plugin:'tags'}).then(tagsToObj),
  api('tags.getSubscriptions'),
  api('census.clients')
]).then(function ([tags, {subscriptions}, {clients}]) {
  clients = clients.sort((a, b) => a.toLowerCase() > b.toLowerCase() ? 1: -1);
  clients.forEach(function (client) {
    var el = dom('details',
      dom('summary', dom('h1', text(client))),
      dom('ul', subscriptions[client].map((tag) => dom('li',
        dom('h2', text('Tag "' + tag + '"')),
        dom('ul',
          (tags[tag]||[]).map(parse).map((cmd) => dom('li',
            dom('button',
              {
                'data-command': cmd.raw,
                'data-screen': client
              },
              text(cmd.toString())
            )
          ))
        )
      )))
    );
    document.body.appendChild(el);
  });
}).catch(console.error.bind(console));
