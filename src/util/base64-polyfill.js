// RELEASE-BUILD SAFE Base64 polyfill
console.log("[BASE64-POLYFILL] Loading release-safe base64 polyfill...")

if (typeof global.atob === "undefined") {
  global.atob = (str) => {
    try {
      // Use Buffer if available
      if (typeof Buffer !== "undefined") {
        return Buffer.from(str, "base64").toString("binary")
      }

      // Manual implementation for release builds
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
      let result = ""
      let i = 0

      str = str.replace(/[^A-Za-z0-9+/]/g, "")

      while (i < str.length) {
        const encoded1 = chars.indexOf(str.charAt(i++))
        const encoded2 = chars.indexOf(str.charAt(i++))
        const encoded3 = chars.indexOf(str.charAt(i++))
        const encoded4 = chars.indexOf(str.charAt(i++))

        const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4

        result += String.fromCharCode((bitmap >> 16) & 255)
        if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255)
        if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255)
      }

      return result
    } catch (error) {
      console.error("[BASE64-POLYFILL] atob failed:", error)
      throw new Error("Base64 decode failed")
    }
  }
}

if (typeof global.btoa === "undefined") {
  global.btoa = (str) => {
    try {
      // Use Buffer if available
      if (typeof Buffer !== "undefined") {
        return Buffer.from(str, "binary").toString("base64")
      }

      // Manual implementation for release builds
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
      console.error("[BASE64-POLYFILL] btoa failed:", error)
      throw new Error("Base64 encode failed")
    }
  }
}

console.log("[BASE64-POLYFILL] ✅ Release-safe polyfill loaded")
