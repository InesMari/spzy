var promisify = function (fn) {
  return function (options = {}) {
    return new Promise((resolve, reject) => {
      options.success = res => { resolve(res); };
      options.fail = res => { reject(res); };
      fn(options);
    });
  };
};

export default promisify;