// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   reactStrictMode:false, 
//   // Disable React strict mode, otherwise it will cause the problem of dubble api calls.
//   // this is a feature of react.
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable React strict mode
  webpackDevMiddleware: (config) => {
    config.watchOptions = {
      poll: 1000, // Check for changes every second
      aggregateTimeout: 300, // Delay before rebuilding
    };
    return config;
  },
};

//strict mode is disabled because it will cause the problem of dubble api calls.

module.exports = nextConfig;