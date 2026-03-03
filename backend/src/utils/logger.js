const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  green: "\x1b[32m",
};

const log = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  
  if (process.env.NODE_ENV === "production") {
    console.log(JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...args,
    }));
  } else {
    console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${timestamp} - ${message}`, ...args);
  }
};

const logger = {
  info: (message, ...args) => log("blue", message, ...args),
  warn: (message, ...args) => log("yellow", message, ...args),
  error: (message, ...args) => log("red", message, ...args),
  success: (message, ...args) => log("green", message, ...args),
  debug: (message, ...args) => {
    if (process.env.NODE_ENV !== "production") {
      log("blue", "[DEBUG]", message, ...args);
    }
  },
};

module.exports = logger;

