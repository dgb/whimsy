class NotFoundError extends Error {}

class File {
  constructor(contents) {
    this.contents = contents;
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

class System {
  constructor(context) {
    this.context = context;
    this.initPath = '/system/init';
  }

  init() {
    const localStorage = this.context.localStorage;
    const fs = new FileSystem(localStorage);

    return fs.read(this.initPath)
      .then((file) => this._runInitProcess(file))
  }

  _runInitProcess(file) {
    const context = this.context;
    new Function(file.contents).bind(context)();
  }
}
