// iOS Safari specific fixes and styling
class IOSHandler {
  // Detect iOS Safari
  static isIOSSafari() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  // Apply iOS Safari specific styling fixes
  static applyIOSFixes() {
    if (this.isIOSSafari()) {
      // Force body background to black
      document.body.style.setProperty("background", "#000000", "important");
      document.body.style.setProperty(
        "background-color",
        "#000000",
        "important"
      );
      document.body.style.setProperty("color", "#ffffff", "important");

      // Force html background to black
      document.documentElement.style.setProperty(
        "background",
        "#000000",
        "important"
      );
      document.documentElement.style.setProperty(
        "background-color",
        "#000000",
        "important"
      );

      // Force color scheme
      document.documentElement.style.setProperty(
        "color-scheme",
        "light only",
        "important"
      );
      document.body.style.setProperty(
        "color-scheme",
        "light only",
        "important"
      );

      // Add additional style overrides
      const style = document.createElement("style");
      style.textContent = `
        * { 
          color-scheme: light only !important; 
          -webkit-color-scheme: light !important; 
        }
        html, body { 
          background: #000000 !important; 
          background-color: #000000 !important; 
        }
        .container { 
          color: #ffffff !important; 
        }
        .profile-description { 
          color: rgba(255, 255, 255, 0.85) !important; 
        }
        .contact-item { 
          color: rgba(255, 255, 255, 0.95) !important; 
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Apply iOS fixes immediately
IOSHandler.applyIOSFixes();
