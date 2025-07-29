/**
 * @format
 */

// CRITICAL: Load polyfill BEFORE anything else
console.log("[INDEX] Loading base64 polyfill...")

// Inline polyfill to ensure it loads first
if (typeof global.atob === "undefined") {
  console.log("[INDEX] Installing atob polyfill...")
  global.atob = (str) => {
    try {
      if (typeof Buffer !== "undefined") {
        return Buffer.from(str, "base64").toString("binary")
      }
      // Manual implementation
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
      let result = ""
      let i = 0
      str = str.replace(/[^A-Za-z0-9+/]/g, "")
      while (i < str.length) {
        const e1 = chars.indexOf(str.charAt(i++))
        const e2 = chars.indexOf(str.charAt(i++))
        const e3 = chars.indexOf(str.charAt(i++))
        const e4 = chars.indexOf(str.charAt(i++))
        const bitmap = (e1 << 18) | (e2 << 12) | (e3 << 6) | e4
        result += String.fromCharCode((bitmap >> 16) & 255)
        if (e3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255)
        if (e4 !== 64) result += String.fromCharCode(bitmap & 255)
      }
      return result
    } catch (error) {
      console.error("[POLYFILL] atob failed:", error)
      throw new Error("Base64 decode failed: " + error.message)
    }
  }
}

if (typeof global.btoa === "undefined") {
  console.log("[INDEX] Installing btoa polyfill...")
  global.btoa = (str) => {
    try {
      if (typeof Buffer !== "undefined") {
        return Buffer.from(str, "binary").toString("base64")
      }
      // Manual implementation
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
      let result = ""
      let i = 0
      while (i < str.length) {
        const a = str.charCodeAt(i++)
        const b = i < str.length ? str.charCodeAt(i++) : 0
        const c = i < str.length ? str.charCodeAt(i++) : 0
        const bitmap = (a << 16) | (b << 8) | c
        result += chars.charAt((bitmap >> 18) & 63)
        result += chars.charAt((bitmap >> 12) & 63)
        result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : "="
        result += i - 1 < str.length ? chars.charAt(bitmap & 63) : "="
      }
      return result
    } catch (error) {
      console.error("[POLYFILL] btoa failed:", error)
      throw new Error("Base64 encode failed: " + error.message)
    }
  }
}

console.log("[INDEX] ✅ Base64 polyfill loaded successfully")
console.log("[INDEX] atob available:", typeof global.atob)
console.log("[INDEX] btoa available:", typeof global.btoa)

import { AppRegistry } from "react-native"
import App from "./App"
import { name as appName } from "./app.json"

console.log("[INDEX] Registering app component...")
AppRegistry.registerComponent(appName, () => App)
console.log("[INDEX] ✅ App registered successfully")
