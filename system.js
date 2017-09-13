class NotFoundError extends Error {}

class File {
  constructor(contents) {
    const header = `
      (function() {
        stdout = {
          log: function(output) {
            postMessage([output]);
          }
        }
    `
    const footer = '})();'
    const blob = new Blob([header, contents, footer], {type: 'application/javascript'});
    this.url = URL.createObjectURL(blob);
  }
}

class FileSystem {
  constructor(storage) {
    this.storage = storage;
  }

  read(path) {
    return new Promise((resolve, reject) => {
      const file = this.storage.getItem(path);
      if (file) {
        return resolve(new File(file));
      } else {
        const err = new NotFoundError('File not found: ' + path);
        return reject(err);
      }
    });
  }
}

class Process {
  constructor(file) {
    this.file = file;
    this.stream = {
      subscribers: [],
      log: function(output) {
        this.subscribers.forEach((sub) => sub.call(this, output));
      }
    }
  }

  run() {
    const worker = new Worker(this.file.url);
    worker.addEventListener('message', this._handleMessage.bind(this));
  }

  _handleMessage(msg) {
    this.stream.log(msg.data);
  }

  onLog(cb) {
    this.stream.subscribers.push(cb);
  }
}

class System {
  constructor(context) {
    this.context = context;
    this.subscribers = [];
  }

  run(path) {
    const localStorage = this.context.localStorage;
    const fs = new FileSystem(localStorage);

    return fs.read(path)
      .then((file) => {
        const proc = new Process(file);
        proc.onLog(this._handleLog.bind(this));
        proc.run()
      });
  }

  onLog(cb) {
    this.subscribers.push(cb);
  }

  _handleLog(lines) {
    this.subscribers.forEach((sub) => sub.call(this, lines));
  }
}
