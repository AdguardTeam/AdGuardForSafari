
module.exports = (() => {

  const _resourcePath = function(resPath) {
      const path = require('path');
      const pr = require('electron').remote ? require('electron').remote.process : process;
      var base = path.dirname(pr.mainModule.filename);
      return path.join(base, resPath);
  };

  return {
    resourcePath: _resourcePath
  };

})();
