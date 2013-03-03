var controller =
    process.env.USE_INSTRUMENTED ? require('../../lib-cov/controller.js') : require('../../lib/controller.js');